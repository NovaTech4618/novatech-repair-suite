-- Production hardening: dashboard/report accuracy and branch-aware metrics
create or replace function public.get_dashboard_summary()
returns table(
  repairs_today bigint,
  active_repairs bigint,
  completed_today bigint,
  cash_today numeric,
  outstanding_customer numeric,
  low_stock_count bigint,
  engineer_debit numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_day_start timestamptz;
  v_day_end timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then
    raise exception 'Company not found';
  end if;

  v_day_start := date_trunc('day', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos';
  v_day_end := v_day_start + interval '1 day';

  return query
  with accessible_branches as (
    select b.id
    from public.branches b
    where b.company_id = v_company_id
      and (
        public.user_has_branch_access(auth.uid(), b.id)
        or exists (
          select 1
          from public.user_branches ub
          where ub.user_id = auth.uid()
            and ub.branch_id = b.id
            and ub.company_id = v_company_id
        )
      )
  ),
  repair_scope as (
    select r.*
    from public.repairs r
    where r.company_id = v_company_id
      and (
        r.branch_id is null
        or r.branch_id in (select id from accessible_branches)
      )
  ),
  payment_scope as (
    select rp.*
    from public.repair_payments rp
    where rp.company_id = v_company_id
      and exists (
        select 1
        from repair_scope r
        where r.id = rp.repair_id
      )
  ),
  sales_scope as (
    select s.*
    from public.sales s
    where s.company_id = v_company_id
      and (
        s.branch_id is null
        or s.branch_id in (select id from accessible_branches)
      )
  ),
  inventory_scope as (
    select i.*
    from public.inventory i
    where i.company_id = v_company_id
      and (
        i.branch_id is null
        or i.branch_id in (select id from accessible_branches)
      )
  ),
  cash as (
    select
      coalesce((select sum(p.amount) from payment_scope p where p.created_at >= v_day_start and p.created_at < v_day_end), 0)
      + coalesce((select sum(s.total) from sales_scope s where s.sale_date >= v_day_start and s.sale_date < v_day_end), 0) as amount
  )
  select
    (select count(*) from repair_scope r where r.created_at >= v_day_start and r.created_at < v_day_end),
    (select count(*) from repair_scope r where r.status not in ('Completed', 'Collected', 'Cancelled')),
    (select count(*) from repair_scope r where r.completed_at >= v_day_start and r.completed_at < v_day_end and r.status <> 'Cancelled'),
    cash.amount,
    coalesce((select sum(coalesce(v.outstanding, 0)) from public.repair_balance_view v where v.company_id = v_company_id), 0),
    (select count(*) from inventory_scope i where i.quantity <= i.minimum_stock),
    coalesce((select sum(coalesce(t.debit,0) - coalesce(t.credit,0)) from public.engineer_transactions t where t.company_id = v_company_id), 0)
  from cash;
end;
$$;

revoke execute on function public.get_dashboard_summary() from public, anon;
grant execute on function public.get_dashboard_summary() to authenticated;

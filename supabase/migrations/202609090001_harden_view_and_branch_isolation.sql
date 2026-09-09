-- NOVATECH production hardening: make reporting views tenant-safe and make
-- default branch assignment company-aware.
--
-- Views created by the database owner can otherwise bypass the caller's RLS
-- policies. security_invoker makes the underlying table policies apply to the
-- authenticated caller.
create or replace view public.repair_balance_view
with (security_invoker = true)
as
select
  r.id as repair_id,
  r.company_id,
  r.branch_id,
  r.device_id,
  r.status,
  coalesce(r.final_cost, r.estimated_cost, 0)::numeric as total_amount,
  coalesce(sum(rp.amount), 0)::numeric as paid_amount,
  greatest(
    coalesce(r.final_cost, r.estimated_cost, 0) - coalesce(sum(rp.amount), 0),
    0
  )::numeric as outstanding,
  case
    when coalesce(r.final_cost, r.estimated_cost, 0) <= coalesce(sum(rp.amount), 0) then 'Paid'
    when coalesce(sum(rp.amount), 0) > 0 then 'Partially paid'
    else 'Unpaid'
  end as payment_status
from public.repairs r
left join public.repair_payments rp on rp.repair_id = r.id
where coalesce(r.final_cost, r.estimated_cost, 0) > 0
group by r.id;

create or replace view public.repair_invoice_view
with (security_invoker = true)
as
select
  v.repair_id as id,
  v.company_id,
  v.branch_id,
  v.device_id,
  v.total_amount,
  v.paid_amount,
  v.outstanding,
  v.payment_status,
  r.issue,
  r.diagnosis,
  r.solution,
  r.received_at,
  r.completed_at,
  c.full_name as customer_name,
  c.phone as customer_phone,
  d.brand,
  d.model,
  d.imei
from public.repair_balance_view v
join public.repairs r on r.id = v.repair_id
join public.devices d on d.id = r.device_id
join public.customers c on c.id = d.customer_id;

create or replace view public.sale_receipt_view
with (security_invoker = true)
as
select
  s.id,
  s.company_id,
  s.branch_id,
  s.sale_date,
  s.customer_id,
  s.subtotal,
  s.discount,
  s.total,
  s.payment_method,
  s.staff_name,
  s.notes,
  c.full_name as customer_name,
  c.phone as customer_phone
from public.sales s
left join public.customers c on c.id = s.customer_id;

-- Keep the remaining reporting views tenant-safe as well. Their definitions
-- already exist earlier in the migration history, so only the security mode
-- needs to be applied here.
alter view public.engineer_performance_summary set (security_invoker = true);
alter view public.inventory_report_summary set (security_invoker = true);
alter view public.repair_report_summary set (security_invoker = true);
alter view public.sales_report_summary set (security_invoker = true);

-- The previous trigger could choose a branch belonging to another company if
-- bad/stale membership data ever existed. Always constrain the lookup to the
-- row's company before assigning a default branch.
create or replace function public.set_default_branch_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.branch_id is null then
    select ub.branch_id
      into new.branch_id
    from public.user_branches ub
    join public.branches b on b.id = ub.branch_id
    where ub.profile_id = auth.uid()
      and b.company_id = new.company_id
    order by ub.created_at asc
    limit 1;

    if new.branch_id is null then
      select b.id
        into new.branch_id
      from public.branches b
      where b.company_id = new.company_id
        and b.is_main = true
      order by b.created_at asc
      limit 1;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.set_default_branch_on_insert() from public, anon, authenticated;

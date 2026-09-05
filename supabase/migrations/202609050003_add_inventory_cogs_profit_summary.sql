create or replace function public.get_inventory_cogs(p_start timestamptz, p_end timestamptz)
returns table (
  cogs numeric,
  sales_cogs numeric,
  repair_cogs numeric,
  engineer_cogs numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;

  return query
  select
    coalesce(sum(case when movement_type in ('sale','repair_use','engineer_out') then total_cost else 0 end),0)
      - coalesce(sum(case when movement_type = 'engineer_return' then total_cost else 0 end),0),
    coalesce(sum(case when movement_type = 'sale' then total_cost else 0 end),0),
    coalesce(sum(case when movement_type = 'repair_use' then total_cost else 0 end),0),
    greatest(
      coalesce(sum(case when movement_type = 'engineer_out' then total_cost else 0 end),0)
        - coalesce(sum(case when movement_type = 'engineer_return' then total_cost else 0 end),0),
      0
    )
  from public.inventory_stock_movements
  where company_id = v_company_id
    and created_at >= p_start
    and created_at < p_end;
end;
$$;

revoke all on function public.get_inventory_cogs(timestamptz,timestamptz) from public, anon;
grant execute on function public.get_inventory_cogs(timestamptz,timestamptz) to authenticated;

create or replace function public.get_profit_summary(p_start timestamptz, p_end timestamptz)
returns table (
  total_revenue numeric,
  parts_cost numeric,
  operating_expenses numeric,
  engineer_cost numeric,
  net_profit numeric,
  cash_in numeric,
  transfer_in numeric,
  card_in numeric,
  other_in numeric,
  outstanding_customer numeric,
  engineer_outstanding numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_cogs numeric := 0;
begin
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;

  select cogs into v_cogs
  from public.get_inventory_cogs(p_start, p_end);

  select coalesce(sum(amount),0) into total_revenue
  from public.financial_transactions
  where company_id=v_company_id and direction='in'
    and category in ('sales','customer_payment','repair_payment')
    and occurred_at>=p_start and occurred_at<p_end;

  select coalesce(sum(amount),0) into operating_expenses
  from public.financial_transactions
  where company_id=v_company_id and direction='out'
    and category in ('salary','rent','utility','other')
    and occurred_at>=p_start and occurred_at<p_end;

  select coalesce(sum(amount),0) into engineer_cost
  from public.financial_transactions
  where company_id=v_company_id and direction='out'
    and category='engineer_payment'
    and occurred_at>=p_start and occurred_at<p_end;

  parts_cost := v_cogs;
  net_profit := total_revenue - v_cogs - operating_expenses - engineer_cost + coalesce((
    select sum(amount) from public.financial_transactions
    where company_id=v_company_id and direction='in' and category='other'
      and occurred_at>=p_start and occurred_at<p_end
  ),0);

  select coalesce(sum(amount),0) into cash_in from public.financial_transactions
    where company_id=v_company_id and direction='in' and lower(payment_method)='cash' and occurred_at>=p_start and occurred_at<p_end;
  select coalesce(sum(amount),0) into transfer_in from public.financial_transactions
    where company_id=v_company_id and direction='in' and lower(payment_method) in ('transfer','bank transfer') and occurred_at>=p_start and occurred_at<p_end;
  select coalesce(sum(amount),0) into card_in from public.financial_transactions
    where company_id=v_company_id and direction='in' and lower(payment_method) in ('pos','card') and occurred_at>=p_start and occurred_at<p_end;
  select coalesce(sum(amount),0) into other_in from public.financial_transactions
    where company_id=v_company_id and direction='in' and lower(payment_method) not in ('cash','transfer','bank transfer','pos','card') and occurred_at>=p_start and occurred_at<p_end;

  select coalesce(sum(greatest(coalesce(final_cost,0)-coalesce(deposit,0),0)),0)
    into outstanding_customer
  from public.repairs
  where company_id=v_company_id;

  select coalesce(sum(balance),0) into engineer_outstanding
  from public.get_engineer_balances();

  return next;
end;
$$;

revoke all on function public.get_profit_summary(timestamptz,timestamptz) from public, anon;
grant execute on function public.get_profit_summary(timestamptz,timestamptz) to authenticated;
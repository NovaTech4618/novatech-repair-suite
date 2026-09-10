-- Phase 6: Dashboard + Reports accuracy audit

-- 1. invoice_payments had zero sync to financial_transactions. Sales and
-- repair payments both had triggers pushing them into the ledger that
-- every report reads from; invoices did not. No live invoices exist yet
-- (Phase 5 audit confirmed 0), but the moment one gets paid, that money
-- would have been invisible to get_daily_profit_trend's "revenue" and
-- get_business_report's "cash_received". Mirrors the existing
-- sync_repair_payment_to_financial_ledger pattern exactly.
create or replace function public.sync_invoice_payment_to_financial_ledger()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_customer_name text; v_invoice_number text;
begin
  select c.full_name, i.invoice_number into v_customer_name, v_invoice_number
  from public.invoices i left join public.customers c on c.id = i.customer_id
  where i.id = new.invoice_id;

  insert into public.financial_transactions (
    company_id, direction, category, amount, payment_method, description,
    source_type, source_id, occurred_at, recorded_by
  ) values (
    new.company_id, 'in', 'customer_payment', new.amount, new.payment_method,
    'Invoice payment' || coalesce(' - ' || v_invoice_number, '') || coalesce(' - ' || v_customer_name, ''),
    'invoice_payment', new.id, coalesce(new.created_at, now()), new.recorded_by
  )
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set company_id=excluded.company_id, direction=excluded.direction, category=excluded.category,
    amount=excluded.amount, payment_method=excluded.payment_method, description=excluded.description,
    occurred_at=excluded.occurred_at, recorded_by=excluded.recorded_by;
  return new;
end;
$function$;

drop trigger if exists trg_sync_invoice_payment_to_financial on public.invoice_payments;
create trigger trg_sync_invoice_payment_to_financial
  after insert or update on public.invoice_payments
  for each row execute function public.sync_invoice_payment_to_financial_ledger();

-- 2. get_business_report.repair_revenue (and cash_received) were NOT
-- scoped to the report's [p_from, p_to) window - they summed ALL repairs
-- ever, regardless of the requested period, while repairs_received/
-- repairs_completed correctly used FILTER for the same window. Confirmed
-- with live data: default "this month" report showed the full all-time
-- repair total (₦33,000) instead of the correct month figure (₦16,000) -
-- a 2x overstatement that gets worse the longer the business runs.
-- Also widened cash_received to include invoice payments now that
-- they're tracked, so "money received" is one trustworthy number instead
-- of silently excluding a whole payment source.
create or replace function public.get_business_report(p_from timestamp with time zone DEFAULT date_trunc('month'::text, now()), p_to timestamp with time zone DEFAULT now())
returns table(sales_revenue numeric, repair_revenue numeric, cash_received numeric, inventory_cogs numeric, gross_profit numeric, repairs_received bigint, repairs_completed bigint, customer_outstanding numeric, low_stock_items bigint)
language sql
stable security definer
set search_path to 'public'
as $function$
with mine as (select public.get_my_company_id() company_id),
s as (select coalesce(sum(total),0) sales_revenue from sales s join mine m on m.company_id=s.company_id where s.sale_date>=p_from and s.sale_date<p_to),
r as (select coalesce(sum(coalesce(final_cost,estimated_cost,0)) filter (where created_at>=p_from and created_at<p_to), 0) repair_revenue,
             count(*) filter(where created_at>=p_from and created_at<p_to) repairs_received,
             count(*) filter(where completed_at>=p_from and completed_at<p_to) repairs_completed
      from repairs r join mine m on m.company_id=r.company_id),
p as (select coalesce(sum(rp.amount),0) as repair_cash from repair_payments rp join mine m on m.company_id=rp.company_id where rp.payment_date>=p_from and rp.payment_date<p_to),
ip as (select coalesce(sum(ip.amount),0) as invoice_cash from invoice_payments ip join mine m on m.company_id=ip.company_id where ip.created_at>=p_from and ip.created_at<p_to),
c as (select coalesce(sum(abs(m.quantity)*m.unit_cost),0) inventory_cogs from inventory_stock_movements m join mine x on x.company_id=m.company_id where m.movement_type in ('sale','repair_use','engineer_out') and m.created_at>=p_from and m.created_at<p_to),
o as (select coalesce(sum(outstanding),0) customer_outstanding from repair_balance_view v join mine m on m.company_id=v.company_id where v.outstanding>0),
l as (select count(*) low_stock_items from inventory i join mine m on m.company_id=i.company_id where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0))
select s.sales_revenue,r.repair_revenue,(p.repair_cash+ip.invoice_cash),c.inventory_cogs,(s.sales_revenue+r.repair_revenue-c.inventory_cogs) gross_profit,r.repairs_received,r.repairs_completed,o.customer_outstanding,l.low_stock_items from s,r,p,ip,c,o,l;
$function$;

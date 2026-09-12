-- NOVATECH security hardening: reporting/read-model views must never bypass RLS.
-- PostgreSQL views otherwise run with the view owner's privileges by default.

create or replace view public.repair_balance_view
with (security_invoker=true)
as
select
  r.id as repair_id,
  r.company_id,
  r.branch_id,
  r.device_id,
  r.status,
  coalesce(r.final_cost,r.estimated_cost,0)::numeric as total_amount,
  coalesce(sum(rp.amount),0)::numeric as paid_amount,
  greatest(coalesce(r.final_cost,r.estimated_cost,0)-coalesce(sum(rp.amount),0),0)::numeric as outstanding,
  case
    when coalesce(r.final_cost,r.estimated_cost,0)<=coalesce(sum(rp.amount),0) then 'Paid'
    when coalesce(sum(rp.amount),0)>0 then 'Partially paid'
    else 'Unpaid'
  end as payment_status
from public.repairs r
left join public.repair_payments rp on rp.repair_id=r.id
where coalesce(r.final_cost,r.estimated_cost,0)>0
group by r.id;

create or replace view public.repair_invoice_view
with (security_invoker=true)
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
join public.repairs r on r.id=v.repair_id
join public.devices d on d.id=r.device_id
join public.customers c on c.id=d.customer_id;

create or replace view public.sale_receipt_view
with (security_invoker=true)
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
left join public.customers c on c.id=s.customer_id;

-- Only authenticated users should be able to query these read models.
revoke all on public.repair_balance_view from public, anon;
revoke all on public.repair_invoice_view from public, anon;
revoke all on public.sale_receipt_view from public, anon;
grant select on public.repair_balance_view, public.repair_invoice_view, public.sale_receipt_view to authenticated;

-- Regression guard: these views must retain the security_invoker option.
do $$
declare
  v_options text[];
begin
  select c.reloptions into v_options
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='repair_balance_view' and c.relkind='v';
  if v_options is null or not ('security_invoker=true' = any(v_options)) then
    raise exception 'repair_balance_view security_invoker hardening missing';
  end if;
end $$;

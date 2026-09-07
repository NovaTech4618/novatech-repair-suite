-- NOVATECH: reporting, debt, invoice/receipt read models, dashboard truth, and FK indexes.
create index if not exists idx_repairs_company_created_at on public.repairs(company_id, created_at desc);
create index if not exists idx_repairs_company_status on public.repairs(company_id, status);
create index if not exists idx_repairs_company_engineer on public.repairs(company_id, engineer_id);
create index if not exists idx_repairs_branch_status on public.repairs(branch_id, status);
create index if not exists idx_repair_payments_repair_date on public.repair_payments(repair_id, payment_date desc);
create index if not exists idx_sales_company_date on public.sales(company_id, sale_date desc);
create index if not exists idx_sales_branch_date on public.sales(branch_id, sale_date desc);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_inventory on public.sale_items(inventory_id);
create index if not exists idx_inventory_company_branch on public.inventory(company_id, branch_id);
create index if not exists idx_inventory_low_stock on public.inventory(company_id, quantity, minimum_stock);
create index if not exists idx_stock_movements_inventory_date on public.inventory_stock_movements(inventory_id, created_at desc);
create index if not exists idx_stock_movements_company_date on public.inventory_stock_movements(company_id, created_at desc);
create index if not exists idx_engineer_tx_engineer_date on public.engineer_transactions(engineer_id, transaction_date desc);
create index if not exists idx_engineer_parts_out_engineer_item on public.engineer_parts_out(engineer_id, inventory_id);
create index if not exists idx_engineer_parts_in_engineer_item on public.engineer_parts_in(engineer_id, inventory_id);
create index if not exists idx_engineer_payments_engineer_date on public.engineer_payments(engineer_id, payment_date desc);
create index if not exists idx_financial_company_date on public.financial_transactions(company_id, occurred_at desc);
create index if not exists idx_financial_branch_date on public.financial_transactions(branch_id, occurred_at desc);
create index if not exists idx_profiles_company_active on public.profiles(company_id, is_active);
create index if not exists idx_user_branches_profile on public.user_branches(profile_id);
create index if not exists idx_user_branches_branch on public.user_branches(branch_id);
create index if not exists idx_audit_logs_company_date on public.audit_logs(company_id, created_at desc);

do $$ begin alter table public.repair_payments drop constraint if exists repair_payments_amount_nonnegative; alter table public.repair_payments add constraint repair_payments_amount_nonnegative check (amount > 0); exception when undefined_table then null; end $$;
do $$ begin alter table public.engineer_transactions drop constraint if exists engineer_transactions_amounts_nonnegative; alter table public.engineer_transactions add constraint engineer_transactions_amounts_nonnegative check (debit >= 0 and credit >= 0 and not (debit > 0 and credit > 0)); exception when undefined_table then null; end $$;
do $$ begin alter table public.inventory drop constraint if exists inventory_quantity_nonnegative; alter table public.inventory add constraint inventory_quantity_nonnegative check (coalesce(quantity,0) >= 0); exception when undefined_table then null; end $$;

create or replace view public.repair_balance_view as
select r.id as repair_id,r.company_id,r.branch_id,r.device_id,r.status,coalesce(r.final_cost,r.estimated_cost,0)::numeric as total_amount,coalesce(sum(rp.amount),0)::numeric as paid_amount,greatest(coalesce(r.final_cost,r.estimated_cost,0)-coalesce(sum(rp.amount),0),0)::numeric as outstanding,case when coalesce(r.final_cost,r.estimated_cost,0)<=coalesce(sum(rp.amount),0) then 'Paid' when coalesce(sum(rp.amount),0)>0 then 'Partially paid' else 'Unpaid' end as payment_status
from public.repairs r left join public.repair_payments rp on rp.repair_id=r.id where coalesce(r.final_cost,r.estimated_cost,0)>0 group by r.id;

create or replace function public.get_dashboard_summary()
returns table(repairs_today bigint,active_repairs bigint,completed_today bigint,cash_today numeric,outstanding_customer numeric,low_stock_count bigint,engineer_debit numeric)
language sql stable security definer set search_path='public' as $$
with mine as(select public.get_my_company_id() company_id),today as(select date_trunc('day',now()) started),repair_counts as(select count(*) filter(where r.created_at>=(select started from today)) repairs_today,count(*) filter(where r.status not in ('Completed','Collected')) active_repairs,count(*) filter(where r.completed_at>=(select started from today)) completed_today from repairs r join mine m on m.company_id=r.company_id),cash as(select coalesce(sum(x.amount),0) cash_today from(select rp.amount from repair_payments rp join mine m on m.company_id=rp.company_id where rp.payment_date>=(select started from today) union all select coalesce(s.total,0) from sales s join mine m on m.company_id=s.company_id where s.sale_date>=(select started from today))x),outstanding as(select coalesce(sum(outstanding),0) outstanding_customer from repair_balance_view v join mine m on m.company_id=v.company_id where v.outstanding>0),low as(select count(*) low_stock_count from inventory i join mine m on m.company_id=i.company_id where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0)),debt as(select coalesce(sum(debit-credit),0) engineer_debit from engineer_transactions t join mine m on m.company_id=t.company_id)
select rc.*,c.cash_today,o.outstanding_customer,l.low_stock_count,d.engineer_debit from repair_counts rc,cash c,outstanding o,low l,debt d; $$;
grant execute on function public.get_dashboard_summary() to authenticated; revoke execute on function public.get_dashboard_summary() from anon;

create or replace function public.get_business_report(p_from timestamptz default date_trunc('month',now()),p_to timestamptz default now())
returns table(sales_revenue numeric,repair_revenue numeric,cash_received numeric,inventory_cogs numeric,gross_profit numeric,repairs_received bigint,repairs_completed bigint,customer_outstanding numeric,low_stock_items bigint)
language sql stable security definer set search_path='public' as $$
with mine as(select public.get_my_company_id() company_id),s as(select coalesce(sum(total),0) sales_revenue from sales s join mine m on m.company_id=s.company_id where s.sale_date>=p_from and s.sale_date<p_to),r as(select coalesce(sum(coalesce(final_cost,estimated_cost,0)),0) repair_revenue,count(*) filter(where created_at>=p_from and created_at<p_to) repairs_received,count(*) filter(where completed_at>=p_from and completed_at<p_to) repairs_completed from repairs r join mine m on m.company_id=r.company_id),p as(select coalesce(sum(rp.amount),0) cash_received from repair_payments rp join mine m on m.company_id=rp.company_id where rp.payment_date>=p_from and rp.payment_date<p_to),c as(select coalesce(sum(abs(m.quantity)*m.unit_cost),0) inventory_cogs from inventory_stock_movements m join mine x on x.company_id=m.company_id where m.movement_type in('sale','repair_use','engineer_out') and m.created_at>=p_from and m.created_at<p_to),o as(select coalesce(sum(outstanding),0) customer_outstanding from repair_balance_view v join mine m on m.company_id=v.company_id where v.outstanding>0),l as(select count(*) low_stock_items from inventory i join mine m on m.company_id=i.company_id where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0))
select s.sales_revenue,r.repair_revenue,p.cash_received,c.inventory_cogs,(s.sales_revenue+r.repair_revenue-c.inventory_cogs) gross_profit,r.repairs_received,r.repairs_completed,o.customer_outstanding,l.low_stock_items from s,r,p,c,o,l; $$;
grant execute on function public.get_business_report(timestamptz,timestamptz) to authenticated; revoke execute on function public.get_business_report(timestamptz,timestamptz) from anon;

create or replace view public.repair_invoice_view as select v.repair_id as id,v.company_id,v.branch_id,v.device_id,v.total_amount,v.paid_amount,v.outstanding,v.payment_status,r.issue,r.diagnosis,r.solution,r.received_at,r.completed_at,c.full_name as customer_name,c.phone as customer_phone,d.brand,d.model,d.imei from repair_balance_view v join repairs r on r.id=v.repair_id join devices d on d.id=r.device_id join customers c on c.id=d.customer_id;
create or replace view public.sale_receipt_view as select s.id,s.company_id,s.branch_id,s.sale_date,s.customer_id,s.subtotal,s.discount,s.total,s.payment_method,s.staff_name,s.notes,c.full_name as customer_name,c.phone as customer_phone from sales s left join customers c on c.id=s.customer_id;

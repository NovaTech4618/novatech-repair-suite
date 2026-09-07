-- Tighten direct table access: operational writes must go through secured workflows.
drop policy if exists "repair_parts_usage_insert" on public.repair_parts_usage;
create policy "repair_parts_usage_insert" on public.repair_parts_usage
for insert to authenticated
with check (
  company_id = public.get_my_company_id()
  and public.has_permission('repairs.manage')
  and exists (
    select 1 from public.repairs r
    where r.id = repair_parts_usage.repair_id
      and r.company_id = public.get_my_company_id()
      and public.user_has_branch_access(r.branch_id)
  )
);

alter table public.repair_payments drop constraint if exists repair_payments_amount_positive;
alter table public.repair_payments add constraint repair_payments_amount_positive check (amount > 0);

alter table public.customer_debt_ledger drop constraint if exists customer_debt_ledger_nonnegative;
alter table public.customer_debt_ledger add constraint customer_debt_ledger_nonnegative check (debit >= 0 and credit >= 0);

-- Strengthen the sale workflow so a known customer must belong to the same company.
create or replace function public.create_sale(p_customer_id uuid, p_payment_method text, p_discount numeric, p_staff_name text, p_notes text, p_items jsonb)
returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare v_company_id uuid; v_user uuid; v_sale uuid; v_subtotal numeric:=0; v_total numeric; v_item jsonb; v_inventory_id uuid; v_qty integer; v_unit numeric; v_cost numeric; v_available integer; v_branch uuid; v_sale_branch uuid;
begin
 v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
 select company_id into v_company_id from public.profiles where id=v_user;
 if v_company_id is null then raise exception 'Company not found'; end if;
 if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company_id) then raise exception 'Customer not found'; end if;
 if jsonb_array_length(coalesce(p_items,'[]'::jsonb))=0 then raise exception 'Sale must contain at least one item'; end if;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_inventory_id:=(v_item->>'inventory_id')::uuid; v_qty:=(v_item->>'quantity')::integer; v_unit:=(v_item->>'unit_price')::numeric;
  if v_qty<=0 or v_unit<0 then raise exception 'Invalid sale item'; end if;
  select quantity,branch_id into v_available,v_branch from public.inventory where id=v_inventory_id and company_id=v_company_id for update;
  if not found then raise exception 'Inventory item not found: %',v_inventory_id; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if v_available<v_qty then raise exception 'Insufficient stock: have %, need %',v_available,v_qty; end if;
  if v_sale_branch is null then v_sale_branch:=v_branch; elsif v_branch is distinct from v_sale_branch then raise exception 'A sale cannot combine stock from different branches'; end if;
  v_subtotal:=v_subtotal+(v_qty*v_unit);
 end loop;
 if coalesce(p_discount,0)<0 then raise exception 'Discount cannot be negative'; end if;
 v_total:=v_subtotal-coalesce(p_discount,0); if v_total<0 then raise exception 'Sale total cannot be negative'; end if;
 insert into public.sales(company_id,branch_id,customer_id,sale_date,payment_method,subtotal,discount,total,staff_name,notes) values(v_company_id,v_sale_branch,p_customer_id,now(),p_payment_method,v_subtotal,coalesce(p_discount,0),v_total,p_staff_name,p_notes) returning id into v_sale;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_inventory_id:=(v_item->>'inventory_id')::uuid; v_qty:=(v_item->>'quantity')::integer; v_unit:=(v_item->>'unit_price')::numeric;
  select coalesce(cost_price,0) into v_cost from public.inventory where id=v_inventory_id and company_id=v_company_id;
  insert into public.sale_items(sale_id,inventory_id,quantity,unit_price,total_price) values(v_sale,v_inventory_id,v_qty,v_unit,v_qty*v_unit);
  perform public.record_inventory_movement(v_inventory_id,'sale',v_qty,v_cost,'sale',v_sale,null);
 end loop;
 return v_sale;
end;
$function$;
revoke execute on function public.create_sale(uuid,text,numeric,text,text,jsonb) from anon;
grant execute on function public.create_sale(uuid,text,numeric,text,text,jsonb) to authenticated;

-- Direct payment RPC validation (UI validation is not a security boundary).
create or replace function public.record_repair_payment(p_repair_id uuid, p_amount numeric, p_payment_method text default 'Cash', p_payment_date timestamptz default now(), p_notes text default null)
returns table(payment_id uuid, repair_id uuid, amount numeric, total_cost numeric, total_paid numeric, outstanding numeric, payment_status text)
language plpgsql security definer set search_path to 'public'
as $function$
declare v_company_id uuid; v_total_cost numeric(14,2); v_paid numeric(14,2); v_payment_id uuid; v_user_id uuid:=auth.uid(); v_branch uuid;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
 if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
 select r.company_id,coalesce(r.final_cost,r.estimated_cost,0),r.branch_id into v_company_id,v_total_cost,v_branch from public.repairs r where r.id=p_repair_id;
 if v_company_id is null then raise exception 'Repair not found'; end if;
 if v_company_id<>public.get_my_company_id() then raise exception 'Repair does not belong to your company'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_total_cost<0 then raise exception 'Repair cost cannot be negative'; end if;
 select coalesce(sum(rp.amount),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id;
 if v_paid+p_amount>v_total_cost then raise exception 'Payment exceeds outstanding repair balance. Outstanding: %',greatest(v_total_cost-v_paid,0); end if;
 insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,notes,recorded_by) values(v_company_id,p_repair_id,p_amount,coalesce(nullif(trim(p_payment_method),''),'Cash'),coalesce(p_payment_date,now()),p_notes,v_user_id) returning id into v_payment_id;
 update public.repairs set deposit=v_paid+p_amount where id=p_repair_id;
 return query select v_payment_id,p_repair_id,p_amount,v_total_cost,v_paid+p_amount,greatest(v_total_cost-(v_paid+p_amount),0),case when v_total_cost=0 or v_paid+p_amount>=v_total_cost then 'Paid' when v_paid+p_amount>0 then 'Partially paid' else 'Unpaid' end;
end;
$function$;
revoke execute on function public.record_repair_payment(uuid,numeric,text,timestamptz,text) from anon;
grant execute on function public.record_repair_payment(uuid,numeric,text,timestamptz,text) to authenticated;
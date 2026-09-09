-- Phase 5: invoice integrity, branch isolation, and payment idempotency hardening.

create unique index if not exists invoice_payments_company_idempotency_key_idx
  on public.invoice_payments(company_id,idempotency_key)
  where idempotency_key is not null;

create or replace function public.create_invoice(
  p_invoice_number text,
  p_customer_id uuid default null,
  p_repair_id uuid default null,
  p_sale_id uuid default null,
  p_subtotal numeric default 0,
  p_discount numeric default 0,
  p_total numeric default 0,
  p_due_at timestamptz default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_company uuid; v_branch uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company:=public.get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  if p_subtotal<0 or p_discount<0 or p_total<0 or p_discount>p_subtotal then raise exception 'Invalid invoice amounts'; end if;
  if round(p_total,2) <> round(p_subtotal-p_discount,2) then raise exception 'Invoice total must equal subtotal minus discount'; end if;
  if p_customer_id is not null and not exists(select 1 from customers where id=p_customer_id and company_id=v_company) then raise exception 'Customer not found'; end if;
  if p_repair_id is not null then
    select branch_id into v_branch from repairs where id=p_repair_id and company_id=v_company;
    if not found then raise exception 'Repair not found'; end if;
  elsif p_sale_id is not null then
    select branch_id into v_branch from sales where id=p_sale_id and company_id=v_company;
    if not found then raise exception 'Sale not found'; end if;
  end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  insert into invoices(company_id,branch_id,customer_id,repair_id,sale_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,p_customer_id,p_repair_id,p_sale_id,trim(p_invoice_number),p_subtotal,p_discount,p_total,p_due_at,p_notes,auth.uid())
  returning id into v_id;
  if p_customer_id is not null and p_total>0 then
    perform public.record_customer_debt(p_customer_id,'invoice',v_id,p_total,0,v_id,v_branch,'Invoice issued');
  end if;
  return v_id;
end; $$;
revoke all on function public.create_invoice(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text) from public,anon;
grant execute on function public.create_invoice(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text) to authenticated;

create or replace function public.create_invoice_with_item(
  p_invoice_number text,
  p_customer_id uuid default null,
  p_repair_id uuid default null,
  p_sale_id uuid default null,
  p_subtotal numeric default 0,
  p_discount numeric default 0,
  p_total numeric default 0,
  p_due_at timestamptz default null,
  p_notes text default null,
  p_description text default 'Repair / service',
  p_quantity numeric default 1,
  p_unit_price numeric default 0
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_company uuid; v_branch uuid; v_line_total numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  if p_quantity <= 0 or p_unit_price < 0 or trim(coalesce(p_description,''))='' then raise exception 'Invalid invoice item'; end if;
  v_line_total := round(p_quantity*p_unit_price,2);
  if p_subtotal < 0 or p_discount < 0 or p_total < 0 or p_discount > p_subtotal then raise exception 'Invalid invoice amounts'; end if;
  if round(p_subtotal,2) <> v_line_total then raise exception 'Invoice subtotal must equal its item total'; end if;
  if round(p_total,2) <> round(p_subtotal-p_discount,2) then raise exception 'Invoice total must equal subtotal minus discount'; end if;
  if p_customer_id is not null and not exists(select 1 from customers where id=p_customer_id and company_id=v_company) then raise exception 'Customer not found'; end if;
  if p_repair_id is not null then
    select branch_id into v_branch from repairs where id=p_repair_id and company_id=v_company;
    if not found then raise exception 'Repair not found'; end if;
  elsif p_sale_id is not null then
    select branch_id into v_branch from sales where id=p_sale_id and company_id=v_company;
    if not found then raise exception 'Sale not found'; end if;
  end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  insert into invoices(company_id,branch_id,customer_id,repair_id,sale_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,p_customer_id,p_repair_id,p_sale_id,trim(p_invoice_number),p_subtotal,p_discount,p_total,p_due_at,p_notes,auth.uid())
  returning id into v_id;
  insert into invoice_items(invoice_id,company_id,description,quantity,unit_price)
  values(v_id,v_company,trim(p_description),p_quantity,p_unit_price);
  if p_customer_id is not null and p_total > 0 then
    perform public.record_customer_debt(p_customer_id,'invoice',v_id,p_total,0,v_id,v_branch,'Invoice issued');
  end if;
  return v_id;
end; $$;
revoke all on function public.create_invoice_with_item(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text,text,numeric,numeric) from public,anon;
grant execute on function public.create_invoice_with_item(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text,text,numeric,numeric) to authenticated;

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text default 'cash',
  p_notes text default null,
  p_idempotency_key uuid default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_customer uuid; v_branch uuid; v_total numeric; v_paid numeric; v_id uuid; v_existing uuid; v_user uuid:=auth.uid(); v_key uuid:=coalesce(p_idempotency_key,gen_random_uuid()); v_status text;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
  if p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  v_company:=public.get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;
  if p_idempotency_key is not null then
    select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=p_idempotency_key;
    if v_existing is not null then return v_existing; end if;
  end if;
  select company_id,customer_id,branch_id,total,status into v_company,v_customer,v_branch,v_total,v_status from public.invoices where id=p_invoice_id and company_id=v_company for update;
  if not found then raise exception 'Invoice not found'; end if;
  if v_status='void' then raise exception 'Cannot record payment on a void invoice'; end if;
  if not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(amount),0) into v_paid from public.invoice_payments where invoice_id=p_invoice_id and company_id=v_company;
  if p_amount>greatest(v_total-v_paid,0) then raise exception 'Payment exceeds invoice balance. Remaining: %',greatest(v_total-v_paid,0); end if;
  insert into public.invoice_payments(company_id,branch_id,invoice_id,customer_id,amount,payment_method,notes,recorded_by,idempotency_key) values(v_company,v_branch,p_invoice_id,v_customer,p_amount,p_payment_method,p_notes,v_user,v_key) returning id into v_id;
  if v_customer is not null then perform public.record_customer_debt(v_customer,'payment',v_id,0,p_amount,p_invoice_id,v_branch,'Payment for invoice '||p_invoice_id::text); end if;
  insert into public.financial_transactions(company_id,branch_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at,recorded_by) values(v_company,v_branch,'in','customer_payment',p_amount,p_payment_method,'Payment received for invoice '||p_invoice_id::text,'invoice_payment',v_id,now(),v_user);
  update public.invoices set status=case when v_paid+p_amount>=v_total then 'paid' when v_paid+p_amount>0 then 'part_paid' else 'issued' end where id=p_invoice_id;
  return v_id;
exception when unique_violation then
  select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=v_key;
  if v_existing is not null then return v_existing; end if;
  raise;
end; $$;
revoke all on function public.record_invoice_payment(uuid,numeric,text,text,uuid) from public,anon;
grant execute on function public.record_invoice_payment(uuid,numeric,text,text,uuid) to authenticated;

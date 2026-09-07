CREATE OR REPLACE FUNCTION public.record_customer_debt(p_customer_id uuid,p_source_type text,p_source_id uuid DEFAULT NULL,p_debit numeric DEFAULT 0,p_credit numeric DEFAULT 0,p_invoice_id uuid DEFAULT NULL,p_branch_id uuid DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare v_company uuid; v_id uuid; v_user uuid:=auth.uid(); v_balance numeric;
begin
 if v_user is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
 v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company) then raise exception 'Customer not found'; end if;
 if p_source_type not in ('invoice','repair','sale','payment','adjustment') then raise exception 'Invalid debt source type'; end if;
 if p_debit<0 or p_credit<0 or (p_debit>0 and p_credit>0) or (p_debit=0 and p_credit=0) then raise exception 'Invalid debit/credit'; end if;
 if p_branch_id is not null then
  if not exists(select 1 from public.branches where id=p_branch_id and company_id=v_company) then raise exception 'Branch not found'; end if;
  if not public.user_has_branch_access(p_branch_id) then raise exception 'Branch access denied'; end if;
 end if;
 if p_invoice_id is not null and not exists(select 1 from public.invoices where id=p_invoice_id and company_id=v_company and (customer_id=p_customer_id or customer_id is null)) then raise exception 'Invoice not found'; end if;
 if p_source_id is not null then
  if p_source_type='invoice' and not exists(select 1 from public.invoices where id=p_source_id and company_id=v_company and (customer_id=p_customer_id or customer_id is null)) then raise exception 'Source invoice not found'; end if;
  if p_source_type='repair' and not exists(select 1 from public.repairs r join public.devices d on d.id=r.device_id where r.id=p_source_id and r.company_id=v_company and d.customer_id=p_customer_id) then raise exception 'Source repair not found'; end if;
  if p_source_type='sale' and not exists(select 1 from public.sales where id=p_source_id and company_id=v_company and customer_id=p_customer_id) then raise exception 'Source sale not found'; end if;
 end if;
 if p_credit>0 then
  select coalesce(sum(debit-credit),0) into v_balance from public.customer_debt_ledger where company_id=v_company and customer_id=p_customer_id;
  if p_credit>v_balance then raise exception 'Credit exceeds outstanding customer balance. Outstanding: %',greatest(v_balance,0); end if;
 end if;
 insert into public.customer_debt_ledger(company_id,customer_id,invoice_id,source_type,source_id,debit,credit,branch_id,notes,created_by) values(v_company,p_customer_id,p_invoice_id,p_source_type,p_source_id,p_debit,p_credit,p_branch_id,p_notes,v_user) returning id into v_id;
 return v_id;
end; $$;

CREATE OR REPLACE FUNCTION public.record_repair_payment(p_repair_id uuid,p_amount numeric,p_payment_method text DEFAULT 'Cash',p_payment_date timestamptz DEFAULT now(),p_notes text DEFAULT NULL)
RETURNS TABLE(payment_id uuid,repair_id uuid,amount numeric,total_cost numeric,total_paid numeric,outstanding numeric,payment_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare v_company_id uuid; v_total_cost numeric(14,2); v_paid numeric(14,2); v_payment_id uuid; v_user_id uuid:=auth.uid(); v_branch uuid;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
 if lower(trim(coalesce(p_payment_method,''))) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 select r.company_id,coalesce(r.final_cost,r.estimated_cost,0),r.branch_id into v_company_id,v_total_cost,v_branch from public.repairs r where r.id=p_repair_id for update;
 if v_company_id is null then raise exception 'Repair not found'; end if;
 if v_company_id<>public.get_my_company_id() then raise exception 'Repair does not belong to your company'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_total_cost<0 then raise exception 'Repair cost cannot be negative'; end if;
 select coalesce(sum(rp.amount),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id;
 if v_paid+p_amount>v_total_cost then raise exception 'Payment exceeds outstanding repair balance. Outstanding: %',greatest(v_total_cost-v_paid,0); end if;
 insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,notes,recorded_by) values(v_company_id,p_repair_id,p_amount,lower(trim(coalesce(p_payment_method,'cash'))),coalesce(p_payment_date,now()),p_notes,v_user_id) returning id into v_payment_id;
 update public.repairs set deposit=v_paid+p_amount where id=p_repair_id;
 return query select v_payment_id,p_repair_id,p_amount,v_total_cost,v_paid+p_amount,greatest(v_total_cost-(v_paid+p_amount),0),case when v_total_cost=0 or v_paid+p_amount>=v_total_cost then 'Paid' when v_paid+p_amount>0 then 'Partially paid' else 'Unpaid' end;
end; $$;

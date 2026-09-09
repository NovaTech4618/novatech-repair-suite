-- Phase 1: Authentication + Tenant Security audit
-- Found and fixed 4 branch-restriction bypass gaps: functions that correctly
-- scoped by company_id but skipped the user_has_branch_access() check, so a
-- staff member restricted to one branch could act on another branch's data
-- within the same company.

-- 1. send_repair_quote: was missing branch access check before creating/sending a quote
create or replace function public.send_repair_quote(p_repair_id uuid, p_amount numeric, p_notes text default null::text, p_expires_at timestamp with time zone default null::timestamp with time zone)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_company uuid; v_branch uuid; v_quote uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 v_company := public.get_my_company_id();
 select branch_id into v_branch from public.repairs where id=p_repair_id and company_id=v_company for update;
 if not found then raise exception 'Repair not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if p_amount is null or p_amount < 0 then raise exception 'Quote amount cannot be negative'; end if;
 insert into public.repair_quotes(company_id,branch_id,repair_id,amount,notes,status,sent_at,expires_at,created_by)
 values(v_company,v_branch,p_repair_id,p_amount,p_notes,'sent',now(),p_expires_at,auth.uid())
 on conflict(repair_id) do update set amount=excluded.amount,notes=excluded.notes,status='sent',sent_at=now(),expires_at=excluded.expires_at,updated_at=now()
 returning id into v_quote;
 insert into public.repair_approval_history(company_id,branch_id,repair_id,quote_id,action,amount,notes,acted_by) values(v_company,v_branch,p_repair_id,v_quote,'sent',p_amount,p_notes,auth.uid());
 update public.repairs set estimated_cost=p_amount,status='Estimate Sent' where id=p_repair_id;
 return v_quote;
end; $function$;

-- 2. respond_to_repair_quote: was missing branch access check before approving/rejecting
create or replace function public.respond_to_repair_quote(p_quote_id uuid, p_action text, p_notes text default null::text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_company uuid; v_repair uuid; v_branch uuid; v_amount numeric; v_status text; v_action text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_company := public.get_my_company_id();
 v_action := lower(trim(p_action));
 if v_action not in ('approved','rejected') then raise exception 'Invalid quote response'; end if;
 select repair_id,branch_id,amount,status into v_repair,v_branch,v_amount,v_status from public.repair_quotes where id=p_quote_id and company_id=v_company for update;
 if not found then raise exception 'Quote not found'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_status <> 'sent' then raise exception 'Quote is not awaiting a response'; end if;
 update public.repair_quotes set status=v_action, approved_at=case when v_action='approved' then now() else null end, rejected_at=case when v_action='rejected' then now() else null end, approved_by=auth.uid(), updated_at=now() where id=p_quote_id;
 insert into public.repair_approval_history(company_id,branch_id,repair_id,quote_id,action,amount,notes,acted_by) values(v_company,v_branch,v_repair,p_quote_id,v_action,v_amount,p_notes,auth.uid());
 update public.repairs set status=case when v_action='approved' then 'Customer Approved' else 'Received' end, estimated_cost=v_amount where id=v_repair;
 return p_quote_id;
end; $function$;

-- 3. return_repair_part_usage: was missing branch access check on the underlying repair
create or replace function public.return_repair_part_usage(p_usage_id uuid, p_quantity integer, p_notes text default null::text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_company_id uuid;
  v_usage public.repair_parts_usage%rowtype;
  v_item_name text;
  v_engineer_id uuid;
  v_repair_branch uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;

  select * into v_usage
  from public.repair_parts_usage
  where id = p_usage_id and company_id = v_company_id
  for update;
  if not found then raise exception 'Repair part usage not found'; end if;
  if p_quantity > v_usage.quantity_used - v_usage.quantity_returned then raise exception 'Return exceeds outstanding used quantity'; end if;

  select r.branch_id into v_repair_branch from public.repairs r where r.id = v_usage.repair_id and r.company_id = v_company_id;
  if v_repair_branch is not null and not public.user_has_branch_access(v_repair_branch) then raise exception 'Branch access denied'; end if;

  v_engineer_id := v_usage.engineer_id;
  if v_engineer_id is null then
    select r.engineer_id into v_engineer_id from public.repairs r where r.id = v_usage.repair_id and r.company_id = v_company_id;
  end if;
  if v_engineer_id is null then raise exception 'No engineer is linked to this repair part usage'; end if;

  select i.item_name into v_item_name from public.inventory i where i.id = v_usage.inventory_id and i.company_id = v_company_id;
  if v_item_name is null then raise exception 'Inventory item not found'; end if;

  perform public.record_inventory_movement(v_usage.inventory_id, 'repair_return', p_quantity, v_usage.unit_cost, 'repair_part_return', v_usage.id, coalesce(p_notes, 'Returned unused repair part'));

  insert into public.engineer_transactions(company_id, engineer_id, transaction_type, reference_id, description, debit, credit, transaction_date, notes, created_by)
  values(v_company_id, v_engineer_id, 'parts_in', v_usage.id, p_quantity || ' × ' || v_item_name || ' · Repair return', 0, p_quantity * v_usage.unit_cost, now(), p_notes, (select auth.uid()));

  update public.repair_parts_usage
  set quantity_returned = quantity_returned + p_quantity,
      engineer_id = v_engineer_id,
      updated_at = now(),
      notes = coalesce(p_notes, notes)
  where id = p_usage_id;

  return p_usage_id;
end;
$function$;

-- 4. record_invoice_payment (4-arg overload): dead code (frontend only calls the 5-arg
-- idempotency_key version) that was missing the branch check its sibling has. Drop it
-- entirely rather than leave an unused, exploitable hole reachable via raw REST/RPC.
drop function if exists public.record_invoice_payment(uuid, numeric, text, text);

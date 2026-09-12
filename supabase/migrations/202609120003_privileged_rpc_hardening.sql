-- NOVATECH privileged-RPC / workflow-boundary hardening.
-- Keep authoritative business mutations behind permission-checked RPCs.

-- Repair part usage is created by record_repair_part_usage(), not direct Data API inserts.
revoke insert on public.repair_parts_usage from authenticated, anon, public;
revoke update, delete on public.repair_parts_usage from authenticated, anon, public;

-- Repair assignment state must be changed through assign_repair_engineer().
revoke insert on public.repair_assignments from authenticated, anon, public;
revoke update, delete on public.repair_assignments from authenticated, anon, public;

-- Invoice creation/items are already consumed through create_invoice* / add_invoice_item RPCs.
revoke insert on public.invoices from authenticated, anon, public;
revoke update, delete on public.invoices from authenticated, anon, public;
revoke insert on public.invoice_items from authenticated, anon, public;
revoke update, delete on public.invoice_items from authenticated, anon, public;

-- Receivables must flow through record_customer_debt() and source-specific triggers.
revoke insert on public.customer_debt_ledger from authenticated, anon, public;
revoke update, delete on public.customer_debt_ledger from authenticated, anon, public;

-- Strengthen repair-part RPCs: caller must have repair-management permission and
-- must be allowed to operate on the repair's branch as well as the inventory branch.
create or replace function public.record_repair_part_usage(
  p_repair_id uuid,
  p_inventory_id uuid,
  p_quantity integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_company_id uuid;
  v_repair_company uuid;
  v_repair_branch uuid;
  v_inventory_company uuid;
  v_inventory_branch uuid;
  v_available integer;
  v_cost numeric;
  v_usage_id uuid;
begin
  v_company_id:=public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;

  select company_id,branch_id into v_repair_company,v_repair_branch
  from public.repairs where id=p_repair_id;
  if v_repair_company is null or v_repair_company<>v_company_id then raise exception 'Repair not found'; end if;
  if v_repair_branch is not null and not public.user_has_branch_access(v_repair_branch) then raise exception 'Repair branch access denied'; end if;

  select company_id,branch_id,quantity,coalesce(cost_price,0)
  into v_inventory_company,v_inventory_branch,v_available,v_cost
  from public.inventory where id=p_inventory_id for update;
  if v_inventory_company is null or v_inventory_company<>v_company_id then raise exception 'Inventory item not found'; end if;
  if v_inventory_branch is not null and not public.user_has_branch_access(v_inventory_branch) then raise exception 'Inventory branch access denied'; end if;
  if v_available<p_quantity then raise exception 'Insufficient stock'; end if;

  insert into public.repair_parts_usage(company_id,repair_id,inventory_id,quantity_used,unit_cost,notes,created_by)
  values(v_company_id,p_repair_id,p_inventory_id,p_quantity,v_cost,p_notes,auth.uid())
  returning id into v_usage_id;

  perform public.record_inventory_movement(
    p_inventory_id,'repair_use',p_quantity,v_cost,'repair_part_usage',v_usage_id,p_notes
  );
  return v_usage_id;
end;
$$;

create or replace function public.return_repair_part_usage(
  p_usage_id uuid,
  p_quantity integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_company_id uuid;
  v_usage public.repair_parts_usage%rowtype;
  v_repair_branch uuid;
  v_movement_id uuid;
begin
  v_company_id:=public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;

  select * into v_usage
  from public.repair_parts_usage
  where id=p_usage_id and company_id=v_company_id
  for update;
  if not found then raise exception 'Repair part usage not found'; end if;

  select branch_id into v_repair_branch from public.repairs where id=v_usage.repair_id and company_id=v_company_id;
  if v_repair_branch is not null and not public.user_has_branch_access(v_repair_branch) then raise exception 'Repair branch access denied'; end if;
  if p_quantity>v_usage.quantity_used-v_usage.quantity_returned then raise exception 'Return exceeds outstanding used quantity'; end if;

  v_movement_id:=public.record_inventory_movement(
    v_usage.inventory_id,'repair_return',p_quantity,v_usage.unit_cost,'repair_part_return',v_usage.id,coalesce(p_notes,'Returned unused repair part')
  );

  update public.repair_parts_usage
  set quantity_returned=quantity_returned+p_quantity,updated_at=now(),notes=coalesce(p_notes,notes)
  where id=p_usage_id;
  return v_movement_id;
end;
$$;

revoke execute on function public.record_repair_part_usage(uuid,uuid,integer,text) from public,anon;
revoke execute on function public.return_repair_part_usage(uuid,integer,text) from public,anon;
grant execute on function public.record_repair_part_usage(uuid,uuid,integer,text) to authenticated;
grant execute on function public.return_repair_part_usage(uuid,integer,text) to authenticated;

-- Explicitly keep the internal audit writer trigger-only. Client code may retain
-- a legacy wrapper, but the database must reject direct authoritative audit writes.
revoke execute on function public.write_audit_log(text,text,uuid,jsonb,jsonb,jsonb) from authenticated,anon,public;

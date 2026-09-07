alter table public.repair_parts_usage
  add column if not exists engineer_id uuid references public.engineers(id);

update public.repair_parts_usage rpu
set engineer_id = r.engineer_id
from public.repairs r
where r.id = rpu.repair_id
  and rpu.engineer_id is null
  and r.engineer_id is not null;

create index if not exists idx_repair_parts_usage_engineer
  on public.repair_parts_usage(company_id, engineer_id, repair_id);

create or replace function public.record_repair_part_usage(
  p_repair_id uuid,
  p_inventory_id uuid,
  p_quantity integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_repair_company uuid;
  v_repair_branch uuid;
  v_engineer_id uuid;
  v_inventory_company uuid;
  v_inventory_branch uuid;
  v_available integer;
  v_cost numeric;
  v_item_name text;
  v_usage_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;

  select r.company_id, r.branch_id, r.engineer_id
    into v_repair_company, v_repair_branch, v_engineer_id
  from public.repairs r where r.id = p_repair_id;

  if v_repair_company is null or v_repair_company <> v_company_id then raise exception 'Repair not found'; end if;
  if v_repair_branch is not null and not public.user_has_branch_access(v_repair_branch) then raise exception 'Branch access denied'; end if;
  if v_engineer_id is null then raise exception 'Assign an engineer before issuing parts'; end if;
  if not exists (select 1 from public.engineers e where e.id=v_engineer_id and e.company_id=v_company_id and e.status='active') then raise exception 'Assigned engineer is not active'; end if;

  select i.company_id, i.branch_id, i.quantity, coalesce(i.cost_price,0), i.item_name
    into v_inventory_company, v_inventory_branch, v_available, v_cost, v_item_name
  from public.inventory i where i.id=p_inventory_id for update;

  if v_inventory_company is null or v_inventory_company <> v_company_id then raise exception 'Inventory item not found'; end if;
  if v_inventory_branch is not null and not public.user_has_branch_access(v_inventory_branch) then raise exception 'Branch access denied'; end if;
  if v_available < p_quantity then raise exception 'Insufficient stock. Available: %, Requested: %',v_available,p_quantity; end if;

  insert into public.repair_parts_usage(company_id,repair_id,inventory_id,engineer_id,quantity_used,quantity_returned,unit_cost,notes,created_by)
  values(v_company_id,p_repair_id,p_inventory_id,v_engineer_id,p_quantity,0,v_cost,p_notes,(select auth.uid()))
  returning id into v_usage_id;

  insert into public.engineer_transactions(company_id,engineer_id,transaction_type,reference_id,description,debit,credit,transaction_date,notes,created_by)
  values(v_company_id,v_engineer_id,'parts_out',v_usage_id,p_quantity||' × '||v_item_name||' · Repair',p_quantity*v_cost,0,now(),p_notes,(select auth.uid()));

  perform public.record_inventory_movement(p_inventory_id,'repair_use',p_quantity,v_cost,'repair_part_usage',v_usage_id,p_notes);
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
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_usage public.repair_parts_usage%rowtype;
  v_item_name text;
  v_engineer_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;

  select * into v_usage from public.repair_parts_usage where id=p_usage_id and company_id=v_company_id for update;
  if not found then raise exception 'Repair part usage not found'; end if;
  if p_quantity > v_usage.quantity_used-v_usage.quantity_returned then raise exception 'Return exceeds outstanding used quantity'; end if;

  v_engineer_id := v_usage.engineer_id;
  if v_engineer_id is null then select r.engineer_id into v_engineer_id from public.repairs r where r.id=v_usage.repair_id and r.company_id=v_company_id; end if;
  if v_engineer_id is null then raise exception 'No engineer is linked to this repair part usage'; end if;

  select i.item_name into v_item_name from public.inventory i where i.id=v_usage.inventory_id and i.company_id=v_company_id;
  if v_item_name is null then raise exception 'Inventory item not found'; end if;

  perform public.record_inventory_movement(v_usage.inventory_id,'repair_return',p_quantity,v_usage.unit_cost,'repair_part_return',v_usage.id,coalesce(p_notes,'Returned unused repair part'));

  insert into public.engineer_transactions(company_id,engineer_id,transaction_type,reference_id,description,debit,credit,transaction_date,notes,created_by)
  values(v_company_id,v_engineer_id,'parts_in',v_usage.id,p_quantity||' × '||v_item_name||' · Repair return',0,p_quantity*v_usage.unit_cost,now(),p_notes,(select auth.uid()));

  update public.repair_parts_usage
  set quantity_returned=quantity_returned+p_quantity, engineer_id=v_engineer_id, updated_at=now(), notes=coalesce(p_notes,notes)
  where id=p_usage_id;

  return p_usage_id;
end;
$$;

revoke execute on function public.record_repair_part_usage(uuid,uuid,integer,text) from anon;
revoke execute on function public.return_repair_part_usage(uuid,integer,text) from anon;
grant execute on function public.record_repair_part_usage(uuid,uuid,integer,text) to authenticated;
grant execute on function public.return_repair_part_usage(uuid,integer,text) to authenticated;

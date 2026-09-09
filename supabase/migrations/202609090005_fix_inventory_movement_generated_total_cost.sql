-- Fix sales/stock movement compatibility with generated total_cost.
-- inventory_stock_movements.total_cost is GENERATED ALWAYS, so it must not
-- be included in INSERT column/value lists.
create or replace function public.record_inventory_movement(
  p_inventory_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_unit_cost numeric default 0,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_company_id uuid;
  v_inventory_company uuid;
  v_branch_id uuid;
  v_available integer;
  v_delta integer;
  v_movement_id uuid;
begin
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;
  if p_movement_type not in ('opening','purchase','sale','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out') then raise exception 'Invalid movement type'; end if;
  if p_movement_type in ('opening','purchase','adjustment_in','adjustment_out') and not public.has_permission('inventory.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type = 'sale' and not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type in ('repair_use','repair_return') and not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type = 'engineer_out' and not public.has_permission('inventory.issue') then raise exception 'Permission denied'; end if;
  if p_movement_type = 'engineer_return' and not public.has_permission('inventory.return') then raise exception 'Permission denied'; end if;

  select company_id, branch_id, quantity into v_inventory_company, v_branch_id, v_available
  from public.inventory where id = p_inventory_id for update;
  if v_inventory_company is null or v_inventory_company <> v_company_id then raise exception 'Inventory item not found'; end if;
  if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;

  v_delta := case when p_movement_type in ('opening','purchase','repair_return','engineer_return','adjustment_in') then p_quantity else -p_quantity end;
  if v_available + v_delta < 0 then raise exception 'Insufficient stock'; end if;

  perform set_config('novatech.stock_movement', '1', true);
  update public.inventory set quantity = quantity + v_delta, updated_at = now() where id = p_inventory_id;
  perform set_config('novatech.stock_movement', '0', true);

  insert into public.inventory_stock_movements(company_id, inventory_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
  values(v_company_id, p_inventory_id, p_movement_type, v_delta, p_unit_cost, p_reference_type, p_reference_id, p_notes, auth.uid())
  returning id into v_movement_id;
  return v_movement_id;
exception when others then
  perform set_config('novatech.stock_movement', '0', true);
  raise;
end;
$$;

revoke execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from public, anon;
grant execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) to authenticated;

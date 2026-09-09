create or replace function public.create_inventory_transfer(p_inventory_id uuid, p_to_branch_id uuid, p_quantity integer, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_company uuid;
  v_from_branch uuid;
  v_to_company uuid;
  v_id uuid;
  v_stock integer;
  v_dest_id uuid;
  v_sku text;
  v_cost numeric;
begin
  v_company := get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if not has_permission('inventory.manage') then raise exception 'Permission denied'; end if;

  select company_id, branch_id, quantity, sku, cost_price
    into v_company, v_from_branch, v_stock, v_sku, v_cost
  from inventory where id = p_inventory_id for update;

  if v_company is null or v_company <> get_my_company_id() then raise exception 'Inventory item not found'; end if;
  if v_from_branch is null or not user_has_branch_access(v_from_branch) then raise exception 'Source branch access denied'; end if;

  select company_id into v_to_company from branches where id = p_to_branch_id and is_active = true;
  if v_to_company is null or v_to_company <> v_company then raise exception 'Destination branch invalid'; end if;
  if not user_has_branch_access(p_to_branch_id) then raise exception 'Destination branch access denied'; end if;
  if v_from_branch = p_to_branch_id then raise exception 'Source and destination branches must differ'; end if;
  if v_stock < p_quantity then raise exception 'Insufficient stock'; end if;

  insert into inventory_transfers(company_id, inventory_id, from_branch_id, to_branch_id, quantity, status, notes, created_by)
  values(v_company, p_inventory_id, v_from_branch, p_to_branch_id, p_quantity, 'completed', p_notes, auth.uid())
  returning id into v_id;

  perform set_config('novatech.stock_movement', '1', true);
  update inventory set quantity = quantity - p_quantity, updated_at = now() where id = p_inventory_id;

  select id into v_dest_id
  from inventory
  where company_id = v_company
    and branch_id = p_to_branch_id
    and ((v_sku is not null and sku = v_sku) or (v_sku is null and item_name = (select item_name from inventory where id = p_inventory_id)))
  limit 1 for update;

  if v_dest_id is null then
    insert into inventory(item_name, category, brand, compatible_models, sku, selling_price, cost_price, quantity, minimum_stock, supplier, shelf_location, notes, company_id, branch_id)
    select item_name, category, brand, compatible_models, sku, selling_price, cost_price, p_quantity, minimum_stock, supplier, shelf_location, notes, company_id, p_to_branch_id
    from inventory where id = p_inventory_id
    returning id into v_dest_id;
  else
    update inventory set quantity = quantity + p_quantity, updated_at = now() where id = v_dest_id;
  end if;
  perform set_config('novatech.stock_movement', '0', true);

  insert into inventory_stock_movements(company_id, inventory_id, movement_type, quantity, unit_cost, total_cost, reference_type, reference_id, notes, created_by)
  values
    (v_company, p_inventory_id, 'transfer_out', -p_quantity, coalesce(v_cost,0), p_quantity * coalesce(v_cost,0), 'inventory_transfer', v_id, p_notes, auth.uid()),
    (v_company, v_dest_id, 'transfer_in', p_quantity, coalesce(v_cost,0), p_quantity * coalesce(v_cost,0), 'inventory_transfer', v_id, p_notes, auth.uid());

  return v_id;
exception when others then
  perform set_config('novatech.stock_movement', '0', true);
  raise;
end;
$function$;

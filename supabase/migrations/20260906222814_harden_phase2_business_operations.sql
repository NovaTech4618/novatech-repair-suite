-- Harden Phase 2 RPCs against anonymous execution and privilege bypass.
-- The database migration with the same version has already been applied to the connected Supabase project.

revoke execute on function public.accept_staff_invitation() from anon;
revoke execute on function public.create_company_for_new_user(text) from anon;
revoke execute on function public.get_my_company_id() from anon;
revoke execute on function public.get_my_role() from anon;
revoke execute on function public.get_my_branch_ids() from anon;
revoke execute on function public.is_company_owner() from anon;
revoke execute on function public.is_manager_or_owner() from anon;
revoke execute on function public.user_has_branch_access(uuid) from anon;

-- Company creation must only be possible for an authenticated user without a company.
create or replace function public.create_company_for_new_user(company_name text)
returns uuid language plpgsql security definer set search_path='public'
as $$
declare new_company_id uuid; existing_company uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select company_id into existing_company from profiles where id=auth.uid();
  if existing_company is not null then raise exception 'User already belongs to a company'; end if;
  if trim(coalesce(company_name,''))='' then raise exception 'Company name is required'; end if;
  insert into companies(name,owner_id) values(trim(company_name),auth.uid()) returning id into new_company_id;
  insert into profiles(id,company_id,full_name,role) values(auth.uid(),new_company_id,auth.uid()::text,'owner')
    on conflict(id) do update set company_id=excluded.company_id,role='owner';
  return new_company_id;
end; $$;
grant execute on function public.create_company_for_new_user(text) to authenticated;
revoke execute on function public.create_company_for_new_user(text) from anon;

-- Branch access must remain inside the caller's company.
create or replace function public.user_has_branch_access(p_branch_id uuid)
returns boolean language sql stable security definer set search_path='public'
as $$
  select exists(
    select 1 from profiles p join branches b on b.company_id=p.company_id
    where p.id=auth.uid() and p.is_active=true and b.id=p_branch_id and p.role='owner'
  ) or exists(
    select 1 from user_branches ub join profiles p on p.id=ub.profile_id join branches b on b.id=ub.branch_id
    where ub.profile_id=auth.uid() and ub.branch_id=p_branch_id and p.is_active=true and b.company_id=p.company_id
  );
$$;
grant execute on function public.user_has_branch_access(uuid) to authenticated;
revoke execute on function public.user_has_branch_access(uuid) from anon;

-- Inventory movements are the single stock mutation boundary. Every movement now
-- requires the permission appropriate to its source and branch access.
create or replace function public.record_inventory_movement(p_inventory_id uuid,p_movement_type text,p_quantity integer,p_unit_cost numeric default 0,p_reference_type text default null,p_reference_id uuid default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path='public'
as $$
declare v_company_id uuid; v_inventory_company uuid; v_branch_id uuid; v_available integer; v_delta integer; v_movement_id uuid;
begin
  v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_unit_cost is null or p_unit_cost<0 then raise exception 'Unit cost cannot be negative'; end if;
  if p_movement_type not in ('opening','purchase','sale','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out') then raise exception 'Invalid movement type'; end if;
  if p_movement_type in ('opening','purchase','adjustment_in','adjustment_out') and not public.has_permission('inventory.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type='sale' and not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type in ('repair_use','repair_return') and not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_movement_type='engineer_out' and not public.has_permission('inventory.issue') then raise exception 'Permission denied'; end if;
  if p_movement_type='engineer_return' and not public.has_permission('inventory.return') then raise exception 'Permission denied'; end if;
  select company_id,branch_id,quantity into v_inventory_company,v_branch_id,v_available from inventory where id=p_inventory_id for update;
  if v_inventory_company is null or v_inventory_company<>v_company_id then raise exception 'Inventory item not found'; end if;
  if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;
  v_delta:=case when p_movement_type in ('opening','purchase','repair_return','engineer_return','adjustment_in') then p_quantity else -p_quantity end;
  if v_available+v_delta<0 then raise exception 'Insufficient stock'; end if;
  update inventory set quantity=quantity+v_delta,updated_at=now() where id=p_inventory_id;
  insert into inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
  values(v_company_id,p_inventory_id,p_movement_type,v_delta,p_unit_cost,p_reference_type,p_reference_id,p_notes,auth.uid()) returning id into v_movement_id;
  return v_movement_id;
end; $$;
revoke execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from anon;

grant execute on function public.get_my_company_id() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.get_my_branch_ids() to authenticated;
grant execute on function public.is_company_owner() to authenticated;
grant execute on function public.is_manager_or_owner() to authenticated;
revoke execute on function public.get_my_company_id() from anon;
revoke execute on function public.get_my_role() from anon;
revoke execute on function public.get_my_branch_ids() from anon;
revoke execute on function public.is_company_owner() from anon;
revoke execute on function public.is_manager_or_owner() from anon;

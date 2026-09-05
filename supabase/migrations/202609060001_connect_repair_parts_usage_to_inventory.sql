create table if not exists public.repair_parts_usage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  repair_id uuid not null references public.repairs(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  quantity_used integer not null check (quantity_used > 0),
  quantity_returned integer not null default 0 check (quantity_returned >= 0),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity_returned <= quantity_used)
);
create index if not exists repair_parts_usage_repair_idx on public.repair_parts_usage(repair_id, created_at desc);
create index if not exists repair_parts_usage_inventory_idx on public.repair_parts_usage(inventory_id, created_at desc);
create index if not exists repair_parts_usage_company_idx on public.repair_parts_usage(company_id);
alter table public.repair_parts_usage enable row level security;
drop policy if exists repair_parts_usage_select on public.repair_parts_usage;
create policy repair_parts_usage_select on public.repair_parts_usage for select to authenticated using (company_id=public.get_my_company_id());
drop policy if exists repair_parts_usage_insert on public.repair_parts_usage;
create policy repair_parts_usage_insert on public.repair_parts_usage for insert to authenticated with check (company_id=public.get_my_company_id());
grant select,insert on public.repair_parts_usage to authenticated;

alter table public.inventory_stock_movements drop constraint if exists inventory_stock_movements_movement_type_check;
alter table public.inventory_stock_movements add constraint inventory_stock_movements_movement_type_check check (movement_type in ('opening','purchase','sale','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out'));

create or replace function public.record_inventory_movement(p_inventory_id uuid,p_movement_type text,p_quantity integer,p_unit_cost numeric default 0,p_reference_type text default null,p_reference_id uuid default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_inventory_company uuid; v_available integer; v_delta integer; v_movement_id uuid;
begin
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 if p_unit_cost is null or p_unit_cost<0 then raise exception 'Unit cost cannot be negative'; end if;
 if p_movement_type not in ('opening','purchase','sale','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out') then raise exception 'Invalid movement type'; end if;
 select company_id,quantity into v_inventory_company,v_available from public.inventory where id=p_inventory_id for update;
 if v_inventory_company is null or v_inventory_company<>v_company_id then raise exception 'Inventory item not found'; end if;
 v_delta:=case when p_movement_type in ('opening','purchase','repair_return','engineer_return','adjustment_in') then p_quantity else -p_quantity end;
 if v_available+v_delta<0 then raise exception 'Insufficient stock'; end if;
 update public.inventory set quantity=quantity+v_delta,updated_at=now() where id=p_inventory_id;
 insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by) values(v_company_id,p_inventory_id,p_movement_type,v_delta,p_unit_cost,p_reference_type,p_reference_id,p_notes,auth.uid()) returning id into v_movement_id;
 return v_movement_id;
end; $$;
revoke all on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from public,anon;
grant execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) to authenticated;

create or replace function public.record_repair_part_usage(p_repair_id uuid,p_inventory_id uuid,p_quantity integer,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_repair_company uuid; v_inventory_company uuid; v_available integer; v_cost numeric; v_usage_id uuid;
begin
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 select company_id into v_repair_company from public.repairs where id=p_repair_id;
 if v_repair_company is null or v_repair_company<>v_company_id then raise exception 'Repair not found'; end if;
 select company_id,quantity,coalesce(cost_price,0) into v_inventory_company,v_available,v_cost from public.inventory where id=p_inventory_id for update;
 if v_inventory_company is null or v_inventory_company<>v_company_id then raise exception 'Inventory item not found'; end if;
 if v_available<p_quantity then raise exception 'Insufficient stock'; end if;
 insert into public.repair_parts_usage(company_id,repair_id,inventory_id,quantity_used,unit_cost,notes,created_by) values(v_company_id,p_repair_id,p_inventory_id,p_quantity,v_cost,p_notes,auth.uid()) returning id into v_usage_id;
 perform public.record_inventory_movement(p_inventory_id,'repair_use',p_quantity,v_cost,'repair_part_usage',v_usage_id,p_notes);
 return v_usage_id;
end; $$;
revoke all on function public.record_repair_part_usage(uuid,uuid,integer,text) from public,anon;
grant execute on function public.record_repair_part_usage(uuid,uuid,integer,text) to authenticated;

create or replace function public.return_repair_part_usage(p_usage_id uuid,p_quantity integer,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_usage public.repair_parts_usage%rowtype; v_movement_id uuid;
begin
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 select * into v_usage from public.repair_parts_usage where id=p_usage_id and company_id=v_company_id for update;
 if not found then raise exception 'Repair part usage not found'; end if;
 if p_quantity>v_usage.quantity_used-v_usage.quantity_returned then raise exception 'Return exceeds outstanding used quantity'; end if;
 v_movement_id:=public.record_inventory_movement(v_usage.inventory_id,'repair_return',p_quantity,v_usage.unit_cost,'repair_part_return',v_usage.id,coalesce(p_notes,'Returned unused repair part'));
 update public.repair_parts_usage set quantity_returned=quantity_returned+p_quantity,updated_at=now(),notes=coalesce(p_notes,notes) where id=p_usage_id;
 return v_movement_id;
end; $$;
revoke all on function public.return_repair_part_usage(uuid,integer,text) from public,anon;
grant execute on function public.return_repair_part_usage(uuid,integer,text) to authenticated;

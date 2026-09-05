create table if not exists public.inventory_stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  movement_type text not null check (movement_type in ('opening','purchase','sale','repair_use','engineer_out','engineer_return','adjustment_in','adjustment_out')),
  quantity integer not null check (quantity <> 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  total_cost numeric(14,2) generated always as (abs(quantity) * unit_cost) stored,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists inventory_stock_movements_inventory_idx on public.inventory_stock_movements(inventory_id, created_at desc);
create index if not exists inventory_stock_movements_company_idx on public.inventory_stock_movements(company_id, created_at desc);

alter table public.inventory_stock_movements enable row level security;

create policy inventory_stock_movements_select on public.inventory_stock_movements
for select to authenticated
using (company_id = public.get_my_company_id());

create policy inventory_stock_movements_insert on public.inventory_stock_movements
for insert to authenticated
with check (company_id = public.get_my_company_id());

create or replace function public.record_inventory_movement(
  p_inventory_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_unit_cost numeric default 0,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_item_company uuid;
  v_movement_id uuid;
  v_delta integer;
begin
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if p_quantity = 0 then raise exception 'Quantity cannot be zero'; end if;
  if p_unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;

  select company_id into v_item_company from public.inventory where id = p_inventory_id for update;
  if v_item_company is null or v_item_company <> v_company_id then raise exception 'Inventory item not found'; end if;

  v_delta := case when p_movement_type in ('purchase','opening','engineer_return','adjustment_in') then abs(p_quantity) else -abs(p_quantity) end;

  if (select quantity from public.inventory where id = p_inventory_id) + v_delta < 0 then
    raise exception 'Insufficient stock';
  end if;

  update public.inventory set quantity = quantity + v_delta, updated_at = now() where id = p_inventory_id;

  insert into public.inventory_stock_movements(company_id, inventory_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
  values(v_company_id, p_inventory_id, p_movement_type, v_delta, p_unit_cost, p_reference_type, p_reference_id, p_notes, auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

revoke all on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from public, anon;
grant execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) to authenticated;

-- NOVATECH BUSINESS OPERATIONS FOUNDATION
-- Inventory control, engineer accountability, assignments, invoices/debts,
-- reporting, branches, permissions and auditability.

-- ------------------------------------------------------------
-- BRANCH SCOPING
-- ------------------------------------------------------------
alter table public.inventory add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.repairs add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.sales add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.financial_transactions add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists inventory_branch_idx on public.inventory(branch_id);
create index if not exists repairs_branch_idx on public.repairs(branch_id);
create index if not exists sales_branch_idx on public.sales(branch_id);
create index if not exists financial_transactions_branch_idx on public.financial_transactions(branch_id);

update public.inventory i
set branch_id = b.id
from public.branches b
where i.branch_id is null and b.company_id = i.company_id and b.is_main = true;

update public.repairs r
set branch_id = b.id
from public.branches b
where r.branch_id is null and b.company_id = r.company_id and b.is_main = true;

update public.sales s
set branch_id = b.id
from public.branches b
where s.branch_id is null and b.company_id = s.company_id and b.is_main = true;

update public.financial_transactions f
set branch_id = b.id
from public.branches b
where f.branch_id is null and b.company_id = f.company_id and b.is_main = true;

-- ------------------------------------------------------------
-- ENGINEER WORKFLOW / REPAIR OWNERSHIP
-- ------------------------------------------------------------
alter table public.repairs add column if not exists engineer_id uuid references public.engineers(id) on delete set null;
alter table public.repairs add column if not exists assigned_at timestamptz;
create index if not exists repairs_engineer_idx on public.repairs(engineer_id, created_at desc);

create table if not exists public.repair_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  repair_id uuid not null references public.repairs(id) on delete cascade,
  engineer_id uuid not null references public.engineers(id) on delete restrict,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  notes text
);
create index if not exists repair_assignments_repair_idx on public.repair_assignments(repair_id, assigned_at desc);
create index if not exists repair_assignments_engineer_idx on public.repair_assignments(engineer_id, assigned_at desc);
alter table public.repair_assignments enable row level security;
drop policy if exists repair_assignments_select on public.repair_assignments;
create policy repair_assignments_select on public.repair_assignments for select to authenticated using (company_id=public.get_my_company_id());
drop policy if exists repair_assignments_insert on public.repair_assignments;
create policy repair_assignments_insert on public.repair_assignments for insert to authenticated with check (company_id=public.get_my_company_id());
grant select,insert on public.repair_assignments to authenticated;

create or replace function public.assign_repair_engineer(p_repair_id uuid,p_engineer_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_engineer_company uuid; v_assignment uuid;
begin
 v_company:=public.get_my_company_id();
 if v_company is null then raise exception 'Company not found'; end if;
 select company_id into v_engineer_company from public.engineers where id=p_engineer_id;
 if v_engineer_company is null or v_engineer_company<>v_company then raise exception 'Engineer not found'; end if;
 if not exists(select 1 from public.repairs where id=p_repair_id and company_id=v_company) then raise exception 'Repair not found'; end if;
 update public.repair_assignments set unassigned_at=now() where repair_id=p_repair_id and company_id=v_company and unassigned_at is null;
 update public.repairs set engineer_id=p_engineer_id,assigned_at=now(),technician=(select name from public.engineers where id=p_engineer_id) where id=p_repair_id and company_id=v_company;
 insert into public.repair_assignments(company_id,repair_id,engineer_id,assigned_by,notes) values(v_company,p_repair_id,p_engineer_id,auth.uid(),p_notes) returning id into v_assignment;
 return v_assignment;
end; $$;
revoke all on function public.assign_repair_engineer(uuid,uuid,text) from public,anon;
grant execute on function public.assign_repair_engineer(uuid,uuid,text) to authenticated;

-- ------------------------------------------------------------
-- TECHNICIAN PARTS / DEBIT LEDGER
-- ------------------------------------------------------------
create table if not exists public.engineer_part_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  engineer_id uuid not null references public.engineers(id) on delete restrict,
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  repair_id uuid references public.repairs(id) on delete set null,
  movement_type text not null check (movement_type in ('issued','used','returned','adjustment')),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists engineer_part_ledger_engineer_idx on public.engineer_part_ledger(engineer_id,created_at desc);
create index if not exists engineer_part_ledger_repair_idx on public.engineer_part_ledger(repair_id,created_at desc);
alter table public.engineer_part_ledger enable row level security;
drop policy if exists engineer_part_ledger_select on public.engineer_part_ledger;
create policy engineer_part_ledger_select on public.engineer_part_ledger for select to authenticated using (company_id=public.get_my_company_id());
grant select on public.engineer_part_ledger to authenticated;

create or replace function public.issue_engineer_part(p_engineer_id uuid,p_inventory_id uuid,p_quantity integer,p_repair_id uuid default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_branch uuid; v_cost numeric; v_id uuid;
begin
 v_company:=public.get_my_company_id();
 if v_company is null then raise exception 'Company not found'; end if;
 select branch_id,coalesce(cost_price,0) into v_branch,v_cost from public.inventory where id=p_inventory_id and company_id=v_company for update;
 if not found then raise exception 'Inventory item not found'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 perform public.record_inventory_movement(p_inventory_id,'engineer_out',p_quantity,v_cost,'engineer_part_ledger',null,p_notes);
 insert into public.engineer_part_ledger(company_id,branch_id,engineer_id,inventory_id,repair_id,movement_type,quantity,unit_cost,notes,created_by) values(v_company,v_branch,p_engineer_id,p_inventory_id,p_repair_id,'issued',p_quantity,v_cost,p_notes,auth.uid()) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.issue_engineer_part(uuid,uuid,integer,uuid,text) from public,anon;
grant execute on function public.issue_engineer_part(uuid,uuid,integer,uuid,text) to authenticated;

create or replace view public.engineer_performance_summary with (security_invoker=true) as
select e.id engineer_id,e.company_id,e.name,e.status,
 count(r.id) filter(where r.id is not null) total_repairs,
 count(r.id) filter(where lower(coalesce(r.status,'')) in ('completed','ready','collected')) completed_repairs,
 count(r.id) filter(where lower(coalesce(r.status,'')) not in ('completed','ready','collected')) active_repairs,
 coalesce(sum(coalesce(r.final_cost,r.estimated_cost,0)) filter(where lower(coalesce(r.status,'')) in ('completed','ready','collected')),0) repair_revenue
from public.engineers e left join public.repairs r on r.engineer_id=e.id and r.company_id=e.company_id
group by e.id,e.company_id,e.name,e.status;

grant select on public.engineer_performance_summary to authenticated;

-- ------------------------------------------------------------
-- INVOICES / RECEIPTS / OUTSTANDING BALANCES
-- ------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  invoice_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  repair_id uuid references public.repairs(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  status text not null default 'issued' check (status in ('draft','issued','part_paid','paid','void')),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id,invoice_number)
);
create index if not exists invoices_customer_idx on public.invoices(customer_id,issued_at desc);
create index if not exists invoices_company_idx on public.invoices(company_id,issued_at desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1 check(quantity>0),
  unit_price numeric(14,2) not null default 0 check(unit_price>=0),
  line_total numeric(14,2) generated always as (quantity*unit_price) stored
);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);

create table if not exists public.customer_debt_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  source_type text not null check(source_type in ('invoice','repair','sale','payment','adjustment')),
  source_id uuid,
  debit numeric(14,2) not null default 0 check(debit>=0),
  credit numeric(14,2) not null default 0 check(credit>=0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check(debit>0 or credit>0)
);
create index if not exists customer_debt_customer_idx on public.customer_debt_ledger(customer_id,created_at desc);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.customer_debt_ledger enable row level security;

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated using(company_id=public.get_my_company_id());
drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert on public.invoices for insert to authenticated with check(company_id=public.get_my_company_id());
drop policy if exists invoice_items_select on public.invoice_items;
create policy invoice_items_select on public.invoice_items for select to authenticated using(exists(select 1 from public.invoices i where i.id=invoice_id and i.company_id=public.get_my_company_id()));
drop policy if exists invoice_items_insert on public.invoice_items;
create policy invoice_items_insert on public.invoice_items for insert to authenticated with check(exists(select 1 from public.invoices i where i.id=invoice_id and i.company_id=public.get_my_company_id()));
drop policy if exists customer_debt_select on public.customer_debt_ledger;
create policy customer_debt_select on public.customer_debt_ledger for select to authenticated using(company_id=public.get_my_company_id());
drop policy if exists customer_debt_insert on public.customer_debt_ledger;
create policy customer_debt_insert on public.customer_debt_ledger for insert to authenticated with check(company_id=public.get_my_company_id());
grant select,insert on public.invoices,public.invoice_items,public.customer_debt_ledger to authenticated;

create or replace function public.get_customer_balances()
returns table(customer_id uuid,customer_name text,phone text,debit numeric,credit numeric,balance numeric)
language sql security invoker set search_path=public as $$
 select c.id,c.full_name,c.phone,coalesce(sum(d.debit),0),coalesce(sum(d.credit),0),coalesce(sum(d.debit-d.credit),0)
 from public.customers c left join public.customer_debt_ledger d on d.customer_id=c.id and d.company_id=public.get_my_company_id()
 where c.company_id=public.get_my_company_id()
 group by c.id,c.full_name,c.phone
 having coalesce(sum(d.debit-d.credit),0)<>0
 order by balance desc;
$$;
grant execute on function public.get_customer_balances() to authenticated;

-- ------------------------------------------------------------
-- ROLE PERMISSIONS
-- ------------------------------------------------------------
create table if not exists public.role_permissions (
  role text not null,
  permission text not null,
  allowed boolean not null default true,
  primary key(role,permission)
);
insert into public.role_permissions(role,permission,allowed) values
('owner','*',true),
('branch_manager','inventory.manage',true),('branch_manager','repairs.manage',true),('branch_manager','sales.manage',true),('branch_manager','reports.view',true),('branch_manager','engineers.manage',true),('branch_manager','branches.manage',false),('branch_manager','audit.view',true),
('technician','repairs.manage',true),('technician','inventory.issue',true),('technician','inventory.return',true),('technician','engineers.manage',false),('technician','finance.manage',false),('technician','reports.view',false),
('front_desk','customers.manage',true),('front_desk','repairs.manage',true),('front_desk','sales.manage',true),('front_desk','payments.manage',true),('front_desk','inventory.view',true),('front_desk','reports.view',false)
on conflict(role,permission) do update set allowed=excluded.allowed;

create or replace function public.has_permission(p_permission text)
returns boolean language sql security invoker set search_path=public as $$
 select exists(
   select 1 from public.profiles p join public.role_permissions rp on rp.role=p.role
   where p.id=auth.uid() and p.is_active=true and (rp.permission='*' or (rp.permission=p_permission and rp.allowed=true))
 );
$$;
grant execute on function public.has_permission(text) to authenticated;

-- ------------------------------------------------------------
-- AUDIT LOG
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_company_idx on public.audit_logs(company_id,created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type,entity_id,created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated using(company_id=public.get_my_company_id() and public.has_permission('audit.view'));
grant select on public.audit_logs to authenticated;

create or replace function public.write_audit_log(p_action text,p_entity_type text,p_entity_id uuid default null,p_old jsonb default null,p_new jsonb default null,p_metadata jsonb default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_branch uuid; v_id uuid;
begin
 v_company:=public.get_my_company_id();
 if v_company is null then raise exception 'Company not found'; end if;
 select branch_id into v_branch from public.profiles where id=auth.uid();
 insert into public.audit_logs(company_id,branch_id,actor_id,action,entity_type,entity_id,old_data,new_data,metadata) values(v_company,v_branch,auth.uid(),p_action,p_entity_type,p_entity_id,p_old,p_new,p_metadata) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.write_audit_log(text,text,uuid,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.write_audit_log(text,text,uuid,jsonb,jsonb,jsonb) to authenticated;

-- ------------------------------------------------------------
-- INVENTORY TRANSFERS
-- ------------------------------------------------------------
create table if not exists public.inventory_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  from_branch_id uuid not null references public.branches(id) on delete restrict,
  to_branch_id uuid not null references public.branches(id) on delete restrict,
  quantity integer not null check(quantity>0),
  status text not null default 'completed' check(status in ('completed','cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check(from_branch_id<>to_branch_id)
);
create index if not exists inventory_transfers_company_idx on public.inventory_transfers(company_id,created_at desc);
alter table public.inventory_transfers enable row level security;
drop policy if exists inventory_transfers_select on public.inventory_transfers;
create policy inventory_transfers_select on public.inventory_transfers for select to authenticated using(company_id=public.get_my_company_id());
grant select on public.inventory_transfers to authenticated;

create or replace function public.transfer_inventory(p_inventory_id uuid,p_from_branch uuid,p_to_branch uuid,p_quantity integer,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_id uuid; v_cost numeric; v_item_branch uuid;
begin
 v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
 if p_quantity<=0 or p_from_branch=p_to_branch then raise exception 'Invalid transfer'; end if;
 select branch_id,coalesce(cost_price,0) into v_item_branch,v_cost from public.inventory where id=p_inventory_id and company_id=v_company for update;
 if not found then raise exception 'Inventory item not found'; end if;
 if v_item_branch is not null and v_item_branch<>p_from_branch then raise exception 'Inventory item belongs to another branch'; end if;
 perform public.record_inventory_movement(p_inventory_id,'adjustment_out',p_quantity,v_cost,'inventory_transfer',null,p_notes);
 update public.inventory set branch_id=p_to_branch,updated_at=now() where id=p_inventory_id;
 perform public.record_inventory_movement(p_inventory_id,'adjustment_in',p_quantity,v_cost,'inventory_transfer',null,p_notes);
 insert into public.inventory_transfers(company_id,inventory_id,from_branch_id,to_branch_id,quantity,notes,created_by) values(v_company,p_inventory_id,p_from_branch,p_to_branch,p_quantity,p_notes,auth.uid()) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.transfer_inventory(uuid,uuid,uuid,integer,text) from public,anon;
grant execute on function public.transfer_inventory(uuid,uuid,uuid,integer,text) to authenticated;

-- ------------------------------------------------------------
-- REPORTING VIEWS
-- ------------------------------------------------------------
create or replace view public.inventory_report_summary with (security_invoker=true) as
select i.company_id,i.branch_id,count(*) sku_count,coalesce(sum(i.quantity),0) units,
coalesce(sum(i.quantity*coalesce(i.cost_price,0)),0) stock_cost,
count(*) filter(where i.quantity=0) out_of_stock,
count(*) filter(where i.quantity<=i.minimum_stock) low_stock
from public.inventory i where i.company_id=public.get_my_company_id() group by i.company_id,i.branch_id;
grant select on public.inventory_report_summary to authenticated;

create or replace view public.repair_report_summary with (security_invoker=true) as
select r.company_id,r.branch_id,count(*) total_repairs,
count(*) filter(where lower(coalesce(r.status,'')) in ('completed','ready','collected')) completed,
count(*) filter(where lower(coalesce(r.status,'')) not in ('completed','ready','collected')) active,
coalesce(sum(coalesce(r.final_cost,r.estimated_cost,0)),0) quoted_revenue,
coalesce(sum(coalesce(r.final_cost,0)-coalesce(r.deposit,0)),0) outstanding
from public.repairs r where r.company_id=public.get_my_company_id() group by r.company_id,r.branch_id;
grant select on public.repair_report_summary to authenticated;

create or replace view public.sales_report_summary with (security_invoker=true) as
select s.company_id,s.branch_id,count(*) total_sales,coalesce(sum(s.total_amount),0) revenue
from public.sales s where s.company_id=public.get_my_company_id() group by s.company_id,s.branch_id;
grant select on public.sales_report_summary to authenticated;

-- Keep the database API surface explicit.
grant select on public.role_permissions to authenticated;

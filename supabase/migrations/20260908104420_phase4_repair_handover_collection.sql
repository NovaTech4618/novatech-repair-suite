-- Phase 4: device handover / collection and repeat-repair linking.
create table if not exists public.repair_handovers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  branch_id uuid,
  repair_id uuid not null unique,
  customer_id uuid not null,
  handed_over_at timestamptz not null default now(),
  handed_over_by uuid,
  recipient_name text,
  recipient_phone text,
  id_type text,
  id_reference text,
  device_condition text,
  customer_confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_repeat_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  branch_id uuid,
  original_repair_id uuid not null,
  repeat_repair_id uuid not null unique,
  warranty_id uuid,
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists idx_repair_handovers_company_branch on public.repair_handovers(company_id, branch_id);
create index if not exists idx_repair_repeat_links_company_branch on public.repair_repeat_links(company_id, branch_id);

alter table public.repair_handovers enable row level security;
alter table public.repair_repeat_links enable row level security;

revoke all on table public.repair_handovers, public.repair_repeat_links from anon, public;
grant select, insert, update on table public.repair_handovers to authenticated;
grant select, insert on table public.repair_repeat_links to authenticated;

create policy repair_handovers_select on public.repair_handovers for select to authenticated
using (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy repair_handovers_insert on public.repair_handovers for insert to authenticated
with check (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))) and (select public.has_permission('repairs.manage')));
create policy repair_handovers_update on public.repair_handovers for update to authenticated
using (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')))
with check (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')));
create policy repair_handovers_no_delete on public.repair_handovers for delete to authenticated using (false);

create policy repair_repeat_links_select on public.repair_repeat_links for select to authenticated
using (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy repair_repeat_links_insert on public.repair_repeat_links for insert to authenticated
with check (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))) and (select public.has_permission('repairs.manage')));
create policy repair_repeat_links_no_update on public.repair_repeat_links for update to authenticated using (false) with check (false);
create policy repair_repeat_links_no_delete on public.repair_repeat_links for delete to authenticated using (false);

create or replace function public.record_repair_handover(
  p_repair_id uuid,
  p_recipient_name text,
  p_recipient_phone text default null,
  p_id_type text default null,
  p_id_reference text default null,
  p_device_condition text default null,
  p_customer_confirmed boolean default false,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_company uuid;
  v_branch uuid;
  v_customer uuid;
  v_status text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if nullif(trim(coalesce(p_recipient_name,'')), '') is null then raise exception 'Recipient name is required'; end if;
  if coalesce(p_customer_confirmed,false) is not true then raise exception 'Customer confirmation is required'; end if;
  v_company := public.get_my_company_id();
  select r.branch_id, d.customer_id, r.status into v_branch, v_customer, v_status
  from public.repairs r join public.devices d on d.id=r.device_id and d.company_id=v_company
  where r.id=p_repair_id and r.company_id=v_company for update;
  if not found then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if v_status not in ('Completed','Ready for Collection','Collected') then raise exception 'Repair is not ready for handover'; end if;
  insert into public.repair_handovers(company_id,branch_id,repair_id,customer_id,handed_over_at,handed_over_by,recipient_name,recipient_phone,id_type,id_reference,device_condition,customer_confirmed,notes)
  values(v_company,v_branch,p_repair_id,v_customer,now(),auth.uid(),p_recipient_name,p_recipient_phone,p_id_type,p_id_reference,p_device_condition,p_customer_confirmed,p_notes)
  on conflict (repair_id) do update set handed_over_at=excluded.handed_over_at,handed_over_by=excluded.handed_over_by,recipient_name=excluded.recipient_name,recipient_phone=excluded.recipient_phone,id_type=excluded.id_type,id_reference=excluded.id_reference,device_condition=excluded.device_condition,customer_confirmed=excluded.customer_confirmed,notes=excluded.notes
  returning id into v_id;
  update public.repairs set status='Collected', completed_at=coalesce(completed_at,now()) where id=p_repair_id and company_id=v_company;
  return v_id;
end;
$$;
revoke all on function public.record_repair_handover(uuid,text,text,text,text,text,boolean,text) from public, anon;
grant execute on function public.record_repair_handover(uuid,text,text,text,text,text,boolean,text) to authenticated;

create or replace function public.link_repeat_repair(
  p_original_repair_id uuid,
  p_repeat_repair_id uuid,
  p_warranty_id uuid default null,
  p_reason text default null
)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_company uuid;
  v_branch uuid;
  v_original_company uuid;
  v_repeat_company uuid;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  select company_id,branch_id into v_original_company,v_branch from public.repairs where id=p_original_repair_id;
  select company_id into v_repeat_company from public.repairs where id=p_repeat_repair_id;
  if v_original_company is null or v_repeat_company is null or v_original_company<>v_company or v_repeat_company<>v_company then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  insert into public.repair_repeat_links(company_id,branch_id,original_repair_id,repeat_repair_id,warranty_id,reason,created_by)
  values(v_company,v_branch,p_original_repair_id,p_repeat_repair_id,p_warranty_id,p_reason,auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.link_repeat_repair(uuid,uuid,uuid,text) from public, anon;
grant execute on function public.link_repeat_repair(uuid,uuid,uuid,text) to authenticated;

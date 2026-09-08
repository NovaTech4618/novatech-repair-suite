create table if not exists public.repair_outcomes (
  id uuid primary key default gen_random_uuid(), company_id uuid not null, branch_id uuid,
  repair_id uuid not null unique references public.repairs(id) on delete cascade,
  outcome text not null check (outcome in ('repaired','no_fix','failed_repair','cancelled','returned_unrepaired')),
  reason text, customer_notes text, technician_notes text, resolved_at timestamptz, resolved_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.repair_warranties (
  id uuid primary key default gen_random_uuid(), company_id uuid not null, branch_id uuid,
  repair_id uuid not null unique references public.repairs(id) on delete cascade,
  customer_id uuid not null references public.customers(id), device_id uuid not null references public.devices(id),
  warranty_days integer not null default 0 check (warranty_days >= 0 and warranty_days <= 3650),
  starts_at timestamptz not null default now(), expires_at timestamptz not null,
  terms text, status text not null default 'active' check (status in ('active','expired','void')),
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_repair_outcomes_company_branch on public.repair_outcomes(company_id, branch_id);
create index if not exists idx_repair_warranties_company_status_expiry on public.repair_warranties(company_id, status, expires_at);
create index if not exists idx_repair_warranties_customer_device on public.repair_warranties(company_id, customer_id, device_id);
alter table public.repair_outcomes enable row level security;
alter table public.repair_warranties enable row level security;
grant select, insert, update on public.repair_outcomes to authenticated;
grant select, insert, update on public.repair_warranties to authenticated;
revoke all on public.repair_outcomes, public.repair_warranties from anon;
create policy "repair outcomes company select" on public.repair_outcomes for select to authenticated using (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy "repair outcomes manage" on public.repair_outcomes for insert to authenticated with check (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy "repair outcomes update" on public.repair_outcomes for update to authenticated using (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id)))) with check (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy "repair warranties company select" on public.repair_warranties for select to authenticated using (company_id = (select public.get_my_company_id()) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy "repair warranties manage" on public.repair_warranties for insert to authenticated with check (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create policy "repair warranties update" on public.repair_warranties for update to authenticated using (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id)))) with check (company_id = (select public.get_my_company_id()) and (select public.has_permission('repairs.manage')) and (branch_id is null or (select public.user_has_branch_access(branch_id))));
create or replace function public.record_repair_outcome(p_repair_id uuid, p_outcome text, p_reason text default null, p_customer_notes text default null, p_technician_notes text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_company uuid; v_branch uuid; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 v_company := public.get_my_company_id();
 if p_outcome not in ('repaired','no_fix','failed_repair','cancelled','returned_unrepaired') then raise exception 'Invalid repair outcome'; end if;
 select branch_id into v_branch from public.repairs where id=p_repair_id and company_id=v_company for update;
 if not found then raise exception 'Repair not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 insert into public.repair_outcomes(company_id,branch_id,repair_id,outcome,reason,customer_notes,technician_notes,resolved_at,resolved_by)
 values(v_company,v_branch,p_repair_id,p_outcome,p_reason,p_customer_notes,p_technician_notes,now(),auth.uid())
 on conflict (repair_id) do update set outcome=excluded.outcome,reason=excluded.reason,customer_notes=excluded.customer_notes,technician_notes=excluded.technician_notes,resolved_at=excluded.resolved_at,resolved_by=excluded.resolved_by,updated_at=now()
 returning id into v_id;
 update public.repairs set status=case when p_outcome='repaired' then 'Completed' when p_outcome='no_fix' then 'No Fix' when p_outcome='failed_repair' then 'Failed Repair' when p_outcome='cancelled' then 'Cancelled' else 'Returned Unrepaired' end, completed_at=coalesce(completed_at,now()) where id=p_repair_id and company_id=v_company;
 return v_id;
end; $$;
revoke all on function public.record_repair_outcome(uuid,text,text,text,text) from public, anon;
grant execute on function public.record_repair_outcome(uuid,text,text,text,text) to authenticated;
create or replace function public.create_repair_warranty(p_repair_id uuid, p_warranty_days integer, p_terms text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_company uuid; v_branch uuid; v_customer uuid; v_device uuid; v_status text; v_id uuid; v_expires timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 if p_warranty_days < 0 or p_warranty_days > 3650 then raise exception 'Invalid warranty period'; end if;
 v_company := public.get_my_company_id();
 select r.branch_id,r.status,d.customer_id,r.device_id into v_branch,v_status,v_customer,v_device from public.repairs r join public.devices d on d.id=r.device_id and d.company_id=v_company where r.id=p_repair_id and r.company_id=v_company for update;
 if not found then raise exception 'Repair not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_status <> 'Completed' then raise exception 'Warranty can only be issued for completed repairs'; end if;
 v_expires := now() + make_interval(days => p_warranty_days);
 insert into public.repair_warranties(company_id,branch_id,repair_id,customer_id,device_id,warranty_days,starts_at,expires_at,terms,created_by)
 values(v_company,v_branch,p_repair_id,v_customer,v_device,p_warranty_days,now(),v_expires,p_terms,auth.uid())
 on conflict (repair_id) do update set warranty_days=excluded.warranty_days,starts_at=excluded.starts_at,expires_at=excluded.expires_at,terms=excluded.terms,status='active',updated_at=now()
 returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.create_repair_warranty(uuid,integer,text) from public, anon;
grant execute on function public.create_repair_warranty(uuid,integer,text) to authenticated;
create or replace function public.refresh_repair_warranty_status()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_count integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 update public.repair_warranties set status='expired',updated_at=now() where company_id=public.get_my_company_id() and status='active' and expires_at < now();
 get diagnostics v_count = row_count;
 return v_count;
end; $$;
revoke all on function public.refresh_repair_warranty_status() from public, anon;
grant execute on function public.refresh_repair_warranty_status() to authenticated;

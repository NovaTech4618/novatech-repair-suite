-- Phase 4: repair intake, quotation and approval history.
-- Mirrors the live migration applied to the connected Supabase project.

create table if not exists public.repair_intake (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 branch_id uuid references public.branches(id) on delete set null,
 repair_id uuid not null unique references public.repairs(id) on delete cascade,
 device_condition text,
 screen_condition text,
 body_condition text,
 power_test text,
 charging_test text,
 camera_test text,
 speaker_test text,
 microphone_test text,
 buttons_test text,
 biometric_test text,
 network_test text,
 water_damage boolean not null default false,
 physical_damage boolean not null default false,
 customer_password_provided boolean not null default false,
 accessories_received text,
 missing_items text,
 intake_notes text,
 customer_acknowledged boolean not null default false,
 acknowledged_at timestamptz,
 acknowledged_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.repair_quotes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 branch_id uuid references public.branches(id) on delete set null,
 repair_id uuid not null unique references public.repairs(id) on delete cascade,
 amount numeric not null check (amount >= 0),
 notes text,
 status text not null default 'draft' check (status in ('draft','sent','approved','rejected','expired','superseded')),
 sent_at timestamptz,
 approved_at timestamptz,
 rejected_at timestamptz,
 expires_at timestamptz,
 created_by uuid,
 approved_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.repair_approval_history (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 branch_id uuid references public.branches(id) on delete set null,
 repair_id uuid not null references public.repairs(id) on delete cascade,
 quote_id uuid references public.repair_quotes(id) on delete set null,
 action text not null check (action in ('sent','approved','rejected','expired','superseded')),
 amount numeric check (amount is null or amount >= 0),
 notes text,
 acted_by uuid,
 acted_at timestamptz not null default now()
);

create index if not exists idx_repair_intake_company_branch on public.repair_intake(company_id, branch_id);
create index if not exists idx_repair_quotes_company_branch_status on public.repair_quotes(company_id, branch_id, status);
create index if not exists idx_repair_approval_history_repair on public.repair_approval_history(company_id, repair_id, acted_at desc);

alter table public.repair_intake enable row level security;
alter table public.repair_quotes enable row level security;
alter table public.repair_approval_history enable row level security;

create policy repair_intake_select on public.repair_intake for select to authenticated using (company_id = public.get_my_company_id() and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_intake_insert on public.repair_intake for insert to authenticated with check (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_intake_update on public.repair_intake for update to authenticated using (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id))) with check (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_intake_delete on public.repair_intake for delete to authenticated using (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));

create policy repair_quotes_select on public.repair_quotes for select to authenticated using (company_id = public.get_my_company_id() and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_quotes_insert on public.repair_quotes for insert to authenticated with check (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_quotes_update on public.repair_quotes for update to authenticated using (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id))) with check (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_quotes_delete on public.repair_quotes for delete to authenticated using (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));

create policy repair_approval_history_select on public.repair_approval_history for select to authenticated using (company_id = public.get_my_company_id() and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_approval_history_insert on public.repair_approval_history for insert to authenticated with check (company_id = public.get_my_company_id() and public.has_permission('repairs.manage') and (branch_id is null or public.user_has_branch_access(branch_id)));
create policy repair_approval_history_no_update on public.repair_approval_history for update to authenticated using (false) with check (false);
create policy repair_approval_history_no_delete on public.repair_approval_history for delete to authenticated using (false);

create or replace function public.send_repair_quote(p_repair_id uuid, p_amount numeric, p_notes text default null, p_expires_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_branch uuid; v_quote uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 v_company := public.get_my_company_id();
 select branch_id into v_branch from public.repairs where id=p_repair_id and company_id=v_company for update;
 if not found then raise exception 'Repair not found'; end if;
 if p_amount is null or p_amount < 0 then raise exception 'Quote amount cannot be negative'; end if;
 insert into public.repair_quotes(company_id,branch_id,repair_id,amount,notes,status,sent_at,expires_at,created_by)
 values(v_company,v_branch,p_repair_id,p_amount,p_notes,'sent',now(),p_expires_at,auth.uid())
 on conflict(repair_id) do update set amount=excluded.amount,notes=excluded.notes,status='sent',sent_at=now(),expires_at=excluded.expires_at,updated_at=now()
 returning id into v_quote;
 insert into public.repair_approval_history(company_id,branch_id,repair_id,quote_id,action,amount,notes,acted_by) values(v_company,v_branch,p_repair_id,v_quote,'sent',p_amount,p_notes,auth.uid());
 update public.repairs set estimated_cost=p_amount,status='Estimate Sent' where id=p_repair_id;
 return v_quote;
end; $$;

create or replace function public.respond_to_repair_quote(p_quote_id uuid, p_action text, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_repair uuid; v_branch uuid; v_amount numeric; v_status text; v_action text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_company := public.get_my_company_id();
 v_action := lower(trim(p_action));
 if v_action not in ('approved','rejected') then raise exception 'Invalid quote response'; end if;
 select repair_id,branch_id,amount,status into v_repair,v_branch,v_amount,v_status from public.repair_quotes where id=p_quote_id and company_id=v_company for update;
 if not found then raise exception 'Quote not found'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 if v_status <> 'sent' then raise exception 'Quote is not awaiting a response'; end if;
 update public.repair_quotes set status=v_action, approved_at=case when v_action='approved' then now() else null end, rejected_at=case when v_action='rejected' then now() else null end, approved_by=auth.uid(), updated_at=now() where id=p_quote_id;
 insert into public.repair_approval_history(company_id,branch_id,repair_id,quote_id,action,amount,notes,acted_by) values(v_company,v_branch,v_repair,p_quote_id,v_action,v_amount,p_notes,auth.uid());
 update public.repairs set status=case when v_action='approved' then 'Customer Approved' else 'Received' end, estimated_cost=v_amount where id=v_repair;
 return p_quote_id;
end; $$;

revoke all on function public.send_repair_quote(uuid,numeric,text,timestamptz) from public, anon;
revoke all on function public.respond_to_repair_quote(uuid,text,text) from public, anon;
grant execute on function public.send_repair_quote(uuid,numeric,text,timestamptz) to authenticated;
grant execute on function public.respond_to_repair_quote(uuid,text,text) to authenticated;

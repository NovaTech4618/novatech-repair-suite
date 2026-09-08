-- Phase 3 cleanup + Phase 4 close-out foundation.
-- Preserve the current UI; improve database access, API exposure, and SLA reporting.

drop index if exists public.idx_audit_logs_company_date;
drop index if exists public.idx_financial_company_date;
drop index if exists public.inventory_stock_movements_company_idx;
drop index if exists public.inventory_stock_movements_inventory_idx;
drop index if exists public.repair_payments_repair_idx;
drop index if exists public.uq_user_branches_assignment;

drop policy if exists customer_debt_insert on public.customer_debt_ledger;

drop policy if exists "Technical services managed by authorized staff" on public.technical_services;
drop policy if exists "Technical services visible in accessible branches" on public.technical_services;

create policy "Technical services visible to authorized staff"
on public.technical_services for select to authenticated
using (
  company_id = (select public.get_my_company_id())
  and (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role = any(array['owner','branch_manager']::text[]) and p.is_active = true)
    or exists (select 1 from public.branches b where b.id = technical_services.branch_id and b.company_id = technical_services.company_id and b.is_active = true)
  )
);

create policy "Technical services managers can insert"
on public.technical_services for insert to authenticated
with check (
  company_id = (select public.get_my_company_id())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role = any(array['owner','branch_manager']::text[]) and p.is_active = true)
  and exists (select 1 from public.branches b where b.id = technical_services.branch_id and b.company_id = technical_services.company_id)
);

create policy "Technical services managers can update"
on public.technical_services for update to authenticated
using (
  company_id = (select public.get_my_company_id())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role = any(array['owner','branch_manager']::text[]) and p.is_active = true)
)
with check (
  company_id = (select public.get_my_company_id())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role = any(array['owner','branch_manager']::text[]) and p.is_active = true)
  and exists (select 1 from public.branches b where b.id = technical_services.branch_id and b.company_id = technical_services.company_id)
);

create policy "Technical services managers can delete"
on public.technical_services for delete to authenticated
using (
  company_id = (select public.get_my_company_id())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role = any(array['owner','branch_manager']::text[]) and p.is_active = true)
);

-- Optimize stable auth/helper calls in flagged RLS policies.
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists customer_requests_branch_insert on public.customer_requests;
create policy customer_requests_branch_insert on public.customer_requests for insert to authenticated
with check (company_id = (select public.get_my_company_id()) and created_by = (select auth.uid()) and ((branch_id is null) or public.user_has_branch_access(branch_id)));

drop policy if exists "company members can view subscription" on public.company_subscriptions;
create policy "company members can view subscription" on public.company_subscriptions for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = company_subscriptions.company_id and p.is_active = true));

drop policy if exists quick_logs_insert_company on public.quick_logs;
create policy quick_logs_insert_company on public.quick_logs for insert to authenticated
with check (company_id = (select public.get_my_company_id()) and created_by = (select auth.uid()));

drop policy if exists quick_logs_select_company on public.quick_logs;
create policy quick_logs_select_company on public.quick_logs for select to authenticated
using (company_id = (select public.get_my_company_id()));

-- Assistant policies.
drop policy if exists "premium members can create assistant conversations" on public.assistant_conversations;
create policy "premium members can create assistant conversations" on public.assistant_conversations for insert to authenticated
with check ((select public.has_premium_access()) and created_by = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = assistant_conversations.company_id and p.is_active = true));

drop policy if exists "premium members can update assistant conversations" on public.assistant_conversations;
create policy "premium members can update assistant conversations" on public.assistant_conversations for update to authenticated
using ((select public.has_premium_access()) and created_by = (select auth.uid()))
with check ((select public.has_premium_access()) and created_by = (select auth.uid()));

drop policy if exists "premium members can view assistant conversations" on public.assistant_conversations;
create policy "premium members can view assistant conversations" on public.assistant_conversations for select to authenticated
using ((select public.has_premium_access()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = assistant_conversations.company_id and p.is_active = true));

drop policy if exists "premium members can create assistant messages" on public.assistant_messages;
create policy "premium members can create assistant messages" on public.assistant_messages for insert to authenticated
with check ((select public.has_premium_access()) and user_id = (select auth.uid()) and exists (select 1 from public.assistant_conversations c where c.id = assistant_messages.conversation_id and c.company_id = assistant_messages.company_id and c.created_by = (select auth.uid())));

drop policy if exists "premium members can view assistant messages" on public.assistant_messages;
create policy "premium members can view assistant messages" on public.assistant_messages for select to authenticated
using ((select public.has_premium_access()) and exists (select 1 from public.assistant_conversations c where c.id = assistant_messages.conversation_id and c.company_id = assistant_messages.company_id and c.created_by = (select auth.uid())));

-- Suppliers.
drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers for select to authenticated
using (company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid())) and is_active);

drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers for insert to authenticated
with check (company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid())) and (select public.has_permission('inventory.manage'::text)));

drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers for update to authenticated
using (company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid())) and (select public.has_permission('inventory.manage'::text)))
with check (company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid())));

-- Phase 4 Data API surface.
revoke all on table public.repair_intake, public.repair_quotes, public.repair_approval_history, public.repair_outcomes, public.repair_warranties, public.repair_handovers, public.repair_repeat_links from anon, public;
grant select, insert, update, delete on table public.repair_intake to authenticated;
grant select, insert, update, delete on table public.repair_quotes to authenticated;
grant select, insert on table public.repair_approval_history to authenticated;
grant select, insert, update on table public.repair_outcomes to authenticated;
grant select, insert, update on table public.repair_warranties to authenticated;
grant select, insert, update on table public.repair_handovers to authenticated;
grant select, insert on table public.repair_repeat_links to authenticated;

-- Relational contract for handover/repeat records.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='repair_handovers_repair_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_repair_id_fkey foreign key (repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_handovers_customer_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_handovers_branch_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_branch_id_fkey foreign key (branch_id) references public.branches(id) on delete set null; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_original_repair_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_original_repair_fkey foreign key (original_repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_repeat_repair_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_repeat_repair_fkey foreign key (repeat_repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_warranty_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_warranty_fkey foreign key (warranty_id) references public.repair_warranties(id) on delete set null; end if;
end $$;

create or replace view public.repair_sla_summary with (security_invoker = true) as
select r.id,r.company_id,r.branch_id,r.engineer_id,r.device_id,r.issue,r.status,r.priority,r.received_at,r.expected_completion_date,
case
 when lower(coalesce(r.status,'')) in ('completed','collected','cancelled','no fix','no_fix','failed repair','returned unrepaired') then 'closed'
 when r.expected_completion_date is null then 'no_deadline'
 when r.expected_completion_date < current_date then 'overdue'
 when r.expected_completion_date = current_date then 'due_today'
 when r.expected_completion_date <= current_date + 2 then 'due_soon'
 else 'on_track' end as sla_state,
case when lower(coalesce(r.status,'')) in ('completed','collected','cancelled','no fix','no_fix','failed repair','returned unrepaired') then 0 when r.expected_completion_date is not null and r.expected_completion_date < current_date then current_date-r.expected_completion_date else 0 end as days_overdue
from public.repairs r;
revoke all on table public.repair_sla_summary from anon, public;
grant select on table public.repair_sla_summary to authenticated;
create index if not exists idx_repairs_company_sla_due on public.repairs(company_id, expected_completion_date, status);

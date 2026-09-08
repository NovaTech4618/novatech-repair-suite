-- Phase 4 close-out: make terminal repair outcomes and SLA reporting consistent.
alter table public.repairs drop constraint if exists repairs_status_allowed;
alter table public.repairs add constraint repairs_status_allowed check (status = any(array['Received','Diagnosis','Estimate Sent','Customer Approved','Repairing','Testing','Completed','Collected','No Fix','Failed Repair','Returned Unrepaired','Cancelled']::text[]));
create index if not exists idx_repairs_company_sla_due on public.repairs(company_id, expected_completion_date, status);
revoke all on table public.repair_handovers, public.repair_repeat_links from anon, public;
grant select, insert, update on table public.repair_handovers to authenticated;
grant select, insert on table public.repair_repeat_links to authenticated;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='repair_handovers_repair_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_repair_id_fkey foreign key (repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_handovers_customer_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_handovers_branch_id_fkey') then alter table public.repair_handovers add constraint repair_handovers_branch_id_fkey foreign key (branch_id) references public.branches(id) on delete set null; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_original_repair_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_original_repair_fkey foreign key (original_repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_repeat_repair_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_repeat_repair_fkey foreign key (repeat_repair_id) references public.repairs(id) on delete cascade; end if;
  if not exists (select 1 from pg_constraint where conname='repair_repeat_links_warranty_fkey') then alter table public.repair_repeat_links add constraint repair_repeat_links_warranty_fkey foreign key (warranty_id) references public.repair_warranties(id) on delete set null; end if;
end $$;
revoke all on table public.repair_sla_summary from anon, public;
grant select on table public.repair_sla_summary to authenticated;

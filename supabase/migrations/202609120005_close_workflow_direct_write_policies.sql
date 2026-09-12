-- Authoritative workflow tables must not expose direct Data API INSERT/UPDATE/DELETE paths.
drop policy if exists repair_parts_usage_insert on public.repair_parts_usage;
drop policy if exists repair_assignments_branch_insert on public.repair_assignments;
drop policy if exists invoices_branch_insert on public.invoices;
drop policy if exists invoice_items_branch_insert on public.invoice_items;
drop policy if exists customer_debt_branch_insert on public.customer_debt_ledger;

drop policy if exists repair_parts_usage_update on public.repair_parts_usage;
drop policy if exists repair_parts_usage_delete on public.repair_parts_usage;
create policy repair_parts_usage_no_direct_update on public.repair_parts_usage for update to authenticated using(false) with check(false);
create policy repair_parts_usage_no_direct_delete on public.repair_parts_usage for delete to authenticated using(false);

drop policy if exists repair_assignments_update on public.repair_assignments;
drop policy if exists repair_assignments_delete on public.repair_assignments;
create policy repair_assignments_no_direct_update on public.repair_assignments for update to authenticated using(false) with check(false);
create policy repair_assignments_no_direct_delete on public.repair_assignments for delete to authenticated using(false);

create policy invoices_no_direct_update on public.invoices for update to authenticated using(false) with check(false);
create policy invoices_no_direct_delete on public.invoices for delete to authenticated using(false);
create policy invoice_items_no_direct_update on public.invoice_items for update to authenticated using(false) with check(false);
create policy invoice_items_no_direct_delete on public.invoice_items for delete to authenticated using(false);

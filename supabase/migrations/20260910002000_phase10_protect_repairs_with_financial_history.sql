-- Phase 9 (Pricing/Negotiation): audited, nothing exists yet anywhere in
-- the codebase (no pricing rules, ranges, approval flow, or logging).
-- Matches the roadmap's own "Planned" status exactly - correctly unbuilt,
-- not a bug. Not inventing pricing/discount policy without a spec.

-- Phase 10 (UX Polish / dangerous-action safety):
-- Delete buttons for customers/devices/inventory/repairs all already use
-- a confirm() dialog and toast feedback - reasonable baseline, verified
-- across CustomerTable, DeviceTable, InventoryTable, RepairTable.
--
-- But repairService.deleteRepair() does a raw hard DELETE on `repairs`,
-- and 10 foreign keys from repair_payments, repair_parts_usage,
-- repair_quotes, repair_warranties, repair_handovers, repair_outcomes,
-- repair_status_history, repair_tickets, repair_assignments, and
-- repair_repeat_links are all ON DELETE CASCADE. Any staff member with
-- repairs.manage permission could click "Delete" behind nothing but a
-- generic browser confirm dialog and permanently wipe every payment,
-- parts-usage record, quote, and warranty tied to that repair, with no
-- indication of what's being destroyed. The roadmap already has a proper
-- "Cancelled" status for exactly this situation, so hard deletion of a
-- repair with financial history should not be possible at all.
--
-- Fixed at the trigger level so it's protected regardless of which code
-- path calls it (also protects the customer -> device -> repair cascade
-- path, since row-level triggers still fire on cascaded deletes).
create or replace function public.prevent_deletion_of_repairs_with_history()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_payment_count int; v_parts_count int; v_invoice_count int;
begin
  select count(*) into v_payment_count from public.repair_payments where repair_id = old.id;
  select count(*) into v_parts_count from public.repair_parts_usage where repair_id = old.id;
  select count(*) into v_invoice_count from public.invoices where repair_id = old.id;
  if v_payment_count > 0 or v_parts_count > 0 or v_invoice_count > 0 then
    raise exception 'This repair has payments, parts usage, or invoices on record and cannot be deleted. Use "Cancel repair" instead to keep the financial history intact.';
  end if;
  return old;
end;
$function$;

drop trigger if exists trg_prevent_deletion_of_repairs_with_history on public.repairs;
create trigger trg_prevent_deletion_of_repairs_with_history
  before delete on public.repairs
  for each row execute function public.prevent_deletion_of_repairs_with_history();

-- Also checked: customers already have solid protection independent of
-- this - customer_debt_ledger's FK uses ON DELETE RESTRICT, so any
-- customer with debt history already can't be deleted. The repairs
-- trigger above now extends that same protection through the
-- customer -> device -> repair cascade path too.

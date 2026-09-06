-- Phase 2 security hardening: keep trigger-only functions out of the Data API.
revoke all on function public.audit_operational_change() from public, anon, authenticated;
revoke all on function public.sync_repair_customer_debt() from public, anon, authenticated;
revoke all on function public.sync_sale_customer_debt() from public, anon, authenticated;
revoke all on function public.sync_repair_payment_debt() from public, anon, authenticated;
revoke all on function public.assign_repair_engineer(uuid, uuid, text) from public, anon;
grant execute on function public.assign_repair_engineer(uuid, uuid, text) to authenticated;
revoke all on function public.write_audit_log(text, text, uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.write_audit_log(text, text, uuid, jsonb, jsonb, jsonb) to authenticated;

-- This function is a trigger function, not an API/RPC entry point.
-- It remains SECURITY DEFINER because it writes owner notifications from
-- sales/repair triggers, but direct PostgREST execution is not permitted.
REVOKE EXECUTE ON FUNCTION public.queue_owner_transaction_notification() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_owner_transaction_notification() TO postgres;

COMMENT ON FUNCTION public.queue_owner_transaction_notification() IS
  'Internal trigger function only. Direct API execution is revoked for anon/authenticated; invoked by database triggers.';

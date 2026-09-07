-- Harden trigger-maintenance function so it is not callable by anonymous clients.
-- The trigger can still invoke the function without granting API callers EXECUTE.
revoke execute on function public.update_parts_credit_status() from public;
revoke execute on function public.update_parts_credit_status() from anon;

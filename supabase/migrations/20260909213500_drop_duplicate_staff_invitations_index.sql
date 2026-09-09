-- Linter flagged two identical unique partial indexes on staff_invitations
-- (company_id, lower(email)) where status = 'pending'. Keep the semantically
-- named one, drop the redundant manually-created one.
drop index if exists public.idx_staff_invitations_pending_email;

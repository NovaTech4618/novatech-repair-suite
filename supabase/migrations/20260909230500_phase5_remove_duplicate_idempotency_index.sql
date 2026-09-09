-- Keep the pre-existing unique idempotency index and remove the duplicate created by an earlier audit pass.
drop index if exists public.invoice_payments_company_idempotency_key_idx;

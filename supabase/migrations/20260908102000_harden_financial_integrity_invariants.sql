-- Financial integrity invariants applied to the production database.
-- Idempotent so source-controlled environments can safely reconcile existing rules.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_amount_positive') THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payments_amount_positive') THEN
    ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_unit_price_nonnegative') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_unit_price_nonnegative CHECK (unit_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_total_price_nonnegative') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_total_price_nonnegative CHECK (total_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_amounts_nonnegative') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_amounts_nonnegative CHECK (
      coalesce(subtotal, 0) >= 0 AND coalesce(discount, 0) >= 0 AND coalesce(total, 0) >= 0
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payments_method_valid') THEN
    ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_method_valid CHECK (
      lower(trim(payment_method)) IN ('cash','transfer','pos','card','bank_transfer','other')
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_method_valid') THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_method_valid CHECK (
      payment_method IS NULL OR lower(trim(payment_method)) IN ('cash','transfer','pos','card','bank_transfer','other')
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_debt_one_sided_entry') THEN
    ALTER TABLE public.customer_debt_ledger ADD CONSTRAINT customer_debt_one_sided_entry CHECK (
      (debit > 0 AND coalesce(credit, 0) = 0) OR (credit > 0 AND coalesce(debit, 0) = 0)
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payments_date_present') THEN
    ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_date_present CHECK (payment_date IS NOT NULL) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_amount
  ON public.invoice_payments(invoice_id, amount);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_source
  ON public.financial_transactions(company_id, source_type, source_id);

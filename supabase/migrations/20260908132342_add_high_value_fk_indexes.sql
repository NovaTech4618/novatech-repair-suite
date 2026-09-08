-- Phase 5 performance hardening: indexes for common tenant-scoped joins.
-- Keep these aligned with common company-scoped query patterns.

CREATE INDEX IF NOT EXISTS idx_customers_company_id
  ON public.customers (company_id);

CREATE INDEX IF NOT EXISTS idx_devices_company_customer
  ON public.devices (company_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_repairs_company_device
  ON public.repairs (company_id, device_id);

CREATE INDEX IF NOT EXISTS idx_repairs_company_engineer_created_at
  ON public.repairs (company_id, engineer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_company_customer_date
  ON public.sales (company_id, customer_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_repair
  ON public.invoices (company_id, repair_id);

CREATE INDEX IF NOT EXISTS idx_invoices_company_sale
  ON public.invoices (company_id, sale_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_company_invoice
  ON public.invoice_items (company_id, invoice_id);

CREATE INDEX IF NOT EXISTS idx_customer_debt_company_invoice
  ON public.customer_debt_ledger (company_id, invoice_id);

CREATE INDEX IF NOT EXISTS idx_repair_handovers_company_repair
  ON public.repair_handovers (company_id, repair_id);

CREATE INDEX IF NOT EXISTS idx_repair_quotes_company_repair
  ON public.repair_quotes (company_id, repair_id);

CREATE INDEX IF NOT EXISTS idx_repair_intake_company_repair
  ON public.repair_intake (company_id, repair_id);

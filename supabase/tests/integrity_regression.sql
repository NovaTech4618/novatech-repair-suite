-- NOVATECH Repair Suite database regression checks.
-- Read-only: safe to run against staging or production with psql.
-- The script fails fast when a critical security/integrity invariant regresses.

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RLS regression: % public tables have RLS disabled', v_count;
  END IF;
END $$;

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles));
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RLS regression: % public/anon policies remain', v_count;
  END IF;
END $$;

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RPC regression: % SECURITY DEFINER functions executable by anon', v_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_amount_positive') THEN
    RAISE EXCEPTION 'Missing financial_transactions_amount_positive constraint';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payments_amount_positive') THEN
    RAISE EXCEPTION 'Missing invoice_payments_amount_positive constraint';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_amounts_nonnegative') THEN
    RAISE EXCEPTION 'Missing sales_amounts_nonnegative constraint';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_unit_price_nonnegative') THEN
    RAISE EXCEPTION 'Missing sale_items_unit_price_nonnegative constraint';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_total_price_nonnegative') THEN
    RAISE EXCEPTION 'Missing sale_items_total_price_nonnegative constraint';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_debt_one_sided_entry') THEN
    RAISE EXCEPTION 'Missing customer_debt_one_sided_entry constraint';
  END IF;
END $$;

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'inventory_stock_movements'
    AND policyname IN ('inventory_stock_movements_no_direct_insert', 'inventory_stock_movements_no_update', 'inventory_stock_movements_no_delete');
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Inventory ledger regression: expected 3 direct-write blocking policies, found %', v_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'record_inventory_movement is not executable by authenticated users';
  END IF;
  IF has_function_privilege('anon', 'public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'record_inventory_movement must not be executable by anon';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.record_customer_debt(uuid,uuid,text,numeric,numeric,text,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'record_customer_debt is not executable by authenticated users';
  END IF;
  IF has_function_privilege('anon', 'public.record_customer_debt(uuid,uuid,text,numeric,numeric,text,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'record_customer_debt must not be executable by anon';
  END IF;
END $$;

-- Data-quality smoke checks. These should remain zero.
SELECT 'negative_financial_transactions' AS check_name, count(*) AS failures
FROM public.financial_transactions WHERE amount <= 0
UNION ALL
SELECT 'nonpositive_invoice_payments', count(*)
FROM public.invoice_payments WHERE amount <= 0
UNION ALL
SELECT 'negative_sale_item_prices', count(*)
FROM public.sale_items WHERE unit_price < 0 OR total_price < 0
UNION ALL
SELECT 'negative_sales_amounts', count(*)
FROM public.sales WHERE coalesce(subtotal,0) < 0 OR coalesce(discount,0) < 0 OR coalesce(total,0) < 0
UNION ALL
SELECT 'invalid_debt_entries', count(*)
FROM public.customer_debt_ledger
WHERE NOT ((debit > 0 AND coalesce(credit,0)=0) OR (credit > 0 AND coalesce(debit,0)=0));

create or replace function public.record_supplier_account_payment(
  p_supplier_id uuid,
  p_amount numeric,
  p_payment_method text default 'cash',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile record;
  v_supplier record;
  v_remaining numeric := p_amount;
  v_total_outstanding numeric := 0;
  v_allocations jsonb := '[]'::jsonb;
  v_purchase record;
  v_allocation numeric;
  v_new_paid numeric;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select id, company_id, is_active into v_profile
  from public.profiles
  where id = v_uid;
  if not found or not v_profile.is_active then raise exception 'Active profile required'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Payment management permission required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be positive'; end if;
  if p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;

  select id, name into v_supplier
  from public.suppliers
  where id = p_supplier_id
    and company_id = v_profile.company_id
    and is_active = true;
  if not found then raise exception 'Supplier not found'; end if;

  for v_purchase in
    select id, total_amount, amount_paid
    from public.inventory_purchases
    where supplier_id = p_supplier_id
      and company_id = v_profile.company_id
      and total_amount > amount_paid
    order by purchase_date asc, created_at asc, id asc
    for update
  loop
    v_total_outstanding := v_total_outstanding + greatest(v_purchase.total_amount - v_purchase.amount_paid, 0);
  end loop;

  if p_amount > v_total_outstanding then
    raise exception 'Payment exceeds supplier outstanding balance. Outstanding: %', v_total_outstanding;
  end if;

  for v_purchase in
    select id, total_amount, amount_paid
    from public.inventory_purchases
    where supplier_id = p_supplier_id
      and company_id = v_profile.company_id
      and total_amount > amount_paid
    order by purchase_date asc, created_at asc, id asc
    for update
  loop
    exit when v_remaining <= 0;
    v_allocation := least(v_remaining, greatest(v_purchase.total_amount - v_purchase.amount_paid, 0));
    if v_allocation <= 0 then continue; end if;

    v_new_paid := v_purchase.amount_paid + v_allocation;
    update public.inventory_purchases
    set amount_paid = v_new_paid,
        payment_status = case when v_new_paid >= v_purchase.total_amount then 'paid' else 'partial' end
    where id = v_purchase.id;

    insert into public.financial_transactions(
      company_id, direction, category, amount, payment_method,
      description, reference_type, reference_id, created_by
    ) values (
      v_profile.company_id, 'out', 'part_purchase', v_allocation, p_payment_method,
      coalesce(nullif(trim(p_notes), ''), 'Supplier payable payment') || ' · ' || v_supplier.name,
      'inventory_purchase', v_purchase.id, v_uid
    );

    v_allocations := v_allocations || jsonb_build_array(
      jsonb_build_object('purchase_id', v_purchase.id, 'amount', v_allocation)
    );
    v_remaining := v_remaining - v_allocation;
  end loop;

  return jsonb_build_object(
    'supplier_id', p_supplier_id,
    'amount_paid', p_amount,
    'allocated', p_amount - v_remaining,
    'allocations', v_allocations,
    'outstanding', v_total_outstanding - p_amount
  );
end;
$function$;

revoke all on function public.record_supplier_account_payment(uuid,numeric,text,text) from public;
grant execute on function public.record_supplier_account_payment(uuid,numeric,text,text) to authenticated;

revoke execute on function public.create_invoice_with_item(
  text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text,text,numeric,numeric
) from anon;
revoke execute on function public.engineer_opening_balance(uuid,numeric,text) from anon;

-- Keep purchase receiving aligned with the inventory movement ledger.
-- Purchases must change stock through record_inventory_movement so the stock
-- balance and movement history cannot silently diverge.

create or replace function public.create_inventory_purchase(p_supplier text, p_invoice_reference text, p_inventory_id uuid, p_quantity integer, p_unit_cost numeric, p_payment_status text, p_payment_method text, p_notes text default null, p_amount_paid numeric default 0, p_supplier_id uuid default null)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile record;
  v_item record;
  v_supplier_id uuid := p_supplier_id;
  v_total numeric := p_quantity * p_unit_cost;
  v_paid numeric := coalesce(p_amount_paid,0);
  v_purchase_id uuid;
  v_new_qty integer;
  v_weighted_cost numeric;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select id, company_id, is_active into v_profile from public.profiles where id=v_uid;
  if not found or not v_profile.is_active then raise exception 'Active profile required'; end if;
  if not public.has_permission('inventory.manage') then raise exception 'Inventory management permission required'; end if;
  if p_quantity is null or p_quantity < 1 then raise exception 'Quantity must be positive'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;
  if p_payment_status not in ('paid','partial','unpaid') then raise exception 'Invalid payment status'; end if;
  if p_payment_status='paid' then v_paid:=v_total;
  elsif p_payment_status='unpaid' then v_paid:=0;
  elsif v_paid<=0 or v_paid>=v_total then raise exception 'Partial payment must be greater than 0 and less than total'; end if;
  if p_payment_status in ('paid','partial') and p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  if p_payment_status='unpaid' then p_payment_method:='credit'; end if;

  select * into v_item from public.inventory where id=p_inventory_id for update;
  if not found then raise exception 'Inventory item not found'; end if;
  if v_item.company_id <> v_profile.company_id then raise exception 'Inventory item is outside your company'; end if;
  if v_item.branch_id is not null and not public.user_has_branch_access(v_item.branch_id) then raise exception 'No access to inventory branch'; end if;
  if v_supplier_id is not null then
    select id into v_supplier_id from public.suppliers where id=v_supplier_id and company_id=v_profile.company_id and is_active=true;
    if not found then raise exception 'Invalid supplier'; end if;
  end if;
  if v_supplier_id is null and nullif(trim(coalesce(p_supplier,'')),'') is null then raise exception 'Supplier is required'; end if;

  insert into public.inventory_purchases(company_id,supplier_id,supplier,invoice_reference,purchase_date,payment_method,total_amount,amount_paid,payment_status,notes,created_by)
  values(v_profile.company_id,v_supplier_id,trim(p_supplier),nullif(trim(p_invoice_reference),''),now(),p_payment_method,v_total,v_paid,p_payment_status,p_notes,v_uid)
  returning id into v_purchase_id;
  insert into public.inventory_purchase_items(company_id,purchase_id,inventory_id,quantity,unit_cost,total_cost)
  values(v_profile.company_id,v_purchase_id,p_inventory_id,p_quantity,p_unit_cost,v_total);

  v_new_qty := coalesce(v_item.quantity,0) + p_quantity;
  v_weighted_cost := case when v_new_qty > 0 then ((coalesce(v_item.quantity,0) * coalesce(v_item.cost_price,0)) + v_total) / v_new_qty else p_unit_cost end;
  perform public.record_inventory_movement(p_inventory_id,'purchase',p_quantity,p_unit_cost,'purchase',v_purchase_id,p_notes);
  update public.inventory set cost_price=v_weighted_cost,updated_at=now() where id=p_inventory_id;

  if v_paid > 0 then
    insert into public.financial_transactions(company_id,direction,category,amount,payment_method,description,reference_type,reference_id,created_by)
    values(v_profile.company_id,'out','part_purchase',v_paid,p_payment_method,'Inventory purchase payment','inventory_purchase',v_purchase_id,v_uid);
  end if;
  return jsonb_build_object('purchase_id',v_purchase_id,'total_amount',v_total,'amount_paid',v_paid,'payment_status',p_payment_status,'supplier_id',v_supplier_id);
end;
$function$;

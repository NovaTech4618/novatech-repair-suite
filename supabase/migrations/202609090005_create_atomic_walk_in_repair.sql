create or replace function public.create_walk_in_repair(
  p_customer_name text,
  p_phone text,
  p_device_type text,
  p_brand text,
  p_model text,
  p_serial_number text default null,
  p_color text default null,
  p_issue text default '',
  p_technician text default null,
  p_estimated_cost numeric default null,
  p_deposit numeric default 0,
  p_payment_method text default 'Cash',
  p_priority text default 'Normal',
  p_expected_completion_date date default null
)
returns table(repair_id uuid, customer_id uuid, device_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_branch_id uuid;
  v_customer_id uuid;
  v_device_id uuid;
  v_repair_id uuid;
  v_payment_method text;
  v_estimated numeric;
  v_deposit numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then
    raise exception 'Your account is not connected to a company';
  end if;

  if not public.has_permission('repairs.manage') then
    raise exception 'You do not have permission to create repairs';
  end if;

  select ub.branch_id into v_branch_id
  from public.user_branches ub
  join public.branches b on b.id = ub.branch_id and b.company_id = v_company_id
  where ub.profile_id = auth.uid()
  order by ub.created_at asc
  limit 1;

  if v_branch_id is null then
    select b.id into v_branch_id
    from public.branches b
    where b.company_id = v_company_id and b.is_main = true
    order by b.created_at asc
    limit 1;
  end if;

  if v_branch_id is null then
    raise exception 'No branch is assigned to your account';
  end if;

  if nullif(trim(coalesce(p_customer_name, '')), '') is null then
    raise exception 'Customer name is required';
  end if;
  if nullif(trim(coalesce(p_phone, '')), '') is null then
    raise exception 'Customer phone is required';
  end if;
  if nullif(trim(coalesce(p_brand, '')), '') is null or nullif(trim(coalesce(p_model, '')), '') is null then
    raise exception 'Device brand and model are required';
  end if;
  if nullif(trim(coalesce(p_issue, '')), '') is null then
    raise exception 'Repair issue is required';
  end if;

  v_estimated := p_estimated_cost;
  v_deposit := coalesce(p_deposit, 0);
  if v_estimated is not null and (v_estimated < 0 or v_estimated <> v_estimated) then
    raise exception 'Estimated cost is invalid';
  end if;
  if v_deposit < 0 or v_deposit <> v_deposit then
    raise exception 'Deposit is invalid';
  end if;
  if v_estimated is not null and v_deposit > v_estimated then
    raise exception 'Deposit cannot be greater than the estimated cost';
  end if;

  v_payment_method := case lower(trim(coalesce(p_payment_method, 'cash')))
    when 'cash' then 'Cash'
    when 'transfer' then 'Transfer'
    when 'pos' then 'POS'
    when 'other' then 'Other'
    else null
  end;
  if v_payment_method is null then
    raise exception 'Invalid payment method';
  end if;

  select c.id into v_customer_id
  from public.customers c
  where c.company_id = v_company_id and c.phone = trim(p_phone)
  order by c.created_at asc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (company_id, full_name, phone, email, address)
    values (v_company_id, trim(p_customer_name), trim(p_phone), null, null)
    returning id into v_customer_id;
  else
    update public.customers
    set full_name = trim(p_customer_name)
    where id = v_customer_id and company_id = v_company_id;
  end if;

  insert into public.devices (
    company_id, customer_id, device_type, brand, model, serial_number, color,
    condition, accessories, problem
  ) values (
    v_company_id, v_customer_id, coalesce(nullif(trim(p_device_type), ''), 'Phone'),
    trim(p_brand), trim(p_model), nullif(trim(coalesce(p_serial_number, '')), ''),
    nullif(trim(coalesce(p_color, '')), ''), null, null, trim(p_issue)
  ) returning id into v_device_id;

  insert into public.repairs (
    company_id, branch_id, device_id, technician, issue, diagnosis, repair_notes,
    solution, priority, deposit, deposit_payment_method, expected_completion_date,
    estimated_cost, final_cost, status
  ) values (
    v_company_id, v_branch_id, v_device_id, nullif(trim(coalesce(p_technician, '')), ''),
    trim(p_issue), null, null, null, coalesce(nullif(trim(p_priority), ''), 'Normal'),
    0, v_payment_method, p_expected_completion_date, v_estimated, null, 'Received'
  ) returning id into v_repair_id;

  if v_deposit > 0 then
    insert into public.repair_payments (
      company_id, repair_id, amount, payment_method, payment_date, notes, recorded_by
    ) values (
      v_company_id, v_repair_id, v_deposit, v_payment_method, now(), 'Walk-in repair deposit', auth.uid()
    );
  end if;

  return query select v_repair_id, v_customer_id, v_device_id;
end;
$$;

revoke execute on function public.create_walk_in_repair(text,text,text,text,text,text,text,text,text,numeric,numeric,text,text,date) from public, anon;
grant execute on function public.create_walk_in_repair(text,text,text,text,text,text,text,text,text,numeric,numeric,text,text,date) to authenticated;

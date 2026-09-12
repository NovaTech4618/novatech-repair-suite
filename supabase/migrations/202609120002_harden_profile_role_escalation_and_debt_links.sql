-- Security hardening: close direct profile role/company escalation and
-- make customer-debt references obey tenant + branch boundaries.

-- Profiles are editable by their owner for ordinary profile fields, but
-- protected authorization fields must never be writable through the Data API.
create or replace function public.prevent_profile_authorization_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if new.company_id is distinct from old.company_id
     or new.role is distinct from old.role
     or new.is_active is distinct from old.is_active then
    if not public.is_company_owner()
       or new.id = auth.uid()
       or new.company_id is distinct from old.company_id then
      raise exception 'Authorization fields can only be changed by the company owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_profile_authorization_escalation() from public, anon, authenticated;

drop trigger if exists prevent_profile_authorization_escalation on public.profiles;
create trigger prevent_profile_authorization_escalation
before update on public.profiles
for each row execute function public.prevent_profile_authorization_escalation();

-- Debt records are company-scoped. If a branch is supplied, it must belong to
-- the caller's company and be one the caller can access. Source records must
-- also belong to that same company/customer relationship.
create or replace function public.record_customer_debt(
  p_customer_id uuid,
  p_source_type text,
  p_source_id uuid default null,
  p_debit numeric default 0,
  p_credit numeric default 0,
  p_invoice_id uuid default null,
  p_branch_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_id uuid;
  v_user uuid := auth.uid();
  v_balance numeric;
  v_source_branch uuid;
  v_invoice_branch uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;

  if not exists (
    select 1 from public.customers
    where id = p_customer_id and company_id = v_company
  ) then
    raise exception 'Customer not found';
  end if;

  if p_source_type not in ('invoice','repair','sale','payment','adjustment') then
    raise exception 'Invalid debt source type';
  end if;
  if p_debit < 0 or p_credit < 0 or (p_debit > 0 and p_credit > 0)
     or (p_debit = 0 and p_credit = 0) then
    raise exception 'Invalid debit/credit';
  end if;

  if p_branch_id is not null then
    if not exists (
      select 1 from public.branches
      where id = p_branch_id and company_id = v_company and is_active = true
    ) then
      raise exception 'Branch not found';
    end if;
    if not public.user_has_branch_access(p_branch_id) then
      raise exception 'Branch access denied';
    end if;
  end if;

  if p_invoice_id is not null then
    select branch_id into v_invoice_branch
    from public.invoices
    where id = p_invoice_id
      and company_id = v_company
      and (customer_id = p_customer_id or customer_id is null);
    if not found then raise exception 'Invoice not found'; end if;
    if p_branch_id is not null and v_invoice_branch is not null
       and v_invoice_branch <> p_branch_id then
      raise exception 'Debt branch does not match invoice branch';
    end if;
  end if;

  if p_source_id is not null then
    if p_source_type = 'invoice' then
      select branch_id into v_source_branch
      from public.invoices
      where id = p_source_id
        and company_id = v_company
        and (customer_id = p_customer_id or customer_id is null);
      if not found then raise exception 'Source invoice not found'; end if;
    elsif p_source_type = 'repair' then
      select r.branch_id into v_source_branch
      from public.repairs r
      join public.devices d on d.id = r.device_id
      where r.id = p_source_id
        and r.company_id = v_company
        and d.company_id = v_company
        and d.customer_id = p_customer_id;
      if not found then raise exception 'Source repair not found'; end if;
    elsif p_source_type = 'sale' then
      select branch_id into v_source_branch
      from public.sales
      where id = p_source_id
        and company_id = v_company
        and customer_id = p_customer_id;
      if not found then raise exception 'Source sale not found'; end if;
    elsif p_source_type = 'payment' then
      select r.branch_id into v_source_branch
      from public.repair_payments rp
      join public.repairs r on r.id = rp.repair_id
      join public.devices d on d.id = r.device_id
      where rp.id = p_source_id
        and r.company_id = v_company
        and d.customer_id = p_customer_id;
      if not found then raise exception 'Source payment not found'; end if;
    end if;

    if v_source_branch is not null then
      if not public.user_has_branch_access(v_source_branch) then
        raise exception 'Branch access denied';
      end if;
      if p_branch_id is not null and v_source_branch <> p_branch_id then
        raise exception 'Debt branch does not match source branch';
      end if;
    end if;
  end if;

  if p_credit > 0 then
    select coalesce(sum(debit - credit), 0) into v_balance
    from public.customer_debt_ledger
    where company_id = v_company and customer_id = p_customer_id;
    if p_credit > v_balance then
      raise exception 'Credit exceeds outstanding customer balance. Outstanding: %', greatest(v_balance, 0);
    end if;
  end if;

  insert into public.customer_debt_ledger(
    company_id, customer_id, invoice_id, source_type, source_id,
    debit, credit, branch_id, notes, created_by
  ) values (
    v_company, p_customer_id, p_invoice_id, p_source_type, p_source_id,
    p_debit, p_credit, p_branch_id, p_notes, v_user
  ) returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.record_customer_debt(uuid,text,uuid,numeric,numeric,uuid,uuid,text) to authenticated;
revoke execute on function public.record_customer_debt(uuid,text,uuid,numeric,numeric,uuid,uuid,text) from anon;

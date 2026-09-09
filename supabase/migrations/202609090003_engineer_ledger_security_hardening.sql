create or replace function public.get_engineer_balance(p_engineer_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_balance numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if not exists (select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id) then raise exception 'Engineer not found'; end if;
  if not public.has_permission('engineers.view') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
  select coalesce(sum(debit),0)-coalesce(sum(credit),0) into v_balance
  from public.engineer_transactions where engineer_id=p_engineer_id and company_id=v_company_id;
  return v_balance;
end;
$$;

create or replace function public.get_engineer_balances()
returns table(engineer_id uuid,total_debit numeric,total_credit numeric,balance numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if not public.has_permission('engineers.view') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
  return query
  select e.id,
    coalesce(sum(t.debit),0),
    coalesce(sum(t.credit),0),
    coalesce(sum(t.debit),0)-coalesce(sum(t.credit),0)
  from public.engineers e
  left join public.engineer_transactions t on t.engineer_id=e.id and t.company_id=v_company_id
  where e.company_id=v_company_id
  group by e.id;
end;
$$;

revoke execute on function public.get_engineer_balance(uuid) from public, anon;
revoke execute on function public.get_engineer_balances() from public, anon;
grant execute on function public.get_engineer_balance(uuid) to authenticated;
grant execute on function public.get_engineer_balances() to authenticated;

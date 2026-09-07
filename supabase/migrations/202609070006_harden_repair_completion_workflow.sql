create or replace function public.complete_repair(p_repair_id uuid)
returns table(id uuid, repair_id uuid, ticket_number text, issued_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_branch_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  v_company_id := public.get_my_company_id();
  select r.branch_id into v_branch_id from public.repairs r where r.id=p_repair_id and r.company_id=v_company_id;
  if not found then raise exception 'Repair not found or access denied'; end if;
  if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;

  update public.repairs set status='Completed', completed_at=now() where id=p_repair_id and company_id=v_company_id;

  if exists (select 1 from public.repair_tickets rt where rt.repair_id=p_repair_id) then
    return query select rt.id,rt.repair_id,rt.ticket_number,rt.issued_at from public.repair_tickets rt where rt.repair_id=p_repair_id;
    return;
  end if;

  return query insert into public.repair_tickets(repair_id) values(p_repair_id) returning public.repair_tickets.id,public.repair_tickets.repair_id,public.repair_tickets.ticket_number,public.repair_tickets.issued_at;
end;
$$;

revoke execute on function public.complete_repair(uuid) from anon;
grant execute on function public.complete_repair(uuid) to authenticated;

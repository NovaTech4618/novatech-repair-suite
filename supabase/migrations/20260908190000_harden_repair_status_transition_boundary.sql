-- Keep repair status changes behind the audited transition RPC.
-- This mirrors the production hardening applied to the connected Supabase project.
create or replace function public.change_repair_status(p_repair_id uuid, p_status text, p_note text default null)
returns public.repairs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repair public.repairs%rowtype;
  v_company_id uuid;
  v_old text;
  v_allowed boolean := false;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  v_company_id := public.get_my_company_id();
  select * into v_repair from public.repairs where id = p_repair_id and company_id = v_company_id for update;
  if not found then raise exception 'Repair not found or access denied'; end if;
  if v_repair.branch_id is not null and not public.user_has_branch_access(v_repair.branch_id) then raise exception 'Branch access denied'; end if;
  if p_status not in ('Received','Diagnosis','Estimate Sent','Customer Approved','Repairing','Testing','Completed','Collected','No Fix','Cancelled') then raise exception 'Invalid repair status'; end if;
  v_old := v_repair.status;
  if v_old = p_status then return v_repair; end if;
  v_allowed := case v_old
    when 'Received' then p_status in ('Diagnosis','Cancelled')
    when 'Diagnosis' then p_status in ('Estimate Sent','Repairing','No Fix','Cancelled')
    when 'Estimate Sent' then p_status in ('Customer Approved','Diagnosis','Cancelled','No Fix')
    when 'Customer Approved' then p_status in ('Repairing','Cancelled')
    when 'Repairing' then p_status in ('Testing','No Fix','Cancelled')
    when 'Testing' then p_status in ('Completed','Repairing','No Fix')
    when 'Completed' then p_status = 'Collected'
    when 'No Fix' then p_status in ('Collected','Cancelled')
    when 'Collected' then false
    when 'Cancelled' then false
    else false
  end;
  if not v_allowed then raise exception 'Invalid repair transition: % -> %', v_old, p_status; end if;
  perform set_config('app.repair_status_transition','1',true);
  update public.repairs
  set status = p_status,
      completed_at = case when p_status = 'Completed' then coalesce(completed_at, now()) else completed_at end
  where id = p_repair_id and company_id = v_company_id;
  if p_note is not null then
    update public.repair_status_history
    set note = p_note
    where id = (select id from public.repair_status_history where repair_id = p_repair_id order by changed_at desc limit 1);
  end if;
  select * into v_repair from public.repairs where id = p_repair_id and company_id = v_company_id;
  return v_repair;
end;
$$;
revoke all on function public.change_repair_status(uuid,text,text) from public, anon;
grant execute on function public.change_repair_status(uuid,text,text) to authenticated;

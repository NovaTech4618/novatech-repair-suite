create or replace function public.accept_staff_invitation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.staff_invitations%rowtype;
  v_company_id uuid;
  v_branch_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select lower(email) into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'Account email not found';
  end if;

  select * into v_invite
  from public.staff_invitations
  where lower(email) = v_email
    and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if v_invite.id is null then
    return null;
  end if;

  if v_invite.role not in ('branch_manager','technician','front_desk') then
    raise exception 'Invalid invitation role';
  end if;

  select count(*) into v_branch_count
  from unnest(v_invite.branch_ids) as requested_branch_id
  join public.branches b on b.id = requested_branch_id
  where b.company_id = v_invite.company_id
    and b.is_active = true;

  if v_branch_count <> coalesce(array_length(v_invite.branch_ids, 1), 0) then
    raise exception 'Invitation contains invalid branch access';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_user_id
      and company_id is not null
      and company_id <> v_invite.company_id
  ) then
    raise exception 'This account already belongs to another NOVATECH business';
  end if;

  v_company_id := v_invite.company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (v_user_id, v_company_id, v_email, v_invite.role)
  on conflict (id) do update
    set company_id = excluded.company_id,
        role = excluded.role,
        is_active = true;

  delete from public.user_branches where profile_id = v_user_id;

  insert into public.user_branches (profile_id, branch_id)
  select v_user_id, requested_branch_id
  from unnest(v_invite.branch_ids) as requested_branch_id;

  update public.staff_invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  return v_company_id;
end;
$$;

revoke execute on function public.accept_staff_invitation() from public, anon;
grant execute on function public.accept_staff_invitation() to authenticated;

create or replace function public.update_staff_role(p_profile_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c uuid;
  old_role text;
  target_company uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_company_owner() then raise exception 'Only the company owner can change staff roles'; end if;
  c := public.get_my_company_id();
  if p_role not in ('owner','branch_manager','technician','front_desk') then raise exception 'Invalid staff role'; end if;
  select company_id, role into target_company, old_role from public.profiles where id=p_profile_id for update;
  if target_company is null or target_company<>c then raise exception 'Staff member not found'; end if;
  if p_profile_id=auth.uid() and p_role<>'owner' then raise exception 'The owner cannot demote themselves'; end if;
  if p_role='owner' and p_profile_id<>auth.uid() then raise exception 'Owner role cannot be assigned to another account'; end if;
  update public.profiles set role=p_role where id=p_profile_id;
  insert into public.audit_logs(company_id,actor_id,action,entity_type,entity_id,old_data,new_data)
  values(c,auth.uid(),'STAFF_ROLE_CHANGED','profiles',p_profile_id,jsonb_build_object('role',old_role),jsonb_build_object('role',p_role));
end;
$$;

revoke execute on function public.update_staff_role(uuid,text) from public, anon;
grant execute on function public.update_staff_role(uuid,text) to authenticated;

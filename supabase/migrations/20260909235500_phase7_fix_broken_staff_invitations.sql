-- Phase 7: Staff + Branches + Permissions audit
--
-- CRITICAL: create_staff_invitation referenced `profiles.email`, a column
-- that has never existed on public.profiles (emails live in auth.users,
-- profiles only has id/company_id/full_name/role/is_active/created_at).
-- Confirmed by direct query: every single call to invite a staff member
-- was failing with "column email does not exist". Staff invitations have
-- been completely non-functional. Both existing invitation rows in the
-- database are already 'revoked', consistent with this never having
-- worked end to end.
--
-- Also added: invitations never expired (no expires_at column existed at
-- all), so a stale pending invite could be accepted indefinitely. Added a
-- 7-day expiry, enforced on accept.

alter table public.staff_invitations
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days');

create or replace function public.create_staff_invitation(p_email text, p_role text, p_branch_ids uuid[])
returns staff_invitations
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_company_id uuid := public.get_my_company_id();
  v_invitation public.staff_invitations;
  v_branch_count integer;
  v_email text := lower(trim(p_email));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_company_owner() then raise exception 'Only the company owner can invite staff'; end if;
  if v_company_id is null then raise exception 'Company not found'; end if;
  if v_email = '' or position('@' in v_email) < 2 then raise exception 'Valid email is required'; end if;
  if p_role not in ('branch_manager','technician','front_desk') then raise exception 'Invalid staff role'; end if;
  if coalesce(array_length(p_branch_ids, 1), 0) = 0 then raise exception 'At least one branch is required'; end if;

  select count(*) into v_branch_count
  from unnest(p_branch_ids) as requested_branch_id
  join public.branches b on b.id = requested_branch_id
  where b.company_id = v_company_id and b.is_active = true;
  if v_branch_count <> array_length(p_branch_ids, 1) then raise exception 'One or more branches are invalid'; end if;

  if exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.company_id = v_company_id and lower(u.email) = v_email
  ) then
    raise exception 'A staff account with this email already exists';
  end if;

  if exists (select 1 from public.staff_invitations where company_id=v_company_id and lower(email)=v_email and status='pending' and expires_at > now()) then
    raise exception 'A pending invitation already exists for this email';
  end if;

  insert into public.staff_invitations(company_id,email,role,branch_ids,invited_by,expires_at)
  values(v_company_id,v_email,p_role,p_branch_ids,auth.uid(),now() + interval '7 days')
  returning * into v_invitation;

  return v_invitation;
end;
$function$;

create or replace function public.accept_staff_invitation()
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  if v_invite.expires_at <= now() then
    update public.staff_invitations set status = 'expired' where id = v_invite.id;
    raise exception 'This invitation has expired. Ask the business owner to send a new one.';
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
$function$;

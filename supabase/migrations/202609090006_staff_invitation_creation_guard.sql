create or replace function public.create_staff_invitation(p_email text, p_role text, p_branch_ids uuid[])
returns public.staff_invitations
language plpgsql
security definer
set search_path = public
as $$
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

  if exists (select 1 from public.profiles where company_id=v_company_id and lower(email)=v_email) then
    raise exception 'A staff account with this email already exists';
  end if;

  if exists (select 1 from public.staff_invitations where company_id=v_company_id and lower(email)=v_email and status='pending') then
    raise exception 'A pending invitation already exists for this email';
  end if;

  insert into public.staff_invitations(company_id,email,role,branch_ids,invited_by)
  values(v_company_id,v_email,p_role,p_branch_ids,auth.uid())
  returning * into v_invitation;

  return v_invitation;
end;
$$;

revoke execute on function public.create_staff_invitation(text,text,uuid[]) from public, anon;
grant execute on function public.create_staff_invitation(text,text,uuid[]) to authenticated;

revoke insert on public.staff_invitations from authenticated;

alter table public.staff_invitations drop constraint if exists staff_invitations_role_check;
alter table public.staff_invitations add constraint staff_invitations_role_check check (role in ('branch_manager','technician','front_desk'));

create unique index if not exists staff_invitations_one_pending_per_company_email
on public.staff_invitations (company_id, lower(email))
where status = 'pending';

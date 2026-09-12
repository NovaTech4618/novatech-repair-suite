-- NOVATECH: final privileged authorization boundary hardening.
-- Keeps invoice item mutation branch-scoped and prevents invitation acceptance
-- from changing an already-associated account's authorization state.

create or replace function public.add_invoice_item(
  p_invoice_id uuid,
  p_description text,
  p_quantity numeric default 1,
  p_unit_price numeric default 0
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_company uuid;
  v_branch uuid;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  select company_id, branch_id into v_company, v_branch
  from public.invoices
  where id=p_invoice_id
  for update;
  if v_company is null or v_company<>public.get_my_company_id() then raise exception 'Invoice not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if trim(coalesce(p_description,''))='' or p_quantity<=0 or p_unit_price<0 then raise exception 'Invalid invoice item'; end if;
  insert into public.invoice_items(invoice_id,company_id,description,quantity,unit_price)
  values(p_invoice_id,v_company,trim(p_description),p_quantity,p_unit_price)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.add_invoice_item(uuid,text,numeric,numeric) from public,anon;
grant execute on function public.add_invoice_item(uuid,text,numeric,numeric) to authenticated;

create or replace function public.accept_staff_invitation()
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.staff_invitations%rowtype;
  v_company_id uuid;
  v_branch_count integer;
  v_existing_company uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select lower(email) into v_email from auth.users where id=v_user_id;
  if v_email is null then raise exception 'Account email not found'; end if;

  select company_id into v_existing_company
  from public.profiles
  where id=v_user_id
  for update;
  if v_existing_company is not null then
    raise exception 'This account is already associated with a NOVATECH business';
  end if;

  select * into v_invite
  from public.staff_invitations
  where lower(email)=v_email and status='pending'
  order by created_at desc
  limit 1
  for update;
  if v_invite.id is null then return null; end if;

  if v_invite.expires_at<=now() then
    update public.staff_invitations set status='expired' where id=v_invite.id;
    raise exception 'This invitation has expired. Ask the business owner to send a new one.';
  end if;
  if v_invite.role not in ('branch_manager','technician','front_desk') then raise exception 'Invalid invitation role'; end if;

  select count(*) into v_branch_count
  from unnest(v_invite.branch_ids) as requested_branch_id
  join public.branches b on b.id=requested_branch_id
  where b.company_id=v_invite.company_id and b.is_active=true;
  if v_branch_count<>coalesce(array_length(v_invite.branch_ids,1),0) then
    raise exception 'Invitation contains invalid branch access';
  end if;

  v_company_id:=v_invite.company_id;
  insert into public.profiles(id,company_id,full_name,role)
  values(v_user_id,v_company_id,v_email,v_invite.role);
  insert into public.user_branches(profile_id,branch_id)
  select v_user_id,requested_branch_id from unnest(v_invite.branch_ids) as requested_branch_id;
  update public.staff_invitations set status='accepted',accepted_at=now() where id=v_invite.id;
  return v_company_id;
end;
$$;
revoke execute on function public.accept_staff_invitation() from public,anon;
grant execute on function public.accept_staff_invitation() to authenticated;

-- global_search is SECURITY INVOKER and all searched tables are RLS-protected;
-- keep its API explicitly authenticated-only.
revoke execute on function public.global_search(text,integer) from public,anon;
grant execute on function public.global_search(text,integer) to authenticated;

drop policy if exists "View own profile" on public.profiles;
create policy "View company staff profiles" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (company_id = public.get_my_company_id() and public.is_manager_or_owner())
);

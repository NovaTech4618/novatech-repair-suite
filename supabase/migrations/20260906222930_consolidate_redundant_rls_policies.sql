-- Remove duplicate permissive policies and keep branch write policies action-specific.
drop policy if exists "Users can delete customers in their company" on public.customers;
drop policy if exists "Users can create customers in their company" on public.customers;
drop policy if exists "Users can view customers in their company" on public.customers;
drop policy if exists "Users can update customers in their company" on public.customers;
drop policy if exists "Users can delete devices in their company" on public.devices;
drop policy if exists "Users can create devices in their company" on public.devices;
drop policy if exists "Users can view devices in their company" on public.devices;
drop policy if exists "Users can update devices in their company" on public.devices;

drop policy if exists inventory_branch_write on public.inventory;
create policy inventory_branch_write on public.inventory for insert to authenticated with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('inventory.manage'));
create policy inventory_branch_update on public.inventory for update to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('inventory.manage')) with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('inventory.manage'));
create policy inventory_branch_delete on public.inventory for delete to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('inventory.manage'));

drop policy if exists repairs_branch_write on public.repairs;
create policy repairs_branch_write on public.repairs for insert to authenticated with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('repairs.manage'));
create policy repairs_branch_update on public.repairs for update to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('repairs.manage')) with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('repairs.manage'));
create policy repairs_branch_delete on public.repairs for delete to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('repairs.manage'));

drop policy if exists sales_branch_write on public.sales;
create policy sales_branch_write on public.sales for insert to authenticated with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('sales.manage'));
create policy sales_branch_update on public.sales for update to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('sales.manage')) with check(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('sales.manage'));
create policy sales_branch_delete on public.sales for delete to authenticated using(company_id=public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('sales.manage'));
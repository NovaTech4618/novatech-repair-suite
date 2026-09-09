-- Phase 2: Repairs + Money audit

-- 1. record_repair_outcome never checked the repair's current status before
-- overwriting it. A repair already 'Collected' (handed back to the customer,
-- payment reconciled) could still be silently flipped to Cancelled/No Fix/
-- Failed Repair, desyncing it from the handover record already on file.
create or replace function public.record_repair_outcome(p_repair_id uuid, p_outcome text, p_reason text default null::text, p_customer_notes text default null::text, p_technician_notes text default null::text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_company uuid; v_branch uuid; v_id uuid; v_status text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 v_company := public.get_my_company_id();
 if v_company is null then raise exception 'Company not found'; end if;
 if p_outcome not in ('repaired','no_fix','failed_repair','cancelled','returned_unrepaired') then raise exception 'Invalid repair outcome'; end if;
 select branch_id,status into v_branch,v_status from public.repairs where id=p_repair_id and company_id=v_company for update;
 if not found then raise exception 'Repair not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_status = 'Collected' then
   raise exception 'This repair has already been collected by the customer and its outcome cannot be changed';
 end if;
 insert into public.repair_outcomes(company_id,branch_id,repair_id,outcome,reason,customer_notes,technician_notes,resolved_at,resolved_by)
 values(v_company,v_branch,p_repair_id,p_outcome,p_reason,p_customer_notes,p_technician_notes,now(),auth.uid())
 on conflict (repair_id) do update set outcome=excluded.outcome,reason=excluded.reason,customer_notes=excluded.customer_notes,technician_notes=excluded.technician_notes,resolved_at=excluded.resolved_at,resolved_by=excluded.resolved_by,updated_at=now()
 returning id into v_id;
 update public.repairs set status=case when p_outcome='repaired' then 'Completed' when p_outcome='no_fix' then 'No Fix' when p_outcome='failed_repair' then 'Failed Repair' when p_outcome='cancelled' then 'Cancelled' else 'Returned Unrepaired' end, completed_at=case when p_outcome in ('repaired','no_fix','failed_repair','cancelled','returned_unrepaired') then coalesce(completed_at,now()) else completed_at end where id=p_repair_id and company_id=v_company;
 return v_id;
end; $function$;

-- 2. repair_balance_view counted Cancelled and Returned Unrepaired repairs
-- toward "customer outstanding balance" the same as a normal in-progress
-- repair - inflating the dashboard's debt figure once anyone cancels a
-- priced repair. No live rows were affected yet, but it's a live landmine.
-- NOTE: 'No Fix' / 'Failed Repair' were deliberately left counting toward
-- outstanding balance, since some shops charge a diagnostic/attempt fee for
-- those outcomes and this is a business-policy decision, not a bug to guess.
create or replace view public.repair_balance_view as
SELECT r.id AS repair_id,
    r.company_id,
    r.branch_id,
    r.device_id,
    r.status,
    COALESCE(r.final_cost, r.estimated_cost, 0::numeric) AS total_amount,
    COALESCE(sum(rp.amount), 0::numeric) AS paid_amount,
    CASE
      WHEN r.status IN ('Cancelled','Returned Unrepaired') THEN 0::numeric
      ELSE GREATEST(COALESCE(r.final_cost, r.estimated_cost, 0::numeric) - COALESCE(sum(rp.amount), 0::numeric), 0::numeric)
    END AS outstanding,
    CASE
        WHEN r.status IN ('Cancelled','Returned Unrepaired') THEN 'Not chargeable'::text
        WHEN COALESCE(r.final_cost, r.estimated_cost, 0::numeric) <= COALESCE(sum(rp.amount), 0::numeric) THEN 'Paid'::text
        WHEN COALESCE(sum(rp.amount), 0::numeric) > 0::numeric THEN 'Partially paid'::text
        ELSE 'Unpaid'::text
    END AS payment_status
   FROM repairs r
     LEFT JOIN repair_payments rp ON rp.repair_id = r.id
  WHERE COALESCE(r.final_cost, r.estimated_cost, 0::numeric) > 0::numeric
  GROUP BY r.id;

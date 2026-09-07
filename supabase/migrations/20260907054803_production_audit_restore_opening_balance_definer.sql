CREATE OR REPLACE FUNCTION public.engineer_opening_balance(p_engineer_id uuid,p_amount numeric,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare v_company_id uuid; v_transaction_id uuid; v_user_id uuid;
begin
 v_user_id:=auth.uid(); if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 if p_amount=0 then raise exception 'Opening balance cannot be zero'; end if;
 if not exists(select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id) then raise exception 'Engineer not found'; end if;
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by)
 values(v_company_id,p_engineer_id,'opening_balance','Opening balance',case when p_amount>0 then p_amount else 0 end,case when p_amount<0 then abs(p_amount) else 0 end,p_notes,v_user_id)
 returning id into v_transaction_id;
 return v_transaction_id;
end; $$;

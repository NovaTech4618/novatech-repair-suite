-- Phase 5: keep paid sales debt-ledger entries one-sided and reconcile legacy paid sales.
create or replace function public.sync_sale_customer_debt()
returns trigger
language plpgsql security definer set search_path=public as $$
declare cid uuid; amount numeric; paid boolean;
begin
  cid:=new.customer_id;
  amount:=coalesce(new.total,0);
  paid:=lower(coalesce(new.payment_method,'')) in ('cash','card','transfer','pos','bank transfer');
  if cid is not null and amount>0 then
    if paid then
      insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
      values(new.company_id,new.branch_id,cid,'sale',new.id,amount,0,'Sales charge',auth.uid());
      insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
      values(new.company_id,new.branch_id,cid,'payment',new.id,0,amount,'Sale payment received',auth.uid());
    else
      insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
      values(new.company_id,new.branch_id,cid,'sale',new.id,amount,0,'Sales charge / payment due',auth.uid());
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.sync_sale_customer_debt() from public,anon;
grant execute on function public.sync_sale_customer_debt() to authenticated;

insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
select s.company_id,s.branch_id,s.customer_id,'sale',s.id,s.total,0,'Backfilled during Phase 5 reconciliation',null
from public.sales s
where s.customer_id is not null
  and lower(coalesce(s.payment_method,'')) in ('cash','card','transfer','pos','bank transfer')
  and s.total>0
  and not exists(select 1 from public.customer_debt_ledger d where d.source_type='sale' and d.source_id=s.id and d.debit>0);

insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
select s.company_id,s.branch_id,s.customer_id,'payment',s.id,0,s.total,'Backfilled during Phase 5 reconciliation',null
from public.sales s
where s.customer_id is not null
  and lower(coalesce(s.payment_method,'')) in ('cash','card','transfer','pos','bank transfer')
  and s.total>0
  and not exists(select 1 from public.customer_debt_ledger d where d.source_type='payment' and d.source_id=s.id and d.credit>0);

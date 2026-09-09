alter table public.repairs drop constraint if exists repairs_deposit_nonnegative;
alter table public.repairs drop constraint if exists repairs_deposit_not_greater_than_final;
alter table public.repairs drop constraint if exists repairs_deposit_financial_check;

alter table public.repairs
  add constraint repairs_deposit_financial_check check (
    deposit >= 0
    and (
      coalesce(final_cost, estimated_cost) is null
      or deposit <= coalesce(final_cost, estimated_cost)
    )
  );

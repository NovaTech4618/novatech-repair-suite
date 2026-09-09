-- Phase 3: Inventory & Stock audit
-- Found: addInventoryItem() creates items with a raw insert setting the
-- starting `quantity` directly, with no corresponding stock movement.
-- This left the inventory_stock_movements ledger unable to fully explain
-- 4 existing items' stated quantity (stock accuracy audit failure).
--
-- Fix: auto-record an 'opening' movement on every future insert, and
-- backfill the 4 existing gaps so the ledger reconciles today.

create or replace function public.record_inventory_opening_balance()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(new.quantity, 0) <> 0 then
    perform set_config('novatech.stock_movement', '1', true);
    insert into public.inventory_stock_movements(
      company_id, inventory_id, movement_type, quantity, unit_cost,
      reference_type, notes, created_by
    ) values (
      new.company_id, new.id, 'opening', new.quantity, coalesce(new.cost_price, 0),
      'initial_stock',
      'Opening balance recorded on item creation', auth.uid()
    );
    perform set_config('novatech.stock_movement', '0', true);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_inventory_opening_balance on public.inventory;
create trigger trg_inventory_opening_balance
  after insert on public.inventory
  for each row execute function public.record_inventory_opening_balance();

insert into public.inventory_stock_movements (company_id, inventory_id, movement_type, quantity, unit_cost, reference_type, notes)
select i.company_id, i.id, 'opening', (i.quantity - coalesce(m.movement_sum, 0)), coalesce(i.cost_price,0),
       'initial_stock_backfill', 'Backfilled to reconcile stated quantity with movement ledger (Phase 3 audit)'
from public.inventory i
join (
  select inventory_id, sum(quantity) as movement_sum
  from public.inventory_stock_movements
  group by inventory_id
) m on m.inventory_id = i.id
where i.quantity <> coalesce(m.movement_sum, 0);

import { supabase } from "@/lib/supabase";
import type { InventoryPurchase, InventoryPurchaseItem, ReceiveInventoryPurchaseInput } from "@/types/inventoryPurchase";

export const inventoryPurchaseService = {
  async receive(input: ReceiveInventoryPurchaseInput) {
    return await supabase.rpc("receive_inventory_purchase", {
      p_supplier: input.supplier.trim() || null,
      p_invoice_reference: input.invoice_reference.trim() || null,
      p_purchase_date: input.purchase_date,
      p_payment_method: input.payment_method,
      p_inventory_id: input.inventory_id,
      p_quantity: input.quantity,
      p_unit_cost: input.unit_cost,
      p_notes: input.notes.trim() || null,
    });
  },

  async getPurchases() {
    return await supabase.rpc("get_inventory_purchases").returns<InventoryPurchase[]>();
  },

  async getItems(purchaseId: string) {
    return await supabase.rpc("get_inventory_purchase_items", { p_purchase_id: purchaseId }).returns<InventoryPurchaseItem[]>();
  },
};

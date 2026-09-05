import { supabase } from "@/lib/supabase";
import type { InventoryMovementType, InventoryStockMovement } from "@/types/inventoryMovement";

export const inventoryMovementService = {
  async recordMovement(input: {
    inventoryId: string;
    movementType: InventoryMovementType;
    quantity: number;
    unitCost?: number;
    referenceType?: string | null;
    referenceId?: string | null;
    notes?: string | null;
  }) {
    return await supabase.rpc("record_inventory_movement", {
      p_inventory_id: input.inventoryId,
      p_movement_type: input.movementType,
      p_quantity: input.quantity,
      p_unit_cost: input.unitCost ?? 0,
      p_reference_type: input.referenceType ?? null,
      p_reference_id: input.referenceId ?? null,
      p_notes: input.notes ?? null,
    });
  },

  async getMovements(inventoryId?: string) {
    let query = supabase
      .from("inventory_stock_movements")
      .select("*")
      .order("created_at", { ascending: false });

    if (inventoryId) query = query.eq("inventory_id", inventoryId);
    return await query;
  },

  async getRecentMovements(limit = 20) {
    const { data, error } = await supabase
      .from("inventory_stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data: (data ?? []) as InventoryStockMovement[], error };
  },
};
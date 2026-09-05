import { supabase } from "@/lib/supabase";
import type { RepairPartUsage } from "@/types/repairParts";

export const repairPartsService = {
  async getUsage(repairId: string) {
    return await supabase
      .from("repair_parts_usage")
      .select("*, inventory(item_name, brand, compatible_models, cost_price, quantity, shelf_location)")
      .eq("repair_id", repairId)
      .order("created_at", { ascending: false }) as {
        data: RepairPartUsage[] | null;
        error: any;
      };
  },

  async recordUsage(repairId: string, inventoryId: string, quantity: number, notes?: string) {
    return await supabase.rpc("record_repair_part_usage", {
      p_repair_id: repairId,
      p_inventory_id: inventoryId,
      p_quantity: quantity,
      p_notes: notes || null,
    });
  },

  async returnUsage(usageId: string, quantity: number, notes?: string) {
    return await supabase.rpc("return_repair_part_usage", {
      p_usage_id: usageId,
      p_quantity: quantity,
      p_notes: notes || null,
    });
  },
};

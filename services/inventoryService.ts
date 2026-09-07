import { supabase } from "@/lib/supabase";
import type { InventoryItemInput } from "@/types/inventory";

export const inventoryService = {
  async getInventory() {
    return await supabase
      .from("inventory")
      .select("*")
      .order("item_name", { ascending: true });
  },

  async getInventoryById(id: string) {
    return await supabase.from("inventory").select("*").eq("id", id).single();
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from("inventory")
      .select("id, item_name, quantity, minimum_stock")
      .order("quantity", { ascending: true });

    if (error) return { data: null, error };

    return {
      data: (data || []).filter((item) => item.quantity <= item.minimum_stock).slice(0, 5),
      error: null,
    };
  },

  async addInventoryItem(item: InventoryItemInput) {
    return await supabase.from("inventory").insert([item]);
  },

  async updateInventoryItem(id: string, item: InventoryItemInput) {
    return await supabase
      .from("inventory")
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  async deleteInventoryItem(id: string) {
    return await supabase.from("inventory").delete().eq("id", id);
  },

  async createInventoryTransfer(
    inventoryId: string,
    toBranchId: string,
    quantity: number,
    notes?: string | null,
  ) {
    return await supabase.rpc("create_inventory_transfer", {
      p_inventory_id: inventoryId,
      p_to_branch_id: toBranchId,
      p_quantity: quantity,
      p_notes: notes?.trim() || null,
    });
  },

  async getTransferHistory(limit = 50) {
    return await supabase
      .from("inventory_transfers")
      .select("id, inventory_id, from_branch_id, to_branch_id, quantity, status, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};

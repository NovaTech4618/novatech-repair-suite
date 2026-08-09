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

  // Items at or below their minimum_stock threshold — powers the
  // Dashboard "Low Stock Alert" widget and the Inventory page banner.
  async getLowStock() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("quantity", { ascending: true });

    if (error) return { data: null, error };

    const lowStock = (data || []).filter(
      (item) => item.quantity <= item.minimum_stock
    );

    return { data: lowStock, error: null };
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
};
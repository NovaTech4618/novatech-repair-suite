import { supabase } from "@/lib/supabase";

export const reportsService = {
  // Sales with their line items and each item's cost price, so we can
  // compute real profit (revenue - cost), not just revenue.
  async getSalesWithItems() {
    return await supabase
      .from("sales")
      .select(
        "id, sale_date, total, discount, sale_items(quantity, unit_price, total_price, inventory(item_name, cost_price))"
      )
      .order("sale_date", { ascending: false });
  },

  async getRepairsForReports() {
    return await supabase
      .from("repairs")
      .select("id, status, final_cost, created_at, completed_at")
      .order("created_at", { ascending: false });
  },

  async getLowStockItems() {
    return await supabase
      .from("inventory")
      .select("id, item_name, quantity, minimum_stock")
      .order("quantity", { ascending: true });
  },
};
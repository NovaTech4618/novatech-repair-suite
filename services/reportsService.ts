import { supabase } from "@/lib/supabase";

export type BusinessReport = {
  sales_revenue: number;
  repair_revenue: number;
  cash_received: number;
  inventory_cogs: number;
  gross_profit: number;
  repairs_received: number;
  repairs_completed: number;
  customer_outstanding: number;
  low_stock_items: number;
};

export const reportsService = {
  async getBusinessReport(from?: string, to?: string) {
    const { data, error } = await supabase.rpc("get_business_report", {
      p_from: from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      p_to: to ?? new Date().toISOString(),
    });
    return { data: (data?.[0] ?? null) as BusinessReport | null, error };
  },

  async getSalesWithItems() {
    return await supabase
      .from("sales")
      .select("id, sale_date, total, discount, sale_items(quantity, unit_price, total_price, inventory(item_name, cost_price))")
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
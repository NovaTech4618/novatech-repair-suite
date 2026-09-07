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

export type RepairReportRow = {
  id: string;
  status: string | null;
  final_cost: number | null;
  created_at: string;
  received_at: string | null;
  completed_at: string | null;
  expected_completion_date: string | null;
  technician: string | null;
};

export const reportsService = {
  async getBusinessReport(from?: string, to?: string) {
    const { data, error } = await supabase.rpc("get_business_report", {
      p_from: from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      p_to: to ?? new Date().toISOString(),
    });
    return { data: (data?.[0] ?? null) as BusinessReport | null, error };
  },

  async getSalesWithItems(from?: string, to?: string) {
    let query = supabase
      .from("sales")
      .select("id, sale_date, total, discount, sale_items(quantity, unit_price, total_price, inventory(item_name, cost_price))")
      .order("sale_date", { ascending: false });
    if (from) query = query.gte("sale_date", from);
    if (to) query = query.lte("sale_date", to);
    return await query;
  },

  async getRepairsForReports(from?: string, to?: string) {
    let query = supabase
      .from("repairs")
      .select("id, status, final_cost, created_at, received_at, completed_at, expected_completion_date, technician")
      .order("created_at", { ascending: false });
    if (from) query = query.gte("received_at", from);
    if (to) query = query.lte("received_at", to);
    const result = await query;
    return {
      data: (result.data ?? []) as RepairReportRow[],
      error: result.error,
    };
  },

  async getLowStockItems() {
    return await supabase
      .from("inventory")
      .select("id, item_name, quantity, minimum_stock")
      .order("quantity", { ascending: true });
  },
};

import { supabase } from "@/lib/supabase";

export type DashboardSummary = {
  repairs_today: number;
  active_repairs: number;
  completed_today: number;
  cash_today: number;
  outstanding_customer: number;
  low_stock_count: number;
  engineer_debit: number;
};

export const dashboardService = {
  async getSummary() {
    const { data, error } = await supabase.rpc("get_dashboard_summary");
    const row = (data?.[0] ?? null) as DashboardSummary | null;
    return {
      data: row
        ? {
            repairs_today: Number(row.repairs_today || 0),
            active_repairs: Number(row.active_repairs || 0),
            completed_today: Number(row.completed_today || 0),
            cash_today: Number(row.cash_today || 0),
            outstanding_customer: Number(row.outstanding_customer || 0),
            low_stock_count: Number(row.low_stock_count || 0),
            engineer_debit: Number(row.engineer_debit || 0),
          }
        : null,
      error,
    };
  },

  async getTodayTicketsCount() {
    const { data, error } = await this.getSummary();
    return { count: data?.repairs_today ?? 0, error };
  },

  async getTodayRevenue() {
    const { data, error } = await this.getSummary();
    return { total: data?.cash_today ?? 0, error };
  },

  async getWaitingCount() {
    const { data, error } = await this.getSummary();
    return { count: data?.active_repairs ?? 0, error };
  },

  async getCompletedTodayCount() {
    const { data, error } = await this.getSummary();
    return { count: data?.completed_today ?? 0, error };
  },

  async getRecentRepairs(limit = 5) {
    return await supabase
      .from("repairs")
      .select("id, issue, status, created_at, devices(brand, model, customers(full_name))")
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};
import { supabase } from "@/lib/supabase";

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const dashboardService = {
  async getTodayTicketsCount() {
    const { count, error } = await supabase
      .from("repairs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfTodayISO());

    return { count: count ?? 0, error };
  },

  async getTodayRevenue() {
    const { data, error } = await supabase
      .from("sales")
      .select("total")
      .gte("sale_date", startOfTodayISO());

    if (error) return { total: 0, error };

    const total = (data || []).reduce((sum, s) => sum + (s.total || 0), 0);
    return { total, error: null };
  },

  async getWaitingCount() {
    const { count, error } = await supabase
      .from("repairs")
      .select("*", { count: "exact", head: true })
      .not("status", "in", "(Completed,Collected)");

    return { count: count ?? 0, error };
  },

  async getCompletedTodayCount() {
    const { count, error } = await supabase
      .from("repairs")
      .select("*", { count: "exact", head: true })
      .gte("completed_at", startOfTodayISO());

    return { count: count ?? 0, error };
  },

  async getRecentRepairs(limit = 5) {
    return await supabase
      .from("repairs")
      .select("id, issue, status, created_at, devices(brand, model, customers(full_name))")
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};
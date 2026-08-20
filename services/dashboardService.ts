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

  // Now combines Sales revenue AND completed-repair revenue for today,
  // so this is genuinely "total money made today," not just Sales.
  async getTodayRevenue() {
    const start = startOfTodayISO();

    const [salesRes, repairsRes] = await Promise.all([
      supabase.from("sales").select("total").gte("sale_date", start),
      supabase
        .from("repairs")
        .select("final_cost")
        .gte("completed_at", start)
        .not("final_cost", "is", null),
    ]);

    if (salesRes.error) return { total: 0, error: salesRes.error };

    const salesTotal = (salesRes.data || []).reduce(
      (sum, s) => sum + (s.total || 0),
      0
    );
    const repairsTotal = (repairsRes.data || []).reduce(
      (sum, r) => sum + (r.final_cost || 0),
      0
    );

    return { total: salesTotal + repairsTotal, error: null };
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
      .select(
        "id, issue, status, created_at, devices(brand, model, customers(full_name))"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};
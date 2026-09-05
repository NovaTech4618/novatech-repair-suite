import { supabase } from "@/lib/supabase";
import type { QuickLog, QuickLogInput } from "@/types/quickLog";

export const quickLogService = {
  async create(input: QuickLogInput) {
    const { data, error } = await supabase.rpc("create_quick_log", {
      p_job_name: input.job_name,
      p_amount_charged: input.amount_charged,
      p_parts_cost: input.parts_cost,
      p_amount_paid: input.amount_paid,
      p_payment_method: input.payment_method,
      p_notes: input.notes?.trim() || null,
    });
    return { data: data as string | null, error };
  },

  async getRecent(limit = 5) {
    const result = await supabase
      .from("quick_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data: (result.data ?? []) as QuickLog[], error: result.error };
  },
};

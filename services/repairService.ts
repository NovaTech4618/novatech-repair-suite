import { supabase } from "@/lib/supabase";

export const repairService = {
  async getRepairs(deviceId: string) {
    return await supabase
      .from("repairs")
      .select("*, repair_tickets(id, ticket_number, issued_at)")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
  },

  async getAllRepairs() {
    return await supabase
      .from("repairs")
      .select("*, devices(brand, model, customers(full_name)), repair_tickets(id, ticket_number)")
      .order("created_at", { ascending: false });
  },

  async addRepair(repair: {
    device_id: string;
    technician: string | null;
    issue: string;
    diagnosis: string | null;
    repair_notes: string | null;
    solution: string | null;
    priority: string;
    deposit: number;
    deposit_payment_method?: string;
    expected_completion_date: string | null;
    estimated_cost: number | null;
    final_cost: number | null;
    status: string;
  }) {
    return await supabase.from("repairs").insert([repair]);
  },

  async updateRepair(
    id: string,
    repair: {
      technician: string | null;
      issue: string;
      diagnosis: string | null;
      repair_notes: string | null;
      solution: string | null;
      priority: string;
      deposit: number;
      expected_completion_date: string | null;
      estimated_cost: number | null;
      final_cost: number | null;
      status: string;
    }
  ) {
    return await supabase.from("repairs").update(repair).eq("id", id);
  },

  async deleteRepair(id: string) {
    return await supabase.from("repairs").delete().eq("id", id);
  },

  async completeRepair(id: string) {
    const { data, error } = await supabase.rpc("complete_repair", { p_repair_id: id });
    if (error) return { data: null, error };
    return { data: Array.isArray(data) ? data[0] : data, error: null };
  },
};

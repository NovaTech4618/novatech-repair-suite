import { supabase } from "@/lib/supabase";

export const repairService = {
  async getRepairs(deviceId: string) {
    return await supabase
      .from("repairs")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
  },

  async addRepair(repair: {
    device_id: string;
    technician: string;
    issue: string;
    diagnosis: string;
    repair_notes: string;
    estimated_cost: number | null;
    final_cost: number | null;
    status: string;
  }) {
    return await supabase
      .from("repairs")
      .insert([repair]);
  },

  async updateRepair(
    id: string,
    repair: {
      technician: string;
      issue: string;
      diagnosis: string;
      repair_notes: string;
      estimated_cost: number | null;
      final_cost: number | null;
      status: string;
    }
  ) {
    return await supabase
      .from("repairs")
      .update(repair)
      .eq("id", id);
  },

  async deleteRepair(id: string) {
    return await supabase
      .from("repairs")
      .delete()
      .eq("id", id);
  },
};
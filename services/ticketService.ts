import { supabase } from "@/lib/supabase";

export const ticketService = {
  async getTicketById(id: string) {
    return await supabase
      .from("repair_tickets")
      .select(`
        id,
        ticket_number,
        issued_at,
        repairs (
          id,
          issue,
          diagnosis,
          solution,
          technician,
          status,
          estimated_cost,
          final_cost,
          deposit,
          completed_at,
          companies (name),
          devices (
            id,
            brand,
            model,
            device_type,
            serial_number,
            customers (id, full_name, phone)
          )
        )
      `)
      .eq("id", id)
      .single();
  },

  async markCollected(repairId: string) {
    return await supabase
      .from("repairs")
      .update({ status: "Collected" })
      .eq("id", repairId);
  },
};

import { supabase } from "@/lib/supabase";

export const ticketService = {
  async getTicketById(id: string) {
    return await supabase
      .from("repair_tickets")
      .select(
        `
        id,
        ticket_number,
        issued_at,
        repairs (
          issue,
          diagnosis,
          solution,
          technician,
          status,
          estimated_cost,
          final_cost,
          deposit,
          completed_at,
          devices (
            brand,
            model,
            device_type,
            serial_number,
            customers (
              full_name,
              phone
            )
          )
        )
      `
      )
      .eq("id", id)
      .single();
  },
};
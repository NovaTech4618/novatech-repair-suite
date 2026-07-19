import { supabase } from "@/lib/supabase";

export const deviceService = {
  async getDevices(customerId: string) {
    return await supabase
      .from("devices")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
  },

  async addDevice(device: {
    customer_id: string;
    device_type: string;
    brand: string;
    model: string;
    serial_number: string;
    color: string;
    condition: string;
    accessories: string;
    problem: string;
  }) {
    return await supabase
      .from("devices")
      .insert([device]);
  },

  async deleteDevice(id: string) {
    return await supabase
      .from("devices")
      .delete()
      .eq("id", id);
  },
};
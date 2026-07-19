import { supabase } from "@/lib/supabase";

export const customerService = {
  async getCustomers() {
    return await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
  },

  async getCustomerById(id: string) {
    return await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();
  },

  async addCustomer(customer: {
    full_name: string;
    phone: string;
    email: string;
    address: string;
  }) {
    return await supabase
      .from("customers")
      .insert([customer]);
  },

  async updateCustomer(
    id: string,
    customer: {
      full_name: string;
      phone: string;
      email: string;
      address: string;
    }
  ) {
    return await supabase
      .from("customers")
      .update(customer)
      .eq("id", id);
  },

  async deleteCustomer(id: string) {
    return await supabase
      .from("customers")
      .delete()
      .eq("id", id);
  },
};
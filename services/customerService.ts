import { supabase } from "@/lib/supabase";

export const customerService = {
  async getCustomers() {
    return await supabase.from("customers").select("*").order("created_at", { ascending: false });
  },
  async getCustomerById(id: string) {
    return await supabase.from("customers").select("*").eq("id", id).single();
  },
  async getCustomerByPhone(phone: string) {
    return await supabase.from("customers").select("id").eq("phone", phone.trim()).maybeSingle();
  },
  async addCustomer(customer: { full_name: string; phone: string; email: string | null; address: string | null }) {
    const existing = await this.getCustomerByPhone(customer.phone);
    if (existing.error) return { data: null, error: existing.error };
    if (existing.data?.id) return { data: existing.data, error: null };

    return await supabase.from("customers").insert([customer]).select("id").single();
  },
  async updateCustomer(id: string, customer: { full_name: string; phone: string; email: string | null; address: string | null }) {
    return await supabase.from("customers").update(customer).eq("id", id);
  },
  async deleteCustomer(id: string) {
    return await supabase.from("customers").delete().eq("id", id);
  },
};

import { supabase } from "@/lib/supabase";
import type { CustomerRequestInput, CustomerRequestStatus } from "@/types/customerRequest";

export const customerRequestService = {
  async getAll() {
    return await supabase
      .from("customer_requests")
      .select("*, customers(full_name, phone)")
      .order("created_at", { ascending: false });
  },

  async create(input: CustomerRequestInput) {
    const { data: userResult } = await supabase.auth.getUser();
    const userId = userResult.user?.id;
    if (!userId) return { data: null, error: new Error("You must be signed in.") };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();
    if (profileError || !profile?.company_id) {
      return { data: null, error: profileError ?? new Error("Your account is not linked to a company.") };
    }

    return await supabase.from("customer_requests").insert({
      company_id: profile.company_id,
      branch_id: null,
      customer_id: input.customer_id ?? null,
      requested_item: input.requested_item.trim(),
      details: input.details?.trim() || null,
      priority: input.priority ?? "normal",
      quoted_price: input.quoted_price ?? null,
      contact_customer: input.contact_customer ?? true,
      notes: input.notes?.trim() || null,
      created_by: userId,
    }).select().single();
  },

  async updateStatus(id: string, status: CustomerRequestStatus) {
    return await supabase.from("customer_requests").update({ status }).eq("id", id).select().single();
  },
};

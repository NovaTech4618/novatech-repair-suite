import { supabase, getCurrentSession } from "@/lib/supabase";

export const settingsService = {
  async getProfileAndCompany() {
    const session = await getCurrentSession();

    if (!session?.user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("profiles")
      .select("id, full_name, role, company_id, companies(id, name)")
      .eq("id", session.user.id)
      .single();
  },

  async updateFullName(userId: string, fullName: string) {
    return await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
  },

  async updateCompanyName(companyId: string, name: string) {
    return await supabase
      .from("companies")
      .update({ name })
      .eq("id", companyId);
  },
};
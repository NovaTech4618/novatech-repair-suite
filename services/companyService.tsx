import { supabase } from "@/lib/supabase";

export const companyService = {
  async getCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: new Error("Not authenticated") };

    return await supabase
      .from("profiles")
      .select(
        `
          company_id,
          companies (
            id,
            name
          )
        `
      )
      .eq("id", user.id)
      .single();
  },

  async updateCompany(id: string, company: { name: string }) {
    return await supabase
      .from("companies")
      .update(company)
      .eq("id", id);
  },
};
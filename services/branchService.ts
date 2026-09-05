import { supabase } from "@/lib/supabase";
import type { BranchInput } from "@/types/staff";

export const branchService = {
  async getBranches() {
    return await supabase
      .from("branches")
      .select("*")
      .order("is_main", { ascending: false })
      .order("name", { ascending: true });
  },

  async addBranch(branch: BranchInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return { data: null, error: profileError ?? new Error("Company not found") };
    }

    return await supabase
      .from("branches")
      .insert([{ company_id: profile.company_id, ...branch }])
      .select()
      .single();
  },

  async updateBranch(id: string, branch: Partial<BranchInput> & { is_active?: boolean }) {
    return await supabase.from("branches").update(branch).eq("id", id);
  },

  // A branch's staff assignments — who can currently access it
  async getBranchAssignments(branchId: string) {
    return await supabase
      .from("user_branches")
      .select("profile_id, profiles(id, full_name, role)")
      .eq("branch_id", branchId);
  },

  async assignStaffToBranch(profileId: string, branchId: string) {
    return await supabase
      .from("user_branches")
      .insert([{ profile_id: profileId, branch_id: branchId }]);
  },

  async removeStaffFromBranch(profileId: string, branchId: string) {
    return await supabase
      .from("user_branches")
      .delete()
      .eq("profile_id", profileId)
      .eq("branch_id", branchId);
  },
};
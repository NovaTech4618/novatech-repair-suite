import { supabase } from "@/lib/supabase";
import type { StaffInvitationInput, StaffMember, StaffRole } from "@/types/staff";

export const staffService = {
  // Current user's own role — drives UI gating (e.g. hiding Staff & Branches
  // from anyone who isn't an owner or branch manager).
  async getMyRole(): Promise<{ data: StaffRole | null; error: Error | null }> {
    const { data, error } = await supabase.rpc("get_my_role");
    if (error) return { data: null, error };
    return { data: data as StaffRole, error: null };
  },

  async getStaff() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
          id, full_name, role, is_active, created_at,
          user_branches ( branches ( id, name ) )
        `
      )
      .order("created_at", { ascending: true });

    if (error) return { data: null, error };

    const staff: StaffMember[] = (data || []).map((row) => {
      const rawBranches = (row as { user_branches?: unknown }).user_branches;
      const branchList = Array.isArray(rawBranches) ? rawBranches : [];

      return {
        id: row.id,
        full_name: row.full_name,
        role: row.role as StaffRole,
        is_active: row.is_active,
        created_at: row.created_at,
        branches: branchList
          .map((ub) => {
            const b = (ub as { branches?: unknown }).branches;
            return Array.isArray(b) ? b[0] : b;
          })
          .filter(Boolean) as StaffMember["branches"],
      };
    });

    return { data: staff, error: null };
  },

  // Role/company/active changes are locked at the database level (a
  // trigger blocks anyone but the owner) — this will fail loudly for
  // non-owners rather than silently succeeding.
  async updateStaffRole(profileId: string, role: StaffRole) {
    return await supabase.from("profiles").update({ role }).eq("id", profileId);
  },

  async setStaffActive(profileId: string, isActive: boolean) {
    return await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", profileId);
  },

  async getInvitations() {
    return await supabase
      .from("staff_invitations")
      .select("*")
      .order("created_at", { ascending: false });
  },

  async inviteStaff(invitation: StaffInvitationInput) {
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
      .from("staff_invitations")
      .insert([
        {
          company_id: profile.company_id,
          email: invitation.email.trim().toLowerCase(),
          role: invitation.role,
          branch_ids: invitation.branch_ids,
          invited_by: user.id,
        },
      ])
      .select()
      .single();
  },

  async revokeInvitation(id: string) {
    return await supabase
      .from("staff_invitations")
      .update({ status: "revoked" })
      .eq("id", id);
  },
};
import { supabase } from "@/lib/supabase";

export const profileService = {
  async getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: new Error("Not authenticated") };

    return await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
  },

  async updateProfile(profile: {
    full_name: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: new Error("Not authenticated") };

    return await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);
  },
};
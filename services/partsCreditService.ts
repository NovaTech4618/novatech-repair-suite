import { supabase } from "@/lib/supabase";
import type { PartsCreditInput } from "@/types/partsCredit";

export const partsCreditService = {
  async getCredits() {
    return await supabase
      .from("parts_credits")
      .select(`
        *,
        customers(full_name),
        inventory(item_name)
      `)
      .order("credit_date", { ascending: false });
  },

  async getCreditById(id: string) {
    return await supabase
      .from("parts_credits")
      .select(`
        *,
        customers(full_name),
        inventory(item_name),
        credit_payments(*)
      `)
      .eq("id", id)
      .single();
  },

  async addCredit(credit: PartsCreditInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: new Error("Not authenticated"),
      };
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.company_id) {
      return {
        data: null,
        error:
          profileError ?? new Error("Company not found"),
      };
    }

    return await supabase
      .from("parts_credits")
      .insert([
        {
          company_id: profile.company_id,
          ...credit,
        },
      ]);
  },

  async addPayment(params: {
    creditId: string;
    amount: number;
    paymentMethod: string | null;
    notes: string | null;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: new Error("Not authenticated"),
      };
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.company_id) {
      return {
        data: null,
        error:
          profileError ?? new Error("Company not found"),
      };
    }

    return await supabase
      .from("credit_payments")
      .insert([
        {
          company_id: profile.company_id,
          credit_id: params.creditId,
          amount: params.amount,
          payment_method: params.paymentMethod,
          notes: params.notes,
        },
      ]);
  },

  async getPayments(creditId: string) {
    return await supabase
      .from("credit_payments")
      .select("*")
      .eq("credit_id", creditId)
      .order("payment_date", {
        ascending: false,
      });
  },

  async deleteCredit(id: string) {
    return await supabase
      .from("parts_credits")
      .delete()
      .eq("id", id);
  },
};
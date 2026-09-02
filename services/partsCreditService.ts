import { supabase } from "@/lib/supabase";
import type {
  PartsCreditInput,
} from "@/types/partsCredit";

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

  async addCredit(
    companyId: string,
    credit: PartsCreditInput
  ) {
    return await supabase
      .from("parts_credits")
      .insert([
        {
          company_id: companyId,
          ...credit,
        },
      ]);
  },

  async addPayment(params: {
    companyId: string;
    creditId: string;
    amount: number;
    paymentMethod: string | null;
    notes: string | null;
  }) {
    return await supabase
      .from("credit_payments")
      .insert([
        {
          company_id: params.companyId,
          credit_id: params.creditId,
          amount: params.amount,
          payment_method: params.paymentMethod,
          notes: params.notes,
        },
      ]);
  },

  async deleteCredit(id: string) {
    return await supabase
      .from("parts_credits")
      .delete()
      .eq("id", id);
  },
};
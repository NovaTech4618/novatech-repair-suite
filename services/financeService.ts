import { supabase } from "@/lib/supabase";
import type { DailyProfit, FinancialSummary, FinancialTransactionInput, ProfitSummary } from "@/types/finance";

export const financeService = {
  async getTransactions() {
    return await supabase.from("financial_transactions").select("*").order("occurred_at", { ascending: false });
  },

  async getSummary(start: string, end: string) {
    return await supabase.rpc("get_financial_summary", { p_start: start, p_end: end }).returns<FinancialSummary[]>();
  },

  async getProfitSummary(start: string, end: string) {
    return await supabase.rpc("get_profit_summary", { p_start: start, p_end: end }).returns<ProfitSummary[]>();
  },

  async getDailyProfitTrend(start: string, end: string) {
    return await supabase.rpc("get_daily_profit_trend", { p_start: start, p_end: end }).returns<DailyProfit[]>();
  },

  async createTransaction(input: FinancialTransactionInput) {
    const userResult = await supabase.auth.getUser();
    const userId = userResult.data.user?.id;
    if (!userId) return { data: null, error: new Error("You must be signed in.") };

    const { data: profile, error: profileError } = await supabase.from("profiles").select("company_id").eq("id", userId).single();
    if (profileError || !profile?.company_id) {
      return { data: null, error: profileError ?? new Error("Your account is not linked to a company.") };
    }

    return await supabase.from("financial_transactions").insert({
      company_id: profile.company_id,
      direction: input.direction,
      category: input.category,
      amount: input.amount,
      payment_method: input.payment_method,
      description: input.description.trim(),
      occurred_at: input.occurred_at || new Date().toISOString(),
      recorded_by: userId,
    }).select().single();
  },
};

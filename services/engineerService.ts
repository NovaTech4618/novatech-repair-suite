import { supabase } from "@/lib/supabase";
import type {
  EngineerAccountSummary,
  EngineerBalance,
  EngineerTransaction,
} from "@/types/engineer";

export const engineerService = {
  async getEngineers() {
    return await supabase.from("engineers").select("*").order("name", { ascending: true });
  },

  async getEngineer(id: string) {
    return await supabase.from("engineers").select("*").eq("id", id).single();
  },

  async getBalances() {
    return await supabase.rpc("get_engineer_balances").returns<EngineerBalance[]>();
  },

  async getBalance(engineerId: string) {
    return await supabase.rpc("get_engineer_balance", { p_engineer_id: engineerId });
  },

  async getAccountSummary(engineerId: string) {
    return await supabase
      .rpc("get_engineer_account_summary", { p_engineer_id: engineerId })
      .returns<EngineerAccountSummary[]>();
  },

  async getTransactions(engineerId: string) {
    return await supabase
      .from("engineer_transactions")
      .select("*")
      .eq("engineer_id", engineerId)
      .order("transaction_date", { ascending: false });
  },

  async recordPartsOut(
    engineerId: string,
    inventoryId: string,
    quantity: number,
    unitPrice?: number,
    notes?: string | null
  ) {
    return await supabase.rpc("engineer_parts_out", {
      p_engineer_id: engineerId,
      p_inventory_id: inventoryId,
      p_quantity: quantity,
      p_unit_price: unitPrice ?? null,
      p_notes: notes ?? null,
    });
  },

  async recordPartsIn(
    engineerId: string,
    inventoryId: string,
    quantity: number,
    unitPrice: number,
    notes?: string | null
  ) {
    return await supabase.rpc("engineer_parts_in", {
      p_engineer_id: engineerId,
      p_inventory_id: inventoryId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
      p_notes: notes ?? null,
    });
  },

  async recordPaymentIn(
    engineerId: string,
    amount: number,
    paymentMethod?: string | null,
    notes?: string | null
  ) {
    return await supabase.rpc("engineer_payment_in", {
      p_engineer_id: engineerId,
      p_amount: amount,
      p_payment_method: paymentMethod ?? null,
      p_notes: notes ?? null,
    });
  },

  async recordPaymentOut(
    engineerId: string,
    amount: number,
    paymentMethod?: string | null,
    notes?: string | null
  ) {
    return await supabase.rpc("engineer_payment_out", {
      p_engineer_id: engineerId,
      p_amount: amount,
      p_payment_method: paymentMethod ?? null,
      p_notes: notes ?? null,
    });
  },
};

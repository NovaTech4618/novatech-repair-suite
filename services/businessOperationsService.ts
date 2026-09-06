import { supabase } from "@/lib/supabase";

export const businessOperationsService = {
  async getCustomerBalances() {
    return await supabase.rpc("get_customer_balances");
  },

  async getInvoices() {
    return await supabase.from("invoices").select("*, customers(full_name,phone)").order("issued_at", { ascending: false });
  },

  async createInvoice(input: { invoiceNumber: string; customerId: string | null; repairId?: string | null; saleId?: string | null; subtotal: number; discount?: number; total: number; dueAt?: string | null; notes?: string | null }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { data: null, error: new Error("Not authenticated") };
    const { data: profile, error: profileError } = await supabase.from("profiles").select("company_id").eq("id", user.user.id).single();
    if (profileError || !profile?.company_id) return { data: null, error: profileError ?? new Error("Company not found") };
    return await supabase.from("invoices").insert({ company_id: profile.company_id, invoice_number: input.invoiceNumber, customer_id: input.customerId, repair_id: input.repairId ?? null, sale_id: input.saleId ?? null, subtotal: input.subtotal, discount: input.discount ?? 0, total: input.total, due_at: input.dueAt ?? null, notes: input.notes ?? null, created_by: user.user.id }).select().single();
  },

  async addInvoiceItem(input: { invoiceId: string; description: string; quantity: number; unitPrice: number }) {
    return await supabase.from("invoice_items").insert({ invoice_id: input.invoiceId, description: input.description, quantity: input.quantity, unit_price: input.unitPrice }).select().single();
  },

  async recordCustomerDebt(input: { customerId: string; invoiceId?: string | null; sourceType: "invoice" | "repair" | "sale" | "payment" | "adjustment"; sourceId?: string | null; debit?: number; credit?: number; branchId?: string | null; notes?: string | null }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { data: null, error: new Error("Not authenticated") };
    const { data: profile, error } = await supabase.from("profiles").select("company_id").eq("id", user.user.id).single();
    if (error || !profile?.company_id) return { data: null, error: error ?? new Error("Company not found") };
    return await supabase.from("customer_debt_ledger").insert({ company_id: profile.company_id, customer_id: input.customerId, invoice_id: input.invoiceId ?? null, source_type: input.sourceType, source_id: input.sourceId ?? null, debit: input.debit ?? 0, credit: input.credit ?? 0, branch_id: input.branchId ?? null, notes: input.notes ?? null, created_by: user.user.id });
  },

  async getAuditLogs() {
    return await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  },

  async writeAudit(action: string, entityType: string, entityId?: string | null, oldData?: unknown, newData?: unknown, metadata?: unknown) {
    return await supabase.rpc("write_audit_log", { p_action: action, p_entity_type: entityType, p_entity_id: entityId ?? null, p_old: oldData ?? null, p_new: newData ?? null, p_metadata: metadata ?? null });
  },

  async assignRepair(repairId: string, engineerId: string, notes?: string | null) {
    return await supabase.rpc("assign_repair_engineer", { p_repair_id: repairId, p_engineer_id: engineerId, p_notes: notes ?? null });
  },

  async getEngineerPerformance() {
    return await supabase.from("engineer_performance_summary").select("*").order("completed_repairs", { ascending: false });
  },

  async getInventoryReport() {
    return await supabase.from("inventory_report_summary").select("*");
  },

  async getRepairReport() {
    return await supabase.from("repair_report_summary").select("*");
  },

  async getSalesReport() {
    return await supabase.from("sales_report_summary").select("*");
  },

  async recordStockAdjustment(inventoryId: string, quantity: number, direction: "in" | "out", notes?: string | null) {
    return await supabase.rpc("record_inventory_movement", { p_inventory_id: inventoryId, p_movement_type: direction === "in" ? "adjustment_in" : "adjustment_out", p_quantity: Math.abs(quantity), p_unit_cost: 0, p_reference_type: "manual_adjustment", p_reference_id: null, p_notes: notes ?? null });
  },

  async getStockMovements(inventoryId?: string) {
    let query = supabase.from("inventory_stock_movements").select("*").order("created_at", { ascending: false });
    if (inventoryId) query = query.eq("inventory_id", inventoryId);
    return await query.limit(100);
  },
};

export type QuickLogPaymentMethod = "cash" | "transfer" | "pos" | "other";

export type QuickLog = {
  id: string;
  company_id: string;
  job_name: string;
  amount_charged: number;
  parts_cost: number;
  amount_paid: number;
  payment_method: QuickLogPaymentMethod;
  payment_status: "unpaid" | "partial" | "paid";
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type QuickLogInput = {
  job_name: string;
  amount_charged: number;
  parts_cost: number;
  amount_paid: number;
  payment_method: QuickLogPaymentMethod;
  notes?: string;
};

export type RepairPayment = {
  id: string;
  company_id: string;
  repair_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type RepairFinancialSummary = {
  repair_id: string;
  total_cost: number;
  total_paid: number;
  outstanding: number;
  payment_status: "Paid" | "Partially paid" | "Unpaid" | string;
};

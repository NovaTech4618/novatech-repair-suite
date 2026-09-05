export type FinancialDirection = "in" | "out";

export type FinancialCategory =
  | "customer_payment"
  | "sales"
  | "engineer_payment"
  | "repair_payment"
  | "part_purchase"
  | "salary"
  | "rent"
  | "utility"
  | "other";

export type FinancialTransaction = {
  id: string;
  company_id: string;
  direction: FinancialDirection;
  category: FinancialCategory;
  amount: number;
  payment_method: string;
  description: string;
  source_type: string | null;
  source_id: string | null;
  occurred_at: string;
  recorded_by: string | null;
  created_at: string;
};

export type FinancialTransactionInput = {
  direction: FinancialDirection;
  category: FinancialCategory;
  amount: number;
  payment_method: string;
  description: string;
  occurred_at?: string;
};

export type FinancialSummary = {
  total_in: number;
  total_out: number;
  net_movement: number;
  sales_in: number;
  customer_payments_in: number;
  engineer_payments_in: number;
  engineer_payments_out: number;
  repair_payments_in: number;
  other_in: number;
  other_out: number;
};

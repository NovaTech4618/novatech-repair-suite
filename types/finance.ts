export type FinancialDirection = "in" | "out";

export type FinancialCategory =
  | "customer_payment"
  | "engineer_payment"
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

export type CreditStatus = "unpaid" | "partially_paid" | "paid";

export type PartsCredit = {
  id: string;
  company_id: string;
  customer_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: CreditStatus;
  credit_date: string;
  notes: string | null;
  created_at: string;

  customers?: { full_name: string } | null;
  inventory?: { item_name: string } | null;
};

export type PartsCreditInput = {
  customer_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
};

export type CreditPayment = {
  id: string;
  company_id: string;
  credit_id: string;
  amount: number;
  payment_method: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
};
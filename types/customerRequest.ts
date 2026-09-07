export type CustomerRequestStatus = "pending" | "sourcing" | "available" | "fulfilled" | "cancelled";
export type CustomerRequestPriority = "low" | "normal" | "high" | "urgent";

export type CustomerRequest = {
  id: string;
  company_id: string;
  branch_id: string | null;
  customer_id: string | null;
  requested_item: string;
  details: string | null;
  priority: CustomerRequestPriority;
  status: CustomerRequestStatus;
  quoted_price: number | null;
  contact_customer: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: { full_name: string; phone: string | null } | null;
};

export type CustomerRequestInput = {
  customer_id?: string | null;
  requested_item: string;
  details?: string | null;
  priority?: CustomerRequestPriority;
  quoted_price?: number | null;
  contact_customer?: boolean;
  notes?: string | null;
};

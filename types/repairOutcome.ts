export type RepairOutcomeType =
  | "repaired"
  | "no_fix"
  | "failed_repair"
  | "cancelled"
  | "returned_unrepaired";

export type RepairOutcome = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  outcome: RepairOutcomeType;
  reason: string | null;
  customer_notes: string | null;
  technician_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairWarrantyStatus = "active" | "expired" | "void";

export type RepairWarranty = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  customer_id: string;
  device_id: string;
  warranty_days: number;
  starts_at: string;
  expires_at: string;
  terms: string | null;
  status: RepairWarrantyStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

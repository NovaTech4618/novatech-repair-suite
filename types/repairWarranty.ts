export type RepairOutcome = "repaired" | "no_fix" | "failed_repair" | "cancelled" | "returned_unrepaired";

export type RepairWarranty = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  warranty_days: number;
  starts_at: string;
  expires_at: string;
  terms: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairWarrantyStatus = "active" | "expired" | "void";

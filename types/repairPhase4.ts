export type RepairCheckStatus = "untested" | "pass" | "fail" | "na";

export type RepairIntake = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  device_condition: string | null;
  screen_condition: string | null;
  body_condition: string | null;
  power_test: RepairCheckStatus | null;
  charging_test: RepairCheckStatus | null;
  camera_test: RepairCheckStatus | null;
  speaker_test: RepairCheckStatus | null;
  microphone_test: RepairCheckStatus | null;
  buttons_test: RepairCheckStatus | null;
  biometric_test: RepairCheckStatus | null;
  network_test: RepairCheckStatus | null;
  water_damage: boolean;
  physical_damage: boolean;
  customer_password_provided: boolean;
  accessories_received: string | null;
  missing_items: string | null;
  intake_notes: string | null;
  customer_acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairQuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "superseded";

export type RepairQuote = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  amount: number;
  notes: string | null;
  status: RepairQuoteStatus;
  sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairApprovalAction = "sent" | "approved" | "rejected" | "expired" | "superseded";

export type RepairApprovalHistory = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  quote_id: string | null;
  action: RepairApprovalAction;
  amount: number | null;
  notes: string | null;
  acted_by: string | null;
  acted_at: string;
};

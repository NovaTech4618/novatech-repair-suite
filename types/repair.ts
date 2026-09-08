export const REPAIR_STATUSES = [
  "Received",
  "Diagnosis",
  "Estimate Sent",
  "Customer Approved",
  "Repairing",
  "Testing",
  "Completed",
  "Collected",
  "No Fix",
  "Failed Repair",
  "Returned Unrepaired",
  "Cancelled",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

// Terminal repair outcomes are recorded through the dedicated outcome workflow.
// Manual status editing remains limited to the active workflow states.
export const MANUAL_REPAIR_STATUSES = [
  "Received",
  "Diagnosis",
  "Estimate Sent",
  "Customer Approved",
  "Repairing",
  "Testing",
] as const;

export type ManualRepairStatus = (typeof MANUAL_REPAIR_STATUSES)[number];

export const REPAIR_PRIORITIES = ["Low", "Normal", "Urgent"] as const;
export type RepairPriority = (typeof REPAIR_PRIORITIES)[number];

export type RepairTicket = {
  id: string;
  repair_id: string;
  ticket_number: string;
  issued_at: string;
};

export type Repair = {
  id: string;
  device_id: string;
  technician: string | null;
  issue: string;
  diagnosis: string | null;
  repair_notes: string | null;
  solution: string | null;
  priority: RepairPriority;
  deposit: number;
  expected_completion_date: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  status: RepairStatus;
  received_at: string;
  completed_at: string | null;
  created_at: string;
  company_id: string;
  branch_id: string | null;
  engineer_id: string | null;
  assigned_at: string | null;
  // Populated via joins.
  repair_tickets?: RepairTicket[];
};

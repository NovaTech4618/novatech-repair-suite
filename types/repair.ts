export const REPAIR_STATUSES = [
  "Received",
  "Diagnosis",
  "Estimate Sent",
  "Customer Approved",
  "Repairing",
  "Testing",
  "Completed",
  "Collected",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

// "Completed" is excluded here on purpose — completing a repair happens
// through the dedicated "Mark Completed" action (which also issues a
// pickup ticket), not by manually picking it from this dropdown.
export const MANUAL_REPAIR_STATUSES = REPAIR_STATUSES.filter(
  (s) => s !== "Completed"
);

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
  // Populated via the join in repairService.getRepairs()
  repair_tickets?: RepairTicket[];
};
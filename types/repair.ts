export type Repair = {
  id: string;

  device_id: string;

  technician: string | null;

  issue: string;

  diagnosis: string | null;

  repair_notes: string | null;

  estimated_cost: number | null;

  final_cost: number | null;

  status: string;

  received_at: string;

  completed_at: string | null;

  created_at: string;
};
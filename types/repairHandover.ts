export type RepairHandover = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  customer_id: string;
  handed_over_at: string;
  handed_over_by: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  id_type: string | null;
  id_reference: string | null;
  device_condition: string | null;
  customer_confirmed: boolean;
  notes: string | null;
  created_at: string;
};

export type RepairRepeatLink = {
  id: string;
  company_id: string;
  branch_id: string | null;
  original_repair_id: string;
  repeat_repair_id: string;
  warranty_id: string | null;
  reason: string | null;
  created_at: string;
  created_by: string | null;
};

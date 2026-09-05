export type InventoryMovementType =
  | "opening"
  | "purchase"
  | "sale"
  | "repair_use"
  | "engineer_out"
  | "engineer_return"
  | "adjustment_in"
  | "adjustment_out";

export type InventoryStockMovement = {
  id: string;
  company_id: string;
  inventory_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};
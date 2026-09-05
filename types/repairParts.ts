export type RepairPartUsage = {
  id: string;
  company_id: string;
  repair_id: string;
  inventory_id: string;
  quantity_used: number;
  quantity_returned: number;
  unit_cost: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  inventory?: {
    item_name: string;
    brand: string | null;
    compatible_models: string | null;
    cost_price: number | null;
    quantity: number;
    shelf_location: string | null;
  } | null;
};

export type RepairProfit = {
  repair_id: string;
  revenue: number;
  parts_cost: number;
  gross_profit: number;
  margin_percent: number;
  amount_paid: number;
  outstanding: number;
};

export type InventoryPurchase = {
  id: string;
  company_id: string;
  supplier: string | null;
  invoice_reference: string | null;
  purchase_date: string;
  payment_method: string;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type InventoryPurchaseItem = {
  id: string;
  purchase_id: string;
  inventory_id: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
};

export type ReceiveInventoryPurchaseInput = {
  supplier: string;
  invoice_reference: string;
  purchase_date: string;
  payment_method: string;
  inventory_id: string;
  quantity: number;
  unit_cost: number;
  notes: string;
};

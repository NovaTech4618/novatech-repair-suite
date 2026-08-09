export type InventoryItem = {
  id: string;
  item_name: string;
  category: string | null;
  brand: string | null;
  compatible_models: string | null;
  sku: string | null;
  selling_price: number;
  cost_price: number | null;
  quantity: number;
  minimum_stock: number;
  supplier: string | null;
  shelf_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItemInput = {
  item_name: string;
  category: string | null;
  brand: string | null;
  compatible_models: string | null;
  sku: string | null;
  selling_price: number;
  cost_price: number | null;
  quantity: number;
  minimum_stock: number;
  supplier: string | null;
  shelf_location: string | null;
  notes: string | null;
};
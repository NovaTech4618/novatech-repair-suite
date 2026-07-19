export type Device = {
  id: string;
  customer_id: string;

  device_type: string;
  brand: string;
  model: string;

  serial_number: string | null;

  color: string | null;

  condition: string | null;

  accessories: string | null;

  problem: string;

  created_at: string;
};
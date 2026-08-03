export type Profile = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};
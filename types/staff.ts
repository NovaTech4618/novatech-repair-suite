export const STAFF_ROLES = [
  "owner",
  "branch_manager",
  "technician",
  "front_desk",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type Branch = {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  is_main: boolean;
  created_at: string;
};

export type BranchInput = {
  name: string;
  address: string | null;
  phone: string | null;
};

export type StaffMember = {
  id: string;
  full_name: string | null;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  branches: Pick<Branch, "id" | "name">[];
};

export type InvitationStatus = "pending" | "accepted" | "revoked";

export type StaffInvitation = {
  id: string;
  company_id: string;
  email: string;
  role: StaffRole;
  branch_ids: string[];
  status: InvitationStatus;
  created_at: string;
  accepted_at: string | null;
};

export type StaffInvitationInput = {
  email: string;
  role: StaffRole;
  branch_ids: string[];
};
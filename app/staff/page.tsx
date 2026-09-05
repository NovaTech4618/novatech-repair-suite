"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { branchService } from "@/services/branchService";
import { staffService } from "@/services/staffService";

import type {
  Branch,
  StaffInvitation,
  StaffMember,
  StaffRole,
} from "@/types/staff";
import { STAFF_ROLES } from "@/types/staff";

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  branch_manager: "Branch Manager",
  technician: "Technician",
  front_desk: "Front Desk",
};

export default function StaffPage() {
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [branchName, setBranchName] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("technician");
  const [inviteBranchIds, setInviteBranchIds] = useState<string[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

    const [roleRes, branchRes, staffRes, inviteRes] = await Promise.all([
      staffService.getMyRole(),
      branchService.getBranches(),
      staffService.getStaff(),
      staffService.getInvitations(),
    ]);

    if (roleRes.data) setMyRole(roleRes.data);
    if (branchRes.data) setBranches(branchRes.data as Branch[]);
    if (staffRes.data) setStaff(staffRes.data);
    if (inviteRes.data) setInvitations(inviteRes.data as StaffInvitation[]);

    setLoading(false);
  }

  const canManage = myRole === "owner" || myRole === "branch_manager";

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchName.trim()) {
      toast.error("Branch name is required.");
      return;
    }

    setSavingBranch(true);
    const { error } = await branchService.addBranch({
      name: branchName.trim(),
      address: null,
      phone: null,
    });
    setSavingBranch(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBranchName("");
    toast.success("Branch added.");
    loadAll();
  }

  async function handleRoleChange(profileId: string, role: StaffRole) {
    const { error } = await staffService.updateStaffRole(profileId, role);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role updated.");
    loadAll();
  }

  async function handleToggleActive(profileId: string, isActive: boolean) {
    const { error } = await staffService.setStaffActive(profileId, !isActive);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(!isActive ? "Staff member reactivated." : "Staff member deactivated.");
    loadAll();
  }

  function toggleInviteBranch(id: string) {
    setInviteBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (inviteBranchIds.length === 0) {
      toast.error("Assign at least one branch.");
      return;
    }

    setSendingInvite(true);
    const { error } = await staffService.inviteStaff({
      email: inviteEmail.trim(),
      role: inviteRole,
      branch_ids: inviteBranchIds,
    });
    setSendingInvite(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setInviteEmail("");
    setInviteBranchIds([]);
    toast.success(
      "Invitation created. Tell them to sign up with this email — they'll join your shop automatically."
    );
    loadAll();
  }

  async function handleRevoke(id: string) {
    const { error } = await staffService.revokeInvitation(id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Invitation revoked.");
    loadAll();
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Loading staff & branches...</p>
      </AppLayout>
    );
  }

  if (!canManage) {
    return (
      <AppLayout>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Only owners and branch managers can manage staff and branches.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff & Branches</h1>
          <p className="text-muted-foreground">
            Manage branches, staff roles, and pending invitations.
          </p>
        </div>

        {/* Branches */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Branches</h2>

          <div className="mb-5 space-y-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <span className="font-medium">{b.name}</span>
                  {b.is_main && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      Main
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    b.is_active ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {b.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>

          {myRole === "owner" && (
            <form onSubmit={handleAddBranch} className="flex gap-2">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="New branch name"
                className="flex-1 rounded-md border bg-background p-2.5"
              />
              <button
                type="submit"
                disabled={savingBranch}
                className="rounded-md bg-primary px-4 py-2.5 text-primary-foreground disabled:opacity-50"
              >
                {savingBranch ? "Adding..." : "Add Branch"}
              </button>
            </form>
          )}
        </div>

        {/* Staff */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Staff</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Branches</th>
                  <th className="p-3">Status</th>
                  {myRole === "owner" && <th className="p-3"></th>}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="p-3">{s.full_name || "Unnamed"}</td>
                    <td className="p-3">
                      {myRole === "owner" ? (
                        <select
                          value={s.role}
                          onChange={(e) =>
                            handleRoleChange(s.id, e.target.value as StaffRole)
                          }
                          className="rounded-md border bg-background p-1.5 text-sm"
                        >
                          {STAFF_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ROLE_LABELS[s.role]
                      )}
                    </td>
                    <td className="p-3">
                      {s.branches.map((b) => b.name).join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className={s.is_active ? "text-green-600" : "text-destructive"}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {myRole === "owner" && (
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleActive(s.id, s.is_active)}
                          className="text-xs text-muted-foreground underline"
                        >
                          {s.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite */}
        {myRole === "owner" && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-1 text-lg font-semibold">Invite Staff</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              They sign up with this email at the normal login page — no
              separate invite link needed.
            </p>

            <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@email.com"
                className="rounded-md border bg-background p-2.5"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                className="rounded-md border bg-background p-2.5"
              >
                {STAFF_ROLES.filter((r) => r !== "owner").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium">Branch access</p>
                <div className="flex flex-wrap gap-2">
                  {branches.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => toggleInviteBranch(b.id)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        inviteBranchIds.includes(b.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-50"
                >
                  {sendingInvite ? "Creating..." : "Create Invitation"}
                </button>
              </div>
            </form>

            {invitations.length > 0 && (
              <div className="mt-6 space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{inv.email}</span>
                      <span className="ml-2 text-muted-foreground">
                        {ROLE_LABELS[inv.role]} · {inv.status}
                      </span>
                    </div>
                    {inv.status === "pending" && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        className="text-xs text-destructive underline"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { repairService } from "@/services/repairService";
import { MANUAL_REPAIR_STATUSES, REPAIR_PRIORITIES } from "@/types/repair";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RepairFormProps = { deviceId: string; onRepairAdded: () => void };

const selectClassName = "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export default function RepairForm({ deviceId, onRepairAdded }: RepairFormProps) {
  const [technician, setTechnician] = useState("");
  const [issue, setIssue] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [solution, setSolution] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [deposit, setDeposit] = useState("");
  const [depositPaymentMethod, setDepositPaymentMethod] = useState("Cash");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [priority, setPriority] = useState<string>("Normal");
  const [status, setStatus] = useState<string>("Received");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await getCurrentSession();

    if (!issue.trim()) return void toast.error("Issue is required.");

    const estimated = estimatedCost ? Number(estimatedCost) : null;
    const final = finalCost ? Number(finalCost) : null;
    const paid = deposit ? Number(deposit) : 0;

    if (estimated !== null && (!Number.isFinite(estimated) || estimated < 0)) return void toast.error("Estimated cost cannot be negative.");
    if (final !== null && (!Number.isFinite(final) || final < 0)) return void toast.error("Final cost cannot be negative.");
    if (!Number.isFinite(paid) || paid < 0) return void toast.error("Deposit cannot be negative.");
    if (final !== null && paid > final) return void toast.error("Deposit cannot be greater than the final cost.");
    if (estimated !== null && final === null && paid > estimated) return void toast.error("Deposit cannot be greater than the estimated cost.");
    if (!REPAIR_PRIORITIES.includes(priority as (typeof REPAIR_PRIORITIES)[number])) return void toast.error("Invalid repair priority.");
    if (!MANUAL_REPAIR_STATUSES.includes(status as (typeof MANUAL_REPAIR_STATUSES)[number])) return void toast.error("Invalid repair status.");

    setLoading(true);
    const { error } = await repairService.addRepair({
      device_id: deviceId,
      technician: technician.trim() || null,
      issue: issue.trim(),
      diagnosis: diagnosis.trim() || null,
      repair_notes: repairNotes.trim() || null,
      solution: solution.trim() || null,
      priority,
      deposit: paid,
      deposit_payment_method: depositPaymentMethod,
      expected_completion_date: expectedCompletionDate || null,
      estimated_cost: estimated,
      final_cost: final,
      status,
    });
    setLoading(false);

    if (error) return void toast.error(error.message);

    toast.success("Repair created successfully!");
    setTechnician(""); setIssue(""); setDiagnosis(""); setSolution(""); setRepairNotes("");
    setEstimatedCost(""); setFinalCost(""); setDeposit(""); setDepositPaymentMethod("Cash");
    setExpectedCompletionDate(""); setPriority("Normal"); setStatus("Received");
    onRepairAdded();
  }

  return (
    <Card>
      <CardHeader><CardTitle>New Repair</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Technician" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          <Input placeholder="Customer Complaint" value={issue} onChange={(e) => setIssue(e.target.value)} />
          <Input placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          <Input placeholder="Solution (what was done to fix it)" value={solution} onChange={(e) => setSolution(e.target.value)} />
          <Input placeholder="Repair Notes" value={repairNotes} onChange={(e) => setRepairNotes(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min="0" placeholder="Estimated Cost" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
            <Input type="number" min="0" placeholder="Final Cost" value={finalCost} onChange={(e) => setFinalCost(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min="0" placeholder="Deposit" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            <Input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
          </div>

          {Number(deposit) > 0 && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Deposit payment method</label>
              <select className={selectClassName} value={depositPaymentMethod} onChange={(e) => setDepositPaymentMethod(e.target.value)}>
                <option>Cash</option><option>Transfer</option><option>POS</option><option>Other</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Priority</label>
              <select className={selectClassName} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {REPAIR_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Status</label>
              <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value)}>
                {MANUAL_REPAIR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Create Repair"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

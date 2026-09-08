"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";

import { repairService } from "@/services/repairService";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RepairRow = {
  id: string;
  device_id: string;
  issue: string;
  status: string;
  created_at: string;
  deposit: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  expected_completion_date: string | null;
  devices: { brand: string; model: string; customers: { full_name: string } | null } | null;
  repair_tickets: { id: string; ticket_number: string }[] | null;
};

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const terminalStatuses = ["Completed", "Collected", "No Fix", "Failed Repair", "Returned Unrepaired", "Cancelled"];

function statusVariant(status: string) {
  if (status === "Completed" || status === "Collected") return "default";
  if (status === "No Fix" || status === "Failed Repair" || status === "Returned Unrepaired" || status === "Cancelled") return "destructive";
  if (status === "Repairing" || status === "Testing") return "secondary";
  return "outline";
}

function slaFor(repair: RepairRow) {
  if (terminalStatuses.includes(repair.status)) return { label: "Closed", variant: "secondary" as const };
  if (!repair.expected_completion_date) return { label: "No deadline", variant: "outline" as const };
  const due = new Date(`${repair.expected_completion_date}T23:59:59`);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.ceil((due.getTime() - start.getTime()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, variant: "destructive" as const };
  if (days === 0) return { label: "Due today", variant: "default" as const };
  if (days <= 2) return { label: `Due in ${days}d`, variant: "outline" as const };
  return { label: `${days}d left`, variant: "secondary" as const };
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchRepairs(); }, []);
  async function fetchRepairs() {
    setLoading(true);
    const { data, error } = await repairService.getAllRepairs();
    setLoading(false);
    if (error) { toast.error("Failed to load repairs."); return; }
    setRepairs((data as unknown as RepairRow[]) || []);
  }

  const filtered = useMemo(() => repairs.filter((repair) => {
    const query = search.trim().toLowerCase();
    const device = repair.devices;
    const customer = device?.customers;
    const matchesSearch = !query || repair.issue.toLowerCase().includes(query) || device?.brand?.toLowerCase().includes(query) || device?.model?.toLowerCase().includes(query) || customer?.full_name?.toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "all" || repair.status === statusFilter);
  }), [repairs, search, statusFilter]);

  const activeCount = repairs.filter((repair) => !terminalStatuses.includes(repair.status)).length;
  const statusOptions = ["Received", "Diagnosis", "Estimate Sent", "Customer Approved", "Repairing", "Testing", "Completed", "Collected", "No Fix", "Failed Repair", "Returned Unrepaired", "Cancelled"];

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-teal-700">Repair desk</p><div className="mt-1 flex items-center gap-3"><h1 className="font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Repairs</h1><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{activeCount} active</span></div><p className="mt-1 text-sm text-slate-500">Open a job, see what is happening, and keep it moving.</p></div>
          <Link href="/devices" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"><Plus className="size-4" /> New repair</Link>
        </header>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search customer, device or issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white pl-9" /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 sm:w-56"><option value="all">All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500"><span>{filtered.length} {filtered.length === 1 ? "repair" : "repairs"}</span>{(search || statusFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="font-semibold text-teal-700">Clear filters</button>}</div>

            {loading ? <div className="space-y-3 p-5"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div> : filtered.length === 0 ? <div className="p-12 text-center"><Wrench className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">{search || statusFilter !== "all" ? "No repairs match your search" : "No repairs yet"}</p><p className="mt-1 text-xs text-slate-500">Start a repair from the device desk.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-white"><tr className="border-b border-slate-100"><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Device</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Problem</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">SLA</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Balance</th><th className="w-10 px-4 py-3" /></tr></thead><tbody>{filtered.map((repair) => { const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0); const paid = Number(repair.deposit ?? 0); const balance = Math.max(total - paid, 0); const ticket = repair.repair_tickets?.[0]; const sla = slaFor(repair); return <tr key={repair.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-4 py-3.5"><Link href={`/repairs/${repair.id}`} className="block min-w-[190px]"><span className="font-semibold text-slate-900 group-hover:text-teal-700">{repair.devices?.brand} {repair.devices?.model}</span><span className="mt-0.5 block text-xs text-slate-400">{ticket?.ticket_number || "Repair job"}</span></Link></td><td className="px-4 py-3.5 text-sm text-slate-600">{repair.devices?.customers?.full_name || "Walk-in"}</td><td className="max-w-[300px] px-4 py-3.5 text-sm text-slate-600"><span className="line-clamp-2">{repair.issue || "No issue recorded"}</span></td><td className="px-4 py-3.5"><Badge variant={statusVariant(repair.status)}>{repair.status}</Badge></td><td className="px-4 py-3.5"><Badge variant={sla.variant}>{sla.label}</Badge></td><td className={`px-4 py-3.5 text-sm font-semibold ${balance > 0 ? "text-slate-900" : "text-slate-400"}`}>{money(balance)}</td><td className="px-4 py-3.5"><Link href={`/repairs/${repair.id}`} aria-label="Open repair" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ArrowRight className="size-4" /></Link></td></tr>; })}</tbody></table></div>}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}

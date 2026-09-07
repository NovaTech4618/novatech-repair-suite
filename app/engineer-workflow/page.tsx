"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { engineerService } from "@/services/engineerService";

type Engineer = { id: string; name: string; status: string };
type Perf = Engineer & { engineer_id: string; total_repairs: number; completed_repairs: number; active_repairs: number; repair_revenue: number };
const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export default function EngineerWorkflowPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [perf, setPerf] = useState<Perf[]>([]);
  const [repairId, setRepairId] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    const [people, performance] = await Promise.all([engineerService.getEngineers(), businessOperationsService.getEngineerPerformance()]);
    setEngineers((people.data ?? []) as Engineer[]);
    setPerf((performance.data ?? []) as Perf[]);
  }
  useEffect(() => { void load(); }, []);

  async function assign() {
    if (!repairId.trim() || !engineerId) { setMessage("Select an engineer and enter the repair ID."); return; }
    const result = await businessOperationsService.assignRepair(repairId.trim(), engineerId);
    setMessage(result.error ? result.error.message : "Repair ownership assigned.");
    if (!result.error) { setRepairId(""); await load(); }
  }

  const visible = useMemo(() => perf.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())), [perf, query]);
  const activeJobs = perf.reduce((sum, e) => sum + Number(e.active_repairs || 0), 0);

  return <AppLayout><div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Workshop operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Engineer Workflow</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Assign repairs, see who is carrying the workload and keep ownership visible from intake to completion.</p></div><div className="text-sm text-slate-500">{engineers.length} engineers · {activeJobs} active jobs</div></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-medium text-slate-700">Repair ID<input value={repairId} onChange={(e) => setRepairId(e.target.value)} placeholder="Enter repair/job ID" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" /></label><label className="text-sm font-medium text-slate-700">Assign to engineer<select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"><option value="">Select engineer</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.status}</option>)}</select></label><button onClick={assign} className="h-10 self-end rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800">Assign repair</button></div>{message && <p className="mt-3 text-sm text-slate-600">{message}</p>}</section>
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-6 text-sm text-slate-500"><span><strong className="text-slate-950">{engineers.length}</strong> engineers</span><span><strong className="text-teal-700">{activeJobs}</strong> active jobs</span><span><strong className="text-slate-950">{perf.reduce((s, e) => s + Number(e.completed_repairs || 0), 0)}</strong> completed</span></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find engineer..." className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 sm:w-56" /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Workshop workload</h2><p className="mt-1 text-sm text-slate-500">The queue should make it obvious who can take the next job.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Engineer</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Active</th><th className="px-5 py-3">Completed</th><th className="px-5 py-3">Total jobs</th><th className="px-5 py-3 text-right">Repair value</th></tr></thead><tbody>{visible.map((e) => <tr key={e.engineer_id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-slate-900">{e.name}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{e.status}</span></td><td className="px-5 py-4 font-semibold text-teal-700">{e.active_repairs}</td><td className="px-5 py-4">{e.completed_repairs}</td><td className="px-5 py-4">{e.total_repairs}</td><td className="px-5 py-4 text-right font-semibold">{money(e.repair_revenue)}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="py-12 text-center text-sm text-slate-500">No engineers match this search.</div>}</div></section>
    <p className="text-xs text-slate-400">Next accountability layer: parts issued to a technician should be attached to the repair, with returns and consumed parts recorded against the same job.</p>
  </div></AppLayout>;
}

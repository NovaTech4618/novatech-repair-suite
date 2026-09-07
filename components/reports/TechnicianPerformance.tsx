"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, RefreshCw, Trophy } from "lucide-react";
import { businessOperationsService } from "@/services/businessOperationsService";

type Row = Record<string, unknown>;

const numberValue = (row: Row, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
};

const textValue = (row: Row, keys: string[], fallback = "—") => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function TechnicianPerformance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const result = await businessOperationsService.getEngineerPerformance();
    if (result.error) setError(result.error.message);
    else setRows(((result.data ?? []) as unknown[]) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const ranked = useMemo(() => {
    return [...rows].sort((a, b) => {
      const completedA = numberValue(a, ["completed_repairs", "completed_jobs", "repairs_completed"]);
      const completedB = numberValue(b, ["completed_repairs", "completed_jobs", "repairs_completed"]);
      const rateA = numberValue(a, ["completion_rate", "completion_percentage"]);
      const rateB = numberValue(b, ["completion_rate", "completion_percentage"]);
      return completedB - completedA || rateB - rateA;
    });
  }, [rows]);

  const totals = useMemo(() => ({
    assigned: rows.reduce((sum, row) => sum + numberValue(row, ["assigned_repairs", "assigned_jobs", "total_repairs", "repairs_assigned"]), 0),
    completed: rows.reduce((sum, row) => sum + numberValue(row, ["completed_repairs", "completed_jobs", "repairs_completed"]), 0),
    revenue: rows.reduce((sum, row) => sum + numberValue(row, ["repair_revenue", "revenue", "completed_value"]), 0),
  }), [rows]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Technician analytics</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Engineer performance</h2>
          <p className="mt-1 text-sm text-slate-500">Compare workload and completed repair performance from the secured reporting layer.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unable to load technician analytics: {error}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Summary label="Technicians" value={String(rows.length)} />
        <Summary label="Completed repairs" value={String(totals.completed)} />
        <Summary label="Repair value" value={money(totals.revenue)} />
      </div>

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Loading performance…</div>
        ) : ranked.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No engineer performance data is available yet.</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Rank</th><th className="px-3 py-3">Engineer</th><th className="px-3 py-3 text-right">Assigned</th><th className="px-3 py-3 text-right">Completed</th><th className="px-3 py-3 text-right">Completion</th><th className="px-3 py-3 text-right">Repair value</th><th className="px-3 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, index) => {
                const assigned = numberValue(row, ["assigned_repairs", "assigned_jobs", "total_repairs", "repairs_assigned"]);
                const completed = numberValue(row, ["completed_repairs", "completed_jobs", "repairs_completed"]);
                const rawRate = numberValue(row, ["completion_rate", "completion_percentage"]);
                const rate = rawRate > 1 ? rawRate : rawRate * 100;
                const revenue = numberValue(row, ["repair_revenue", "revenue", "completed_value"]);
                const balance = numberValue(row, ["engineer_balance", "outstanding_balance", "balance"]);
                const name = textValue(row, ["engineer_name", "name", "full_name"]);
                const delta = index === 0 ? "top" : index === ranked.length - 1 ? "bottom" : "mid";
                return (
                  <tr key={`${name}-${index}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3"><span className="inline-flex items-center gap-1 font-semibold text-slate-700">{index + 1}{index === 0 && <Trophy className="size-3.5 text-amber-500" />}</span></td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{name}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{assigned}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{completed}</td>
                    <td className="px-3 py-3 text-right"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${rate >= 80 ? "bg-emerald-50 text-emerald-700" : rate >= 50 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{rate.toFixed(0)}%</span></td>
                    <td className="px-3 py-3 text-right text-slate-700">{money(revenue)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && ranked.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><ArrowUp className="size-3" /> Strong ≥ 80%</span><span className="inline-flex items-center gap-1"><Minus className="size-3" /> Developing 50–79%</span><span className="inline-flex items-center gap-1"><ArrowDown className="size-3" /> Needs attention &lt; 50%</span></div>}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p></div>;
}

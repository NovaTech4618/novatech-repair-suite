"use client";

import { useEffect, useMemo, useState } from "react";
import { reportsService, type RepairReportRow } from "@/services/reportsService";

const hoursBetween = (start: string, end: string) =>
  (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;

const durationLabel = (hours: number) => {
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const dateOnly = (value: string) => new Date(value).toISOString().slice(0, 10);

export default function RepairTurnaroundAnalytics({ from, to }: { from: string; to: string }) {
  const [rows, setRows] = useState<RepairReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const result = await reportsService.getRepairsForReports(from, to);
    if (result.error) setError(result.error.message || "Unable to load repair turnaround data");
    setRows(result.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [from, to]);

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.completed_at);
    const durations = completed
      .map((r) => hoursBetween(r.received_at ?? r.created_at, r.completed_at!))
      .filter((hours) => Number.isFinite(hours) && hours >= 0);

    const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;
    const fastest = durations.length ? Math.min(...durations) : 0;
    const slowest = durations.length ? Math.max(...durations) : 0;
    const open = rows.filter((r) => !r.completed_at && r.status !== "Collected");
    const today = dateOnly(new Date().toISOString());
    const overdue = open.filter(
      (r) => r.expected_completion_date && dateOnly(r.expected_completion_date) < today,
    );
    const scheduled = completed.filter((r) => r.expected_completion_date);
    const onTime = scheduled.filter(
      (r) => dateOnly(r.completed_at!) <= dateOnly(r.expected_completion_date!),
    ).length;

    const daily = new Map<string, { total: number; count: number }>();
    completed.forEach((r) => {
      const hours = hoursBetween(r.received_at ?? r.created_at, r.completed_at!);
      if (!Number.isFinite(hours) || hours < 0) return;
      const day = dateOnly(r.completed_at!);
      const current = daily.get(day) ?? { total: 0, count: 0 };
      daily.set(day, { total: current.total + hours, count: current.count + 1 });
    });

    const trend = [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([day, value]) => ({ day, average: value.total / value.count, count: value.count }));

    return {
      completedCount: completed.length,
      openCount: open.length,
      overdueCount: overdue.length,
      average,
      fastest,
      slowest,
      onTimeRate: scheduled.length ? (onTime / scheduled.length) * 100 : null,
      trend,
      overdue,
    };
  }, [rows]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Repair turnaround</h2>
          <p className="mt-1 text-xs text-slate-500">How long repairs take from intake to completion, with overdue and on-time tracking.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat title="Average turnaround" value={stats.completedCount ? durationLabel(stats.average) : "—"} />
        <Stat title="Completed" value={String(stats.completedCount)} />
        <Stat title="Open repairs" value={String(stats.openCount)} />
        <Stat title="Overdue open" value={String(stats.overdueCount)} />
        <Stat title="On-time rate" value={stats.onTimeRate === null ? "—" : `${stats.onTimeRate.toFixed(0)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Turnaround range</h3>
            <span className="text-xs text-slate-400">Completed repairs</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Mini label="Fastest" value={stats.completedCount ? durationLabel(stats.fastest) : "—"} />
            <Mini label="Slowest" value={stats.completedCount ? durationLabel(stats.slowest) : "—"} />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Last 7 completion days</h3>
          <div className="mt-3 space-y-2">
            {stats.trend.length ? stats.trend.map((item) => (
              <div key={item.day} className="flex items-center gap-3 text-xs">
                <span className="w-20 shrink-0 text-slate-500">{item.day.slice(5)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(8, Math.min(100, item.average / Math.max(stats.slowest, 1) * 100))}%` }} />
                </div>
                <span className="w-14 text-right font-medium text-slate-700">{durationLabel(item.average)}</span>
              </div>
            )) : <p className="text-xs text-slate-400">No completed repairs in this period.</p>}
          </div>
        </div>
      </div>

      {stats.overdue.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-950">Overdue repairs needing attention</h3>
              <p className="mt-1 text-xs text-amber-800">These open jobs have passed their expected completion date.</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">{stats.overdue.length}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.overdue.slice(0, 6).map((repair) => (
              <div key={repair.id} className="rounded-lg border border-amber-200 bg-white p-3">
                <p className="truncate text-xs font-semibold text-slate-900">Repair #{repair.id.slice(0, 8)}</p>
                <p className="mt-1 text-xs text-slate-500">Due {dateOnly(repair.expected_completion_date!)}</p>
                <p className="mt-1 text-xs text-amber-700">Status: {repair.status ?? "Open"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>;
}

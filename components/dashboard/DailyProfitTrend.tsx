"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { financeService } from "@/services/financeService";
import type { ProfitSummary } from "@/types/finance";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

type Segment = {
  label: string;
  value: number;
  className: string;
  action: string;
};

function last7Days() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const requestEnd = new Date(end);
  requestEnd.setDate(requestEnd.getDate() + 1);
  return { start: start.toISOString(), end: requestEnd.toISOString() };
}

export default function DailyProfitTrend() {
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const { start, end } = last7Days();
    void financeService.getProfitSummary(start, end).then(({ data, error: resultError }) => {
      if (!mounted) return;
      if (resultError) setError(resultError.message);
      else setSummary(data?.[0] ?? null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const revenue = Number(summary?.total_revenue ?? 0);
  const parts = Number(summary?.parts_cost ?? 0);
  const expenses = Number(summary?.operating_expenses ?? 0);
  const engineer = Number(summary?.engineer_cost ?? 0);
  const profit = Number(summary?.net_profit ?? 0);

  const segments = useMemo<Segment[]>(() => [
    { label: "Profit", value: Math.max(profit, 0), className: "bg-emerald-500", action: profit > 0 ? "Keep protecting this margin" : "Profit is under pressure" },
    { label: "Parts cost", value: parts, className: "bg-amber-500", action: parts > revenue * 0.45 ? "Review part prices and usage" : "Parts cost looks controlled" },
    { label: "Shop expenses", value: expenses, className: "bg-sky-500", action: expenses > revenue * 0.2 ? "Review recurring shop expenses" : "Shop expenses look controlled" },
    { label: "Engineer payouts", value: engineer, className: "bg-violet-500", action: engineer > revenue * 0.2 ? "Review engineer payout share" : "Engineer payouts look controlled" },
  ], [profit, parts, expenses, engineer, revenue]);

  const chartTotal = segments.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = chartTotal > 0
    ? segments.map((item) => {
        const start = (cursor / chartTotal) * 100;
        cursor += item.value;
        const end = (cursor / chartTotal) * 100;
        const color = item.className.includes("emerald") ? "#10b981" : item.className.includes("amber") ? "#f59e0b" : item.className.includes("sky") ? "#0ea5e9" : "#8b5cf6";
        return `${color} ${start}% ${end}%`;
      }).join(", ")
    : "#94a3b8 0% 100%";

  const biggestCost = [...segments.filter((item) => item.label !== "Profit")].sort((a, b) => b.value - a.value)[0];
  const needsAttention = biggestCost && biggestCost.value > 0 && revenue > 0 && biggestCost.value / revenue >= 0.2;

  return (
    <section className="rounded-3xl border border-[var(--novatech-border)] bg-[var(--novatech-surface)] p-5 shadow-[var(--novatech-shadow-glass)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-[var(--novatech-glass-blue)]" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Action Center</p>
          </div>
          <h2 className="mt-1 font-heading text-lg font-semibold">Where the money is going</h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 7 days · use the colors to see what deserves attention.</p>
        </div>
        <Link href="/finance" className="inline-flex items-center gap-1 self-start rounded-xl border border-[var(--novatech-border)] px-3 py-2 text-xs font-semibold hover:bg-muted">Open finance <ArrowUpRight className="size-3.5" /></Link>
      </div>

      {loading ? <div className="mt-6 h-64 animate-pulse rounded-2xl border border-[var(--novatech-border)]" /> : error ? <div className="mt-6 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error}</div> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
          <div className="relative mx-auto size-56 sm:size-64" aria-label="Seven day business money breakdown">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} />
            <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full border border-[var(--novatech-border)] bg-[var(--novatech-surface)] text-center shadow-inner">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Net profit</span>
              <strong className={`mt-1 font-heading text-xl ${profit < 0 ? "text-destructive" : ""}`}>{money(profit)}</strong>
              <span className="mt-1 text-[10px] text-muted-foreground">7-day total</span>
            </div>
          </div>

          <div className="space-y-2">
            {segments.map((segment) => {
              const percent = chartTotal > 0 ? Math.round((segment.value / chartTotal) * 100) : 0;
              return (
                <div key={segment.label} className="rounded-2xl border border-[var(--novatech-border)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full ${segment.className}`} />
                      <span className="truncate text-sm font-semibold">{segment.label}</span>
                    </div>
                    <span className="shrink-0 font-semibold">{money(segment.value)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span>{percent}% of breakdown</span>
                    <span className="text-right">{segment.action}</span>
                  </div>
                </div>
              );
            })}

            {needsAttention ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p><strong>Action:</strong> {biggestCost?.label} is your biggest recorded cost. Check it before assuming higher sales will mean higher profit.</p>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
                No major cost category is currently above the 20% revenue warning threshold.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

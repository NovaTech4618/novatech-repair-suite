"use client";

import { useEffect, useState } from "react";
import { financeService } from "@/services/financeService";
import type { DailyProfit } from "@/types/finance";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

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
  const [rows, setRows] = useState<DailyProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const { start, end } = last7Days();
    void financeService.getDailyProfitTrend(start, end).then(({ data, error: resultError }) => {
      if (!mounted) return;
      if (resultError) setError(resultError.message);
      else setRows((data ?? []) as DailyProfit[]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const max = Math.max(...rows.map((r) => Math.max(Number(r.revenue), Number(r.parts_cost) + Number(r.operating_expenses) + Number(r.engineer_cost))), 1);

  return (
    <section className="rounded-3xl border border-[var(--novatech-border)] bg-[var(--novatech-surface)] p-5 shadow-[var(--novatech-shadow-glass)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Performance</p>
          <h2 className="mt-1 font-heading text-lg font-semibold">Daily money story</h2>
          <p className="mt-1 text-sm text-muted-foreground">Revenue compared with recorded costs over the last 7 days.</p>
        </div>
      </div>
      {loading ? <div className="h-48 animate-pulse rounded-2xl border border-[var(--novatech-border)]" /> : error ? <div className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error}</div> : (
        <div className="space-y-3">
          {rows.map((row) => {
            const revenue = Number(row.revenue);
            const costs = Number(row.parts_cost) + Number(row.operating_expenses) + Number(row.engineer_cost);
            const profit = Number(row.net_profit);
            return (
              <div key={row.day} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="text-xs font-medium text-muted-foreground">{new Date(`${row.day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--novatech-primary)]" style={{ width: `${Math.max(2, revenue / max * 100)}%` }} /></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${Math.max(costs ? 2 : 0, costs / max * 100)}%` }} /></div>
                </div>
                <div className="min-w-[105px] text-right"><p className="font-semibold">{money(profit)}</p><p className="text-[10px] text-muted-foreground">{money(revenue)} in · {money(costs)} costs</p></div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground"><span>● Revenue</span><span>● Costs</span><span className="font-semibold text-foreground">Profit = money left after recorded costs</span></div>
        </div>
      )}
    </section>
  );
}

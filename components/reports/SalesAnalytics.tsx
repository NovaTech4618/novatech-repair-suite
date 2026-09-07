"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ShoppingCart, TrendingUp } from "lucide-react";
import { reportsService } from "@/services/reportsService";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function SalesAnalytics() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const result = await reportsService.getSalesWithItems();
    if (result.error) setError(result.error.message);
    else setRows((result.data ?? []) as any[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    let revenue = 0, units = 0, cost = 0;
    const products = new Map<string, { units: number; revenue: number }>();
    for (const sale of rows) {
      revenue += Number(sale.total || 0);
      for (const item of sale.sale_items ?? []) {
        const qty = Number(item.quantity || 0), line = Number(item.total_price || qty * Number(item.unit_price || 0));
        units += qty; cost += qty * Number(item.inventory?.cost_price || 0);
        const name = item.inventory?.item_name || "Unnamed item";
        const current = products.get(name) ?? { units: 0, revenue: 0 };
        products.set(name, { units: current.units + qty, revenue: current.revenue + line });
      }
    }
    return { revenue, units, cost, profit: revenue - cost, products: [...products.entries()].sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 5) };
  }, [rows]);

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Sales analytics</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Sales performance</h2><p className="mt-1 text-sm text-slate-500">Understand sales volume, product demand and estimated product margin.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
    </div>
    {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unable to load sales analytics: {error}</div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card label="Sales" value={String(rows.length)} /><Card label="Revenue" value={money(stats.revenue)} /><Card label="Units sold" value={String(stats.units)} /><Card label="Product margin" value={money(stats.profit)} /></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-2"><ShoppingCart className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">Top-selling products</h3></div><div className="mt-4 space-y-3">{loading ? <p className="text-sm text-slate-500">Loading…</p> : stats.products.length ? stats.products.map(([name, value], index) => <div key={name} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{index + 1}. {name}</p><p className="text-xs text-slate-500">{value.units} units</p></div><span className="text-sm font-semibold">{money(value.revenue)}</span></div>) : <p className="text-sm text-slate-500">No sales recorded yet.</p>}</div></div>
      <div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2"><TrendingUp className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">Sales health</h3></div><div className="mt-4 space-y-4 text-sm"><Row label="Average sale" value={money(rows.length ? stats.revenue / rows.length : 0)} /><Row label="Estimated product cost" value={money(stats.cost)} /><Row label="Estimated product margin" value={money(stats.profit)} /></div></div>
    </div>
  </section>;
}
function Card({label,value}:{label:string;value:string}) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p></div>; }
function Row({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>; }

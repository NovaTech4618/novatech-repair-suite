"use client";

import { useEffect, useMemo, useState } from "react";
import { reportsService, type InventoryValuationRow } from "@/services/reportsService";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export default function StockValuation() {
  const [items, setItems] = useState<InventoryValuationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const result = await reportsService.getInventoryValuation();
    if (result.error) setError(result.error.message || "Unable to load stock valuation");
    setItems(result.data ?? []); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => {
    const cost = items.reduce((s, x) => s + Math.max(0, Number(x.quantity || 0)) * Number(x.cost_price || 0), 0);
    const retail = items.reduce((s, x) => s + Math.max(0, Number(x.quantity || 0)) * Number(x.selling_price || 0), 0);
    const low = items.filter(x => Number(x.quantity || 0) > 0 && Number(x.quantity || 0) <= Number(x.minimum_stock || 0)).length;
    const out = items.filter(x => Number(x.quantity || 0) <= 0).length;
    const categories = new Map<string, { cost: number; retail: number; units: number }>();
    items.forEach(x => { const key = x.category?.trim() || "Uncategorized"; const c = categories.get(key) ?? { cost: 0, retail: 0, units: 0 }; c.units += Math.max(0, Number(x.quantity || 0)); c.cost += Math.max(0, Number(x.quantity || 0)) * Number(x.cost_price || 0); c.retail += Math.max(0, Number(x.quantity || 0)) * Number(x.selling_price || 0); categories.set(key, c); });
    return { cost, retail, margin: retail - cost, marginPct: retail ? (retail - cost) / retail * 100 : 0, low, out, categories: [...categories.entries()].sort((a,b)=>b[1].cost-a[1].cost).slice(0,6), top: [...items].sort((a,b)=>(Number(b.quantity)*Number(b.cost_price))-(Number(a.quantity)*Number(a.cost_price))).slice(0,8) };
  }, [items]);

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Stock valuation & inventory intelligence</h2><p className="mt-1 text-xs text-slate-500">Current stock value based on recorded quantity, cost price and selling price.</p></div><button onClick={()=>void load()} disabled={loading} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading?"Refreshing…":"Refresh"}</button></div>
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Stat title="Stock cost value" value={money(summary.cost)}/><Stat title="Potential retail value" value={money(summary.retail)}/><Stat title="Potential gross margin" value={money(summary.margin)}/><Stat title="Low stock" value={String(summary.low)}/><Stat title="Out of stock" value={String(summary.out)}/></div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-semibold text-slate-900">Top stock value</h3><p className="mt-1 text-xs text-slate-500">Items holding the most capital at cost.</p><div className="mt-4 space-y-2">{summary.top.length?summary.top.map(x=><div key={x.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{x.item_name}</p><p className="text-xs text-slate-500">{Number(x.quantity||0).toLocaleString()} units · {x.category||"Uncategorized"}</p></div><strong className="text-sm">{money(Number(x.quantity||0)*Number(x.cost_price||0))}</strong></div>):<p className="py-5 text-center text-sm text-slate-400">No inventory yet.</p>}</div></div>
    <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">Category valuation</h3><p className="mt-1 text-xs text-slate-500">Where inventory cost is concentrated.</p></div><span className="text-xs text-slate-400">Margin {summary.marginPct.toFixed(1)}%</span></div><div className="mt-4 space-y-3">{summary.categories.length?summary.categories.map(([name,c])=><div key={name}><div className="mb-1 flex justify-between text-xs"><span className="truncate text-slate-600">{name}</span><strong>{money(c.cost)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal-600" style={{width:`${summary.cost?Math.min(100,c.cost/summary.cost*100):0}%`}}/></div></div>):<p className="py-5 text-center text-sm text-slate-400">No category data yet.</p>}</div></div></div>
    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">Stock cost value is the recorded capital currently sitting in inventory. Potential retail value and margin are estimates from current prices; they are not realized profit.</p>
  </section>;
}
function Stat({title,value}:{title:string;value:string}){return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>}

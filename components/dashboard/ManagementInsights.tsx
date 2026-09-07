"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CircleDollarSign, Package, TrendingUp } from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import { financeService } from "@/services/financeService";
import type { DailyProfit, ProfitSummary } from "@/types/finance";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export default function ManagementInsights() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [trend, setTrend] = useState<DailyProfit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);
  async function load() {
    setError("");
    const end = new Date(); const start = new Date(end); start.setDate(end.getDate() - 6);
    const [dashboard, profitResult, trendResult] = await Promise.all([dashboardService.getSummary(), financeService.getProfitSummary(dateOnly(start), dateOnly(end)), financeService.getDailyProfitTrend(dateOnly(start), dateOnly(end))]);
    if (dashboard.error) setError(dashboard.error.message); else setSummary(dashboard.data);
    if (profitResult.error) setError(current => current || profitResult.error.message); else setProfit(Array.isArray(profitResult.data) ? profitResult.data[0] ?? null : null);
    if (trendResult.error) setError(current => current || trendResult.error.message); else setTrend(Array.isArray(trendResult.data) ? trendResult.data : []);
  }
  const maxProfit = useMemo(() => Math.max(...trend.map(item => Math.max(0, Number(item.net_profit || 0))), 1), [trend]);
  return (<section className="space-y-5"><>{error && <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">Some management metrics could not refresh: {error}</p>}</>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="7-day revenue" value={money(Number(profit?.total_revenue || 0))} hint="Recorded revenue" icon={CircleDollarSign} href="/reports" /><MetricCard title="7-day net profit" value={money(Number(profit?.net_profit || 0))} hint="After parts & expenses" icon={TrendingUp} href="/reports" /><MetricCard title="Customer debt" value={money(Number(summary?.outstanding_customer || 0))} hint="Currently outstanding" icon={ArrowUpRight} href="/outstanding" /><MetricCard title="Low stock" value={String(summary?.low_stock_count ?? 0)} hint="Items needing attention" icon={Package} href="/inventory" /></div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-heading text-base font-semibold text-slate-950">Profit trend</h2><p className="mt-0.5 text-xs text-slate-500">Daily net profit for the last 7 days.</p></div><BarChart3 className="size-5 text-teal-700" /></div><div className="mt-6 flex h-36 items-end gap-2 sm:gap-3">{trend.length === 0 ? <p className="w-full text-center text-sm text-slate-400">No profit activity recorded yet.</p> : trend.map(item => { const value = Number(item.net_profit || 0); const height = Math.max(6, Math.round((Math.max(0, value) / maxProfit) * 100)); return <div key={item.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="max-w-full truncate text-[10px] font-medium text-slate-500">{money(value)}</span><div className="flex h-24 w-full items-end rounded-lg bg-slate-100 px-1"><div className="w-full rounded-md bg-teal-600" style={{ height: `${height}%` }} title={`${item.day}: ${money(value)}`} /></div><span className="text-[10px] text-slate-400">{new Date(`${item.day}T12:00:00`).toLocaleDateString("en-NG", { weekday: "short" })}</span></div>; })}</div></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-heading text-base font-semibold text-slate-950">Management pulse</h2><p className="mt-0.5 text-xs text-slate-500">The numbers worth checking first.</p><div className="mt-5 space-y-4"><Pulse label="Parts cost" value={money(Number(profit?.parts_cost || 0))} /><Pulse label="Operating expenses" value={money(Number(profit?.operating_expenses || 0))} /><Pulse label="Engineer cost" value={money(Number(profit?.engineer_cost || 0))} /><Pulse label="Cash received" value={money(Number(profit?.cash_in || 0))} /></div><Link href="/reports" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">Open full reports <ArrowUpRight className="size-3.5" /></Link></div></div>
  </section>);
}
function MetricCard({ title, value, hint, icon: Icon, href }: { title: string; value: string; hint: string; icon: typeof CircleDollarSign; href: string }) { return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-500">{title}</p><p className="mt-2 font-heading text-xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-400">{hint}</p></div><div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Icon className="size-4" /></div></div></Link>; }
function Pulse({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-xs text-slate-500">{label}</span><span className="text-sm font-semibold text-slate-900">{value}</span></div>; }

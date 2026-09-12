"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock3, PackageSearch, UserRound, Users, Wrench } from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import DashboardCard from "./DashboardCard";

const empty: DashboardSummary = { repairs_today: 0, active_repairs: 0, completed_today: 0, cash_today: 0, outstanding_customer: 0, low_stock_count: 0, engineer_debit: 0 };
const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function QuickStats() {
  const [summary, setSummary] = useState<DashboardSummary>(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    const result = await dashboardService.getSummary();
    if (result.error) setError(result.error.message || "Unable to refresh dashboard.");
    else if (result.data) { setSummary(result.data); setError(""); }
    setLoading(false);
  }

  const stats = [
    { title: "Cash Today", value: money(summary.cash_today), icon: Banknote, color: "bg-slate-900", label: "Payments received", href: "/finance" },
    { title: "Repairs Today", value: summary.repairs_today, icon: Wrench, color: "bg-[#12b76a]", label: "New jobs", href: "/repairs" },
    { title: "Active Repairs", value: summary.active_repairs, icon: Clock3, color: "bg-amber-500", label: "Still in the workshop", href: "/repairs" },
    { title: "Completed Today", value: summary.completed_today, icon: CheckCircle2, color: "bg-emerald-600", label: "Completed jobs", href: "/repairs" },
    { title: "Customer Debt", value: money(summary.outstanding_customer), icon: Users, color: "bg-amber-600", label: "Outstanding", href: "/outstanding" },
    { title: "Engineer Debt", value: money(summary.engineer_debit), icon: UserRound, color: "bg-slate-700", label: "Parts / account balance", href: "/technician-ledger" },
    { title: "Low Stock", value: summary.low_stock_count, icon: PackageSearch, color: "bg-orange-600", label: "Items needing attention", href: "/inventory" },
  ];

  return (
    <section aria-labelledby="dashboard-overview">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div><h2 id="dashboard-overview" className="font-heading text-base font-semibold text-slate-950">Today at a glance</h2><p className="mt-0.5 text-xs text-slate-500">The numbers that tell you what needs attention.</p></div>
        {loading && <span className="text-xs text-slate-400">Updating…</span>}
      </div>
      {error && <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">Dashboard refresh failed. {error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => <DashboardCard key={stat.title} {...stat} />)}
      </div>
    </section>
  );
}

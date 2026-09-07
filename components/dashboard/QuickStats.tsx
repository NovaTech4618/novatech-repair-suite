"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock3, Wrench } from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import DashboardCard from "./DashboardCard";

const empty: DashboardSummary = {
  repairs_today: 0,
  active_repairs: 0,
  completed_today: 0,
  cash_today: 0,
  outstanding_customer: 0,
  low_stock_count: 0,
  engineer_debit: 0,
};

export default function QuickStats() {
  const [summary, setSummary] = useState<DashboardSummary>(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchStats();
  }, []);

  async function fetchStats() {
    const result = await dashboardService.getSummary();
    if (result.error) setError(result.error.message);
    else if (result.data) setSummary(result.data);
  }

  const money = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const stats = [
    { title: "Repairs Today", value: summary.repairs_today, icon: Wrench, color: "bg-teal-600", label: "New jobs" },
    { title: "Active Repairs", value: summary.active_repairs, icon: Clock3, color: "bg-amber-500", label: "In the workshop" },
    { title: "Completed Today", value: summary.completed_today, icon: CheckCircle2, color: "bg-emerald-600", label: "Ready / completed" },
    { title: "Cash Today", value: money(summary.cash_today), icon: Banknote, color: "bg-slate-900", label: "Received" },
  ];

  return (
    <div>
      {error && <p className="mb-3 text-xs text-destructive">Dashboard refresh failed: {error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} label={stat.label} />
        ))}
      </div>
    </div>
  );
}

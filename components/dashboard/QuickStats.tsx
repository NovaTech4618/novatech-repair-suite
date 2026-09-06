"use client";

import { useEffect, useState } from "react";
import { Wrench, Wallet, Clock3, CheckCircle2 } from "lucide-react";

import { dashboardService } from "@/services/dashboardService";
import DashboardCard from "./DashboardCard";

export default function QuickStats() {
  const [todayTickets, setTodayTickets] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [ticketsRes, revenueRes, waitingRes, completedRes] = await Promise.all([
      dashboardService.getTodayTicketsCount(),
      dashboardService.getTodayRevenue(),
      dashboardService.getWaitingCount(),
      dashboardService.getCompletedTodayCount(),
    ]);

    setTodayTickets(ticketsRes.count);
    setRevenue(revenueRes.total);
    setWaiting(waitingRes.count);
    setCompletedToday(completedRes.count);
  }

  const formattedRevenue = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(revenue);

  const stats = [
    { title: "Today's Repairs", value: todayTickets, icon: Wrench, color: "bg-teal-600", label: "Workshop intake" },
    { title: "Revenue Today", value: formattedRevenue, icon: Wallet, color: "bg-slate-900", label: "Sales + repairs" },
    { title: "Waiting", value: waiting, icon: Clock3, color: "bg-amber-500", label: "Needs attention" },
    { title: "Completed Today", value: completedToday, icon: CheckCircle2, color: "bg-emerald-600", label: "Ready / completed" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          label={stat.label}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Wrench, DollarSign, Clock, CheckCircle } from "lucide-react";

import { getCurrentSession } from "@/lib/supabase";
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
    await getCurrentSession();

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

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Today's Tickets" value={todayTickets} icon={Wrench} color="bg-blue-600" />
      <DashboardCard title="Revenue Today" value={`₦${revenue}`} icon={DollarSign} color="bg-green-600" />
      <DashboardCard title="Waiting" value={waiting} icon={Clock} color="bg-amber-500" />
      <DashboardCard title="Completed Today" value={completedToday} icon={CheckCircle} color="bg-emerald-600" />
    </div>
  );
}
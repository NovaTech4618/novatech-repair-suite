"use client";

import { useEffect, useState } from "react";

import { getCurrentSession } from "@/lib/supabase";
import { dashboardService } from "@/services/dashboardService";

export default function RecentActivity() {
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
    await getCurrentSession();
    const { data } = await dashboardService.getRecentRepairs(5);
    setRepairs(data || []);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-bold">Recent Repairs</h2>

      {repairs.length === 0 ? (
        <p className="text-sm text-slate-500">No repairs yet.</p>
      ) : (
        <div className="space-y-4">
          {repairs.map((repair) => {
            const device = Array.isArray(repair.devices) ? repair.devices[0] : repair.devices;
            const customer = Array.isArray(device?.customers) ? device.customers[0] : device?.customers;

            return (
              <div key={repair.id} className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-semibold">{device?.brand} {device?.model}</p>
                  <p className="text-sm text-slate-500">{customer?.full_name || "-"}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-blue-600">{repair.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
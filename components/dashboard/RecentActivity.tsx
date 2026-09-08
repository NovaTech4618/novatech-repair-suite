"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ChevronRight, Wrench } from "lucide-react";

import { dashboardService } from "@/services/dashboardService";

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("complete") || normalized.includes("ready") || normalized.includes("pickup")) {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  if (normalized.includes("wait") || normalized.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function RecentActivity() {
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    void fetchRecent();
  }, []);

  async function fetchRecent() {
    const { data } = await dashboardService.getRecentRepairs(5);
    setRepairs(data || []);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Activity size={19} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workshop activity</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Recent Repairs</h2>
          </div>
        </div>
        <Link href="/activity" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
          View all
        </Link>
      </div>

      {repairs.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <Wrench size={18} />
          </div>
          <p className="text-sm font-medium text-slate-800">No repairs yet</p>
          <p className="mt-1 text-xs text-slate-500">New repair activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {repairs.map((repair) => {
            const device = Array.isArray(repair.devices) ? repair.devices[0] : repair.devices;
            const customer = Array.isArray(device?.customers) ? device.customers[0] : device?.customers;
            const status = repair.status || "Unknown";

            return (
              <Link
                key={repair.id}
                href={`/repairs/${repair.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Wrench size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {device?.brand || "Unknown"} {device?.model || "Device"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{customer?.full_name || "Customer unavailable"}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${getStatusStyle(status)}`}>
                    {status}
                  </span>
                  <ChevronRight size={15} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

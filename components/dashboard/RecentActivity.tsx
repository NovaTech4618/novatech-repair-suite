"use client";

import { useEffect, useState } from "react";
import {
  Wrench,
  ChevronRight,
  Activity,
} from "lucide-react";

 
import { dashboardService } from "@/services/dashboardService";

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("complete") ||
    normalized.includes("ready") ||
    normalized.includes("pickup")
  ) {
    return {
      dot: "bg-[var(--novatech-primary-light)]",
      text: "text-[var(--novatech-primary-light)]",
      border: "border-[var(--novatech-primary)]/30",
      background: "bg-[var(--novatech-primary)]/10",
    };
  }

  if (
    normalized.includes("wait") ||
    normalized.includes("pending")
  ) {
    return {
      dot: "bg-[var(--novatech-copper)]",
      text: "text-[var(--novatech-copper)]",
      border: "border-[var(--novatech-copper)]/30",
      background: "bg-[var(--novatech-copper)]/10",
    };
  }

  return {
    dot: "bg-[var(--novatech-glass-blue)]",
    text: "text-[var(--novatech-glass-blue)]",
    border: "border-[var(--novatech-glass-blue)]/30",
    background: "bg-[var(--novatech-glass-blue)]/10",
  };
}

export default function RecentActivity() {
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
     

    const { data } = await dashboardService.getRecentRepairs(5);

    setRepairs(data || []);
  }

  return (
    <div
      className="
        glass-panel
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--novatech-border)]
        p-5
        shadow-[var(--novatech-shadow-glass)]
        transition-all
        duration-300
        hover:shadow-[var(--novatech-shadow-glow)]
        sm:p-6
      "
    >
      {/* Scan line */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          -translate-x-full
          bg-gradient-to-r
          from-transparent
          via-[var(--novatech-glass-blue)]
          to-transparent
          opacity-0
          transition-all
          duration-700
          group-hover:translate-x-full
          group-hover:opacity-80
        "
      />

      {/* Header */}
      <div className="relative mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              size-10
              items-center
              justify-center
              rounded-2xl
              bg-[var(--novatech-primary)]/10
              text-[var(--novatech-primary-light)]
            "
          >
            <Activity size={19} />
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Workshop Monitor
            </p>

            <h2 className="mt-1 font-heading text-lg font-semibold">
              Recent Repairs
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[var(--novatech-border)] px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-[var(--novatech-primary-light)] shadow-[0_0_8px_var(--novatech-primary-light)]" />

          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Live
          </span>
        </div>
      </div>

      {repairs.length === 0 ? (
        <div
          className="
            flex
            min-h-40
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-[var(--novatech-border)]
            bg-black/5
            text-center
          "
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--novatech-surface-alt)]">
            <Wrench
              size={18}
              className="text-muted-foreground"
            />
          </div>

          <p className="text-sm font-medium">
            No repairs yet
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            New repair activity will appear here.
          </p>
        </div>
      ) : (
        <div className="relative space-y-3">
          {repairs.map((repair, index) => {
            const device = Array.isArray(repair.devices)
              ? repair.devices[0]
              : repair.devices;

            const customer = Array.isArray(device?.customers)
              ? device.customers[0]
              : device?.customers;

            const status = getStatusStyle(
              repair.status || "Unknown"
            );

            return (
              <div
                key={repair.id}
                className="
                  group/item
                  relative
                  flex
                  items-center
                  justify-between
                  gap-4
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[var(--novatech-border)]
                  bg-black/[0.03]
                  p-4
                  transition-all
                  duration-200
                  hover:bg-[var(--novatech-surface-alt)]
                "
              >
                {/* Timeline */}
                {index < repairs.length - 1 && (
                  <span
                    className="
                      absolute
                      left-[27px]
                      top-[52px]
                      h-5
                      w-px
                      bg-[var(--novatech-border)]
                    "
                  />
                )}

                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="
                      relative
                      flex
                      size-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--novatech-surface-alt)]
                      text-[var(--novatech-glass-blue)]
                    "
                  >
                    <Wrench size={15} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {device?.brand || "Unknown"}{" "}
                      {device?.model || "Device"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {customer?.full_name || "Customer unavailable"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`
                      hidden
                      rounded-full
                      border
                      px-2.5
                      py-1
                      font-mono
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      sm:inline-flex
                      ${status.border}
                      ${status.background}
                      ${status.text}
                    `}
                  >
                    <span
                      className={`mr-1.5 size-1.5 self-center rounded-full ${status.dot}`}
                    />

                    {repair.status || "Unknown"}
                  </span>

                  <ChevronRight
                    size={15}
                    className="
                      text-muted-foreground/40
                      transition-transform
                      group-hover/item:translate-x-0.5
                    "
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
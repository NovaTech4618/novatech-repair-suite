"use client";

import { useRouter } from "next/navigation";
import {
  Wrench,
  UserPlus,
  PackagePlus,
  ShoppingCart,
  ArrowUpRight,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      name: "New Repair",
      description: "Register a device",
      icon: Wrench,
      href: "/devices",
      accent: "text-[var(--novatech-primary-light)]",
      iconBg: "bg-[var(--novatech-primary)]/10",
      hoverBorder: "hover:border-[var(--novatech-primary)]/30",
    },
    {
      name: "Add Customer",
      description: "Create customer record",
      icon: UserPlus,
      href: "/customers",
      accent: "text-[var(--novatech-glass-blue)]",
      iconBg: "bg-[var(--novatech-glass-blue)]/10",
      hoverBorder: "hover:border-[var(--novatech-glass-blue)]/30",
    },
    {
      name: "Add Inventory",
      description: "Add stock item",
      icon: PackagePlus,
      href: "/inventory",
      accent: "text-[var(--novatech-copper)]",
      iconBg: "bg-[var(--novatech-copper)]/10",
      hoverBorder: "hover:border-[var(--novatech-copper)]/30",
    },
    {
      name: "New Sale",
      description: "Open point of sale",
      icon: ShoppingCart,
      href: "/sales",
      accent: "text-[var(--novatech-primary-light)]",
      iconBg: "bg-[var(--novatech-primary)]/10",
      hoverBorder: "hover:border-[var(--novatech-primary)]/30",
    },
  ];

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
        sm:p-6
      "
    >
      {/* Diagnostic scan line */}
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
      <div className="relative mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Operations
          </p>

          <h2 className="mt-1 font-heading text-lg font-semibold">
            Quick Actions
          </h2>
        </div>

        <div className="rounded-full border border-[var(--novatech-border)] px-2.5 py-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Command
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.name}
              type="button"
              onClick={() => router.push(action.href)}
              className={`
                group/action
                relative
                flex
                min-h-24
                items-center
                justify-between
                gap-4
                overflow-hidden
                rounded-2xl
                border
                border-[var(--novatech-border)]
                bg-black/[0.03]
                p-4
                text-left
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[var(--novatech-surface-alt)]
                ${action.hoverBorder}
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--novatech-glass-blue)]
              `}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`
                    flex
                    size-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    ${action.iconBg}
                    ${action.accent}
                    transition-transform
                    duration-200
                    group-hover/action:scale-105
                  `}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>

                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold">
                    {action.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={17}
                className="
                  shrink-0
                  text-muted-foreground/40
                  transition-all
                  duration-200
                  group-hover/action:-translate-y-0.5
                  group-hover/action:translate-x-0.5
                  group-hover/action:text-foreground
                "
              />

              {/* Hover scan */}
              <span
                className="
                  pointer-events-none
                  absolute
                  bottom-0
                  left-0
                  h-px
                  w-0
                  bg-[var(--novatech-glass-blue)]
                  transition-all
                  duration-300
                  group-hover/action:w-full
                "
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
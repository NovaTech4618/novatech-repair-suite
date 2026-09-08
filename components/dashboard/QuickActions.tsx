"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, PackagePlus, ShoppingCart, UserPlus, Wrench } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      name: "New Repair",
      description: "Register a device and start a repair",
      icon: Wrench,
    href: "/devices",
    },
    {
      name: "Add Customer",
      description: "Create a customer record",
      icon: UserPlus,
      href: "/customers",
    },
    {
      name: "Add Inventory",
      description: "Add a part or stock item",
      icon: PackagePlus,
      href: "/inventory",
    },
    {
      name: "New Sale",
      description: "Open the point of sale",
      icon: ShoppingCart,
      href: "/sales",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Operations
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Start the next task without leaving the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.name}
              type="button"
              onClick={() => router.push(action.href)}
              className="group flex min-h-20 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                  <Icon size={19} strokeWidth={2} />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">
                    {action.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {action.description}
                  </span>
                </span>
              </div>

              <ArrowUpRight
                size={17}
                className="shrink-0 text-slate-400 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDollarSign, PackageSearch, Plus, UserRound, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import ManagementInsights from "@/components/dashboard/ManagementInsights";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";

const workflow = [
  { label: "Customer", description: "Register the customer and their contact details.", href: "/customers", icon: UserRound },
  { label: "Device", description: "Record the device, fault and intake condition.", href: "/devices", icon: Wrench },
  { label: "Repair", description: "Assign an engineer and follow the job through repair.", href: "/repairs", icon: CheckCircle2 },
  { label: "Parts & stock", description: "Issue repair parts with engineer accountability.", href: "/inventory", icon: PackageSearch },
  { label: "Payment & pickup", description: "Invoice, collect payment and close the job.", href: "/finance", icon: CircleDollarSign },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Workshop dashboard</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your workshop command center.</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">See what needs attention, understand your numbers, and move work forward without hunting through notebooks or messages.</p>
          </div>
          <Link href="/repairs" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Plus className="size-4" />
            New repair
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Repair workflow</p>
              </div>
              <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-slate-950">One repair, one clear journey.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Start with the customer and device. NOVATECH keeps the repair, engineer, parts, invoice and payment connected as the job moves through your workshop.</p>
            </div>
            <Link href="/repairs" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-teal-300 hover:bg-slate-50">
              Open repair desk <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link key={step.label} href={step.href} className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:ring-teal-100">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-data text-[11px] font-semibold text-slate-400">0{index + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <QuickStats />
        <ManagementInsights />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-950">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">A live view of work moving through the shop.</p>
              </div>
              <Link href="/repairs" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
                View repairs <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="p-4 sm:p-5"><RecentActivity /></div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Wrench className="size-4" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-950">Stock attention</h2>
                <p className="text-xs text-slate-500">Parts and stock levels that need a look.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5"><LowStock /></div>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="font-heading text-base font-semibold text-slate-950">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Common workshop tasks, one click away.</p>
          </div>
          <QuickActions />
        </section>
      </div>
    </AppLayout>
  );
}

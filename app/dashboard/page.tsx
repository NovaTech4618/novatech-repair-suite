import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDollarSign, PackageSearch, Plus, UserRound, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import ManagementInsights from "@/components/dashboard/ManagementInsights";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";
import QuickSale from "@/components/dashboard/QuickSale";

const workflow = [
  { label: "Customer", description: "Register the customer and contact details.", href: "/customers", icon: UserRound },
  { label: "Device", description: "Record the device, fault and intake condition.", href: "/devices", icon: Wrench },
  { label: "Repair", description: "Assign an engineer and track the job.", href: "/repairs", icon: CheckCircle2 },
  { label: "Parts & stock", description: "Issue parts with engineer accountability.", href: "/inventory", icon: PackageSearch },
  { label: "Payment & pickup", description: "Invoice, collect payment and close the job.", href: "/finance", icon: CircleDollarSign },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-0">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#087443]">Workshop dashboard</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Run the shop from one place.</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">See what needs attention, understand the numbers, and move work forward without hunting through notebooks or messages.</p>
          </div>
          <Link href="/repairs" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#087443] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]"><Plus className="size-4" aria-hidden="true" /> New repair</Link>
        </header>

        <QuickSale />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--novatech-shadow-card)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#12b76a]" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087443]">Repair workflow</p></div>
              <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-slate-950">From intake to pickup.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Keep the customer, device, repair, engineer, parts, invoice and payment connected as each job moves through the workshop.</p>
            </div>
            <Link href="/repairs" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#12b76a]/50 hover:bg-[#eaf8f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]">Open repair desk <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((step, index) => { const Icon = step.icon; return <Link key={step.label} href={step.href} className="group rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-[#12b76a]/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]"><div className="flex items-center justify-between"><span className="flex size-8 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-slate-200 group-hover:bg-[#eaf8f1] group-hover:text-[#087443] group-hover:ring-[#12b76a]/20"><Icon className="size-4" aria-hidden="true" /></span><span className="font-data text-[11px] font-semibold text-slate-400">0{index + 1}</span></div><p className="mt-3 text-sm font-bold text-slate-900">{step.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p></Link>; })}
          </div>
        </section>

        <QuickStats />
        <ManagementInsights />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-[var(--novatech-shadow-card)]"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-heading text-base font-semibold text-slate-950">Recent activity</h2><p className="mt-0.5 text-xs text-slate-500">A live view of work moving through the shop.</p></div><Link href="/repairs" className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#087443] hover:bg-[#eaf8f1] focus-visible:outline-2 focus-visible:outline-[#12b76a]">View repairs <ArrowRight className="size-3.5" aria-hidden="true" /></Link></div><div className="p-4 sm:p-5"><RecentActivity /></div></div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-[var(--novatech-shadow-card)]"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Wrench className="size-4" aria-hidden="true" /></div><div><h2 className="font-heading text-base font-semibold text-slate-950">Stock attention</h2><p className="text-xs text-slate-500">Parts and stock levels that need a look.</p></div></div><div className="p-4 sm:p-5"><LowStock /></div></div>
        </section>

        <section><div className="mb-3"><h2 className="font-heading text-base font-semibold text-slate-950">Quick actions</h2><p className="mt-0.5 text-xs text-slate-500">Common workshop tasks, one click away.</p></div><QuickActions /></section>
      </div>
    </AppLayout>
  );
}

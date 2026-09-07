import Link from "next/link";
import { ArrowRight, Plus, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Workshop dashboard</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good to see you.</h1>
            <p className="mt-1 text-sm text-slate-500">Everything important for today, without the clutter.</p>
          </div>
          <Link
            href="/repairs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="size-4" />
            New repair
          </Link>
        </header>

        <QuickStats />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-950">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">What is happening in the shop.</p>
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
                <p className="text-xs text-slate-500">Parts that need a look.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5"><LowStock /></div>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="font-heading text-base font-semibold text-slate-950">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Common tasks, one click away.</p>
          </div>
          <QuickActions />
        </section>
      </main>
    </AppLayout>
  );
}

import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";
import FinancialPulse from "@/components/dashboard/FinancialPulse";
import ProfitPulse from "@/components/dashboard/ProfitPulse";
import DailyProfitTrend from "@/components/dashboard/DailyProfitTrend";
import QuickLog from "@/components/dashboard/QuickLog";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(45,212,191,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">System Online</span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Workshop Command Center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Monitor repairs, revenue, inventory, and today&apos;s workshop activity from one place.</p>
            </div>

            <div className="shrink-0 rounded-2xl border border-slate-700 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal-300/80">Novatech OS</p>
              <p className="mt-1 font-heading text-sm font-semibold text-white">Workshop Operations</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live Metrics</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Today&apos;s Overview</h2>
          </div>
          <QuickStats />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ProfitPulse />
          <QuickLog />
        </section>

        <DailyProfitTrend />
        <FinancialPulse />

        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workshop Monitor</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">What&apos;s happening now</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RecentActivity />
            <LowStock />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operations</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Quick Actions</h2>
          </div>
          <QuickActions />
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-50 to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700">
                <span className="text-lg">✦</span>
              </div>
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-700">Coming Next</p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Novatech Copilot</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Your future business assistant for understanding repairs, sales, customers, inventory, and workshop performance.</p>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">In Development</div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

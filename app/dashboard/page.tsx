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
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-50/80 to-transparent" />
          <div className="pointer-events-none absolute right-10 top-8 size-24 rounded-full bg-teal-100/70 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">
                <span className="size-1.5 rounded-full bg-teal-600" />
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-700">Workshop online</span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Good to see you. Let&apos;s run the workshop.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Monitor repairs, revenue, inventory, and today&apos;s workshop activity from one place.</p>
            </div>

            <div className="relative shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">NOVATECH</p>
              <p className="mt-1 font-heading text-sm font-semibold text-slate-900">Workshop Operations</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live metrics</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Today&apos;s overview</h2>
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
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workshop monitor</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">What&apos;s happening now</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RecentActivity />
            <LowStock />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Operations</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Quick actions</h2>
          </div>
          <QuickActions />
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-50 to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
                <span className="text-lg">✦</span>
              </div>
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-700">Coming next</p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-slate-950">Novatech Copilot</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Your future business assistant for understanding repairs, sales, customers, inventory, and workshop performance.</p>
              </div>
            </div>
            <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">In development</div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

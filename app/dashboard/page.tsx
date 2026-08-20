import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--novatech-border)] bg-[var(--novatech-surface)] p-6 shadow-[var(--novatech-shadow-glass)] sm:p-8">
          {/* Diagnostic grid */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.07]
              [background-image:linear-gradient(rgba(95,168,211,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(95,168,211,0.5)_1px,transparent_1px)]
              [background-size:32px_32px]
            "
          />

          {/* Scan line */}
          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-[var(--novatech-glass-blue)]
              to-transparent
              opacity-70
            "
          />

          {/* Ambient glow */}
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              size-56
              rounded-full
              bg-[var(--novatech-primary)]
              opacity-10
              blur-3xl
            "
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--novatech-primary-light)] shadow-[0_0_10px_var(--novatech-primary-light)]" />

                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--novatech-glass-blue)]">
                  System Online
                </span>
              </div>

              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Workshop Command Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Monitor repairs, revenue, inventory, and today's workshop
                activity from one place.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-[var(--novatech-border)] bg-black/10 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Novatech OS
              </p>

              <p className="mt-1 font-heading text-sm font-semibold">
                Workshop Operations
              </p>
            </div>
          </div>
        </section>

        {/* QUICK STATS */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Live Metrics
            </p>

            <h2 className="mt-1 font-heading text-lg font-semibold">
              Today's Overview
            </h2>
          </div>

          <QuickStats />
        </section>

        {/* WORKSHOP ACTIVITY */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Workshop Monitor
            </p>

            <h2 className="mt-1 font-heading text-lg font-semibold">
              What's happening now
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RecentActivity />
            <LowStock />
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operations
            </p>

            <h2 className="mt-1 font-heading text-lg font-semibold">
              Quick Actions
            </h2>
          </div>

          <QuickActions />
        </section>

        {/* COPILOT PREVIEW */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--novatech-border)] bg-[var(--novatech-surface)] p-6 shadow-[var(--novatech-shadow-glass)]">
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-br
              from-[var(--novatech-primary)]/[0.08]
              via-transparent
              to-[var(--novatech-glass-blue)]/[0.05]
            "
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--novatech-border)] bg-[var(--novatech-primary)]/10">
                <span className="text-lg">✦</span>
              </div>

              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--novatech-glass-blue)]">
                  Coming Next
                </p>

                <h2 className="mt-1 font-heading text-lg font-semibold">
                  Novatech Copilot
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Your future business assistant for understanding repairs,
                  sales, customers, inventory, and workshop performance.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-[var(--novatech-border)] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              In Development
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
import type { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  label?: string;
};

export default function DashboardCard({ title, value, icon: Icon, color, label }: DashboardCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`size-1.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
          {label && <p className="mt-1.5 text-xs text-slate-500">{label}</p>}
        </div>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>
    </article>
  );
}

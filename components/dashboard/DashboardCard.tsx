import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  label?: string;
};

export default function DashboardCard({ title, value, icon: Icon, color, label }: DashboardCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
            <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
          </div>

          <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>

          {label && <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>}
        </div>

        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="text-white" size={20} strokeWidth={2} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Updated</span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Synced
        </span>
      </div>
    </div>
  );
}

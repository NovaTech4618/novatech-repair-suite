import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color,
}: DashboardCardProps) {
  return (
    <div className="group rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </div>
  );
}
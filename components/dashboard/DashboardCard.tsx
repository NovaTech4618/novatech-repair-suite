import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  label?: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color,
  label,
}: DashboardCardProps) {
  return (
    <div
      className="
        glass-panel
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--novatech-border)]
        p-5
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[var(--novatech-shadow-glow)]
      "
    >
      {/* Diagnostic scan line */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          -translate-x-full
          bg-gradient-to-r
          from-transparent
          via-[var(--novatech-glass-blue)]
          to-transparent
          opacity-0
          transition-all
          duration-700
          group-hover:translate-x-full
          group-hover:opacity-80
        "
      />

      {/* Ambient glow */}
      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          size-28
          rounded-full
          bg-[var(--novatech-primary)]
          opacity-0
          blur-3xl
          transition-opacity
          duration-500
          group-hover:opacity-15
        "
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Metric label */}
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${color} opacity-80`}
            />

            <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {title}
            </p>
          </div>

          {/* Main value */}
          <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>

          {/* Supporting label */}
          {label && (
            <p className="mt-2 text-xs text-muted-foreground">
              {label}
            </p>
          )}
        </div>

        {/* Metric icon */}
        <div
          className={`
            flex
            size-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            ${color}
            shadow-lg
            transition-transform
            duration-300
            group-hover:scale-105
          `}
        >
          <Icon
            className="text-white"
            size={22}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Sync status */}
      <div
        className="
          relative
          mt-5
          flex
          items-center
          justify-between
          border-t
          border-[var(--novatech-border)]
          pt-3
        "
      >
        <span
          className="
            font-mono
            text-[9px]
            uppercase
            tracking-[0.14em]
            text-muted-foreground/50
          "
        >
          Updated
        </span>

        <span
          className="
            flex
            items-center
            gap-1.5
            font-mono
            text-[9px]
            uppercase
            tracking-[0.14em]
            text-muted-foreground
          "
        >
          <span
            className="
              size-1.5
              rounded-full
              bg-[var(--novatech-primary-light)]
              opacity-80
            "
          />

          Synced
        </span>
      </div>
    </div>
  );
}
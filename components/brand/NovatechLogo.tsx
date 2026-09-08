import type { SVGProps } from "react";

type NovatechLogoProps = {
  dark?: boolean;
  compact?: boolean;
  className?: string;
};

export function NovatechLogo({ dark = false, compact = false, className = "" }: NovatechLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-[14px] shadow-sm ${
          dark
            ? "bg-teal-400 text-slate-950 shadow-teal-950/20"
            : "bg-slate-950 text-white shadow-slate-900/10"
        }`}
        aria-hidden="true"
      >
        <NovatechGlyph className="size-7" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-heading text-[18px] font-bold tracking-[-0.025em] ${dark ? "text-white" : "text-slate-950"}`}>
            NOVATECH
          </span>
          <span className={`mt-1.5 block text-[9px] font-bold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Repair Suite
          </span>
        </span>
      )}
    </span>
  );
}

function NovatechGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5.5 21V7l8.5 8.2V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 21V12.8l8.5 8.2V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 5.5H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

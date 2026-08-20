import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "diagnostic"
    | "copper"
    | "glass"
    | "destructive"
    | "secondary"
    | "outline"
    | "default";
}

const variantClasses: Record<
  NonNullable<BadgeProps["variant"]>,
  string
> = {
  diagnostic:
    "border-[#0F6B4C]/30 bg-[#0F6B4C]/10 text-[#0F6B4C]",

  copper:
    "border-[#B5652A]/30 bg-[#B5652A]/10 text-[#B5652A]",

  glass:
    "border-[#5FA8D3]/30 bg-[#5FA8D3]/10 text-[#5FA8D3]",

  destructive:
    "border-rose-500/30 bg-rose-500/10 text-rose-400",

  secondary:
    "border-border bg-muted text-muted-foreground",

  outline:
    "border-border bg-transparent text-foreground",

  default:
    "border-[#0F6B4C]/30 bg-[#0F6B4C]/10 text-[#0F6B4C]",
};

export function Badge({
  className,
  variant = "diagnostic",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium uppercase tracking-tight shadow-sm backdrop-blur-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
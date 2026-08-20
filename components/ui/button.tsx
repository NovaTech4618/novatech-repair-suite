"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "glass"
    | "outline"
    | "destructive"
    | "ghost";

  size?: "sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg";

  nativeButton?: boolean;

  render?: React.ReactElement<{
    className?: string;
    children?: React.ReactNode;
  }>;
}

const variantClasses: Record<
  NonNullable<ButtonProps["variant"]>,
  string
> = {
  primary:
    "bg-[#0F6B4C] text-white hover:bg-[#0B573E] shadow-[0_2px_8px_rgba(15,107,76,0.2)]",

  secondary:
    "bg-[#B5652A] text-white hover:bg-[#984F20] shadow-[0_2px_8px_rgba(181,101,42,0.2)]",

  glass:
    "bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700/80",

  outline:
    "bg-transparent text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white",

  destructive:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_2px_8px_rgba(225,29,72,0.2)]",

  ghost:
    "bg-transparent text-foreground hover:bg-muted hover:text-foreground",
};

const sizeClasses: Record<
  NonNullable<ButtonProps["size"]>,
  string
> = {
  sm: "px-3 py-1.5 text-xs font-medium",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",

  "icon-sm": "size-8 p-0",
  "icon-md": "size-9 p-0",
  "icon-lg": "size-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      nativeButton = true,
      render,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "relative inline-flex items-center justify-center overflow-hidden rounded-md font-manrope font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      "before:pointer-events-none before:absolute before:inset-0 before:-translate-y-full before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent hover:before:animate-[scan_1.5s_ease-in-out_infinite]",
      className
    );

    const content = (
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    );

    if (!nativeButton && render) {
      return React.cloneElement(render, {
        className: cn(classes, render.props.className),
        children: content,
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
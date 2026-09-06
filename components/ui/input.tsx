import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[color,box-shadow,border-color] duration-150 placeholder:text-slate-400 focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-70 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }

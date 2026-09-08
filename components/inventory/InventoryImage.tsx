"use client";

import { useState } from "react";

type Props = { src?: string | null; alt: string; size?: "sm" | "md" };

export default function InventoryImage({ src, alt, size = "sm" }: Props) {
  const [failed, setFailed] = useState(false);
  const box = size === "md" ? "h-24 w-24" : "h-12 w-12";
  if (!src || failed) return <div className={`${box} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center`}><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">No image</span></div>;
  return <div className={`${box} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white`}><img src={src} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" loading="lazy" /></div>;
}

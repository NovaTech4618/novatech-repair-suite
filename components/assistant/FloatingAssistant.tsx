"use client";

import Link from "next/link";
import { Bot, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-white/10"><Bot className="size-4" /></span>
              <div><p className="text-sm font-semibold">NOVATECH Assistant</p><p className="text-[11px] text-slate-300">Your workshop copilot</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X className="size-4" /></button>
          </div>
          <div className="p-4">
            <p className="text-sm leading-6 text-slate-600">Ask about repairs, stock, customers, engineers, sales, debt, profit and business risks.</p>
            <Link href="/assistant" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              <MessageCircle className="size-4" /> Open Assistant
            </Link>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close NOVATECH Assistant" : "Open NOVATECH Assistant"} className="ml-auto flex size-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-950/20 ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-slate-800">
        {open ? <X className="size-5" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}

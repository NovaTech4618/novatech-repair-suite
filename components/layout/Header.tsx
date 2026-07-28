"use client";

import { Bell, Search, Settings } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm md:px-8">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="md:hidden" />
        <Separator orientation="vertical" className="h-6 md:hidden" />

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900 md:text-2xl">
            Dashboard
          </h1>
          <p className="hidden truncate text-sm text-slate-500 sm:block">
            Welcome back, Abdullah 👋
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search — full bar on md+, icon-only on mobile */}
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 bg-transparent text-sm outline-none"
          />
        </div>

        <button
          aria-label="Search"
          className="rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-100 md:hidden"
        >
          <Search size={20} />
        </button>

        {/* Notification */}
        <button
          aria-label="Notifications"
          className="rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-100"
        >
          <Bell size={20} />
        </button>

        {/* Settings — hidden on smallest screens to save space */}
        <button
          aria-label="Settings"
          className="hidden rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-100 sm:block"
        >
          <Settings size={20} />
        </button>

        {/* Profile — text collapses on mobile, avatar always shows */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2 text-white md:px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Abdullah</p>
            <p className="text-xs text-slate-300">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
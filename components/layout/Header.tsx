"use client";

import {
  Bell,
  Search,
  Settings,
} from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">

      {/* Left */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Welcome back, Abdullah 👋
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

          <Search
            size={18}
            className="text-slate-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-56 bg-transparent text-sm outline-none"
          />
        </div>

        {/* Notification */}
        <button className="rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-100">
          <Bell size={20} />
        </button>

        {/* Settings */}
        <button className="rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-100">
          <Settings size={20} />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-2 text-white">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
            A
          </div>

          <div>
            <p className="text-sm font-semibold">
              Abdullah
            </p>

            <p className="text-xs text-slate-300">
              Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
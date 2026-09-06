"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Settings, LogOut } from "lucide-react";

import { supabase, getCurrentSession } from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/devices": "Devices",
  "/repairs": "Repairs",
  "/inventory": "Inventory",
  "/sales": "Sales",
  "/finance": "Finance",
  "/reports": "Reports",
  "/settings": "Settings",
  "/technical-services": "Technical Services",
  "/staff": "Staff & Branches",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = "/" + pathname.split("/")[1];
  return PAGE_TITLES[base] || "Dashboard";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const session = await getCurrentSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, companies(name)")
      .eq("id", session.user.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name);
      const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
      setCompanyName(company?.name ?? null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = fullName || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const iconButtonClass = "rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" />
        <Separator orientation="vertical" className="h-6 md:hidden" />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-bold tracking-tight text-slate-950 md:text-2xl">{getPageTitle(pathname)}</h1>
          <p className="hidden truncate text-sm text-slate-500 sm:block">{companyName ? `${companyName} 👋` : "Welcome back 👋"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" className={iconButtonClass} aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className={iconButtonClass} aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 shadow-sm sm:px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-heading font-semibold text-white">{initial}</div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500">{companyName || "Account"}</p>
          </div>
        </div>

        <button type="button" onClick={() => router.push("/settings")} className={iconButtonClass} aria-label="Settings">
          <Settings className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleLogout} className={iconButtonClass} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
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
  "/alerts": "Alerts",
  "/search": "Global Search",
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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void fetchProfile();
    void loadAlerts();
  }, [pathname]);

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

  async function loadAlerts() {
    const { data } = await supabase.rpc("get_operational_alerts", { p_limit: 100 });
    setUnread(((data ?? []) as Array<{ is_read: boolean }>).filter((alert) => !alert.is_read).length);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = fullName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const iconButtonClass =
    "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" />
        <Separator orientation="vertical" className="h-5 md:hidden" />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-slate-950 md:text-xl">
            {getPageTitle(pathname)}
          </h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {companyName || "Your repair workspace"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => router.push("/search")} className={iconButtonClass} aria-label="Search">
          <Search className="size-4" />
        </button>

        <button type="button" onClick={() => router.push("/alerts")} className={`${iconButtonClass} relative`} aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[8px] font-bold leading-3 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <div className="ml-1 hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white" aria-hidden="true">
            {initial}
          </div>
          <div className="max-w-40 text-left">
            <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-[11px] text-slate-500">{companyName || "Account"}</p>
          </div>
        </div>

        <button type="button" onClick={() => router.push("/settings")} className={iconButtonClass} aria-label="Settings">
          <Settings className="size-4" />
        </button>
        <button type="button" onClick={handleLogout} className={iconButtonClass} aria-label="Log out">
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}

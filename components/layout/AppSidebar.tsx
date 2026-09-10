"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Bot,
  Building2,
  ClipboardCheck,
  FileText,
  Globe2,
  HandCoins,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  UserCog,
  Users,
  WalletCards,
  Wrench,
  Truck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { supabase } from "@/lib/supabase";
import type { StaffRole } from "@/types/staff";

type Icon = typeof LayoutDashboard;
type NavItem = { title: string; url: string; icon: Icon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Front desk",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Global Search", url: "/search", icon: Search },
      { title: "Repairs", url: "/repairs", icon: Wrench },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Devices", url: "/devices", icon: Smartphone },
      { title: "Sales", url: "/sales", icon: ShoppingCart },
    ],
  },
  {
    label: "Workshop",
    items: [
      { title: "Inventory", url: "/inventory", icon: Package },
      { title: "Suppliers & Payables", url: "/inventory/purchases", icon: Truck },
      { title: "Engineer workflow", url: "/engineer-workflow", icon: UserCog },
      { title: "Parts ledger", url: "/technician-ledger", icon: ClipboardCheck },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Outstanding", url: "/outstanding", icon: HandCoins },
      { title: "Finance", url: "/finance", icon: WalletCards },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Customers & AI",
    items: [
      { title: "WhatsApp Center", url: "/whatsapp", icon: MessageCircle },
      { title: "Customer Requests", url: "/customer-requests", icon: BellRing },
      { title: "Assistant", url: "/assistant", icon: Bot },
    ],
  },
];

const manageRoles: StaffRole[] = ["owner", "branch_manager"];

function menuButtonClass() {
  return "h-9 rounded-xl border border-transparent text-slate-300 transition-all duration-150 hover:border-white/5 hover:bg-white/[0.055] hover:text-white data-[active=true]:border-[#21F1A8]/15 data-[active=true]:bg-[#21F1A8]/10 data-[active=true]:font-semibold data-[active=true]:text-[#21F1A8] data-[active=true]:shadow-[inset_2px_0_0_#21F1A8]";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [myRole, setMyRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => {
      if (active && data) setMyRole(data);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function renderItem(item: NavItem) {
    const active =
      pathname === item.url ||
      (item.url !== "/dashboard" && pathname.startsWith(`${item.url}/`));

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          isActive={active}
          tooltip={item.title}
          render={<Link href={item.url} />}
          className={menuButtonClass()}
        >
          <item.icon className="size-[17px]" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const canManageStaff = myRole !== null && manageRoles.includes(myRole);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/[0.07] bg-[#111111] text-slate-200"
    >
      <SidebarHeader className="border-b border-white/[0.06] bg-[#111111] px-3 py-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#21F1A8] font-heading text-sm font-black text-[#07130f] shadow-[0_0_24px_rgba(33,241,168,0.16)]">
            N
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-base font-bold tracking-tight text-white">
              Novatech
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Repair Suite
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#111111] px-2 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-1.5">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600 group-data-[collapsible=icon]:px-0">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] bg-[#111111] p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/activity"}
              tooltip="Activity"
              render={<Link href="/activity" />}
              className={menuButtonClass()}
            >
              <Activity className="size-[17px]" />
              <span>Activity</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/alerts"}
              tooltip="Alerts"
              render={<Link href="/alerts" />}
              className={menuButtonClass()}
            >
              <AlertTriangle className="size-[17px]" />
              <span>Alerts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {canManageStaff && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/staff"}
                  tooltip="Staff & Branches"
                  render={<Link href="/staff" />}
                  className={menuButtonClass()}
                >
                  <Building2 className="size-[17px]" />
                  <span>Staff & Branches</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/settings/showcase"}
                  tooltip="Public Showcase"
                  render={<Link href="/settings/showcase" />}
                  className={menuButtonClass()}
                >
                  <Globe2 className="size-[17px]" />
                  <span>Public Showcase</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/audit"}
                  tooltip="Audit Log"
                  render={<Link href="/audit" />}
                  className={menuButtonClass()}
                >
                  <ShieldCheck className="size-[17px]" />
                  <span>Audit Log</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings"}
              tooltip="Settings"
              render={<Link href="/settings" />}
              className={menuButtonClass()}
            >
              <Settings className="size-[17px]" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/help"}
              tooltip="Help & Support"
              render={<Link href="/help" />}
              className={menuButtonClass()}
            >
              <HelpCircle className="size-[17px]" />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              onClick={handleLogout}
              className={menuButtonClass()}
            >
              <LogOut className="size-[17px]" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

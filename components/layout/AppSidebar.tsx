"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, BellRing, Bot, Building2, ClipboardCheck, FileText, HandCoins, HelpCircle, LayoutDashboard, MessageCircle, Package, Settings, ShieldCheck, ShoppingCart, Smartphone, UserCog, Users, WalletCards, Wrench, Truck } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

const groups = [
  { label: "Front desk", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Repairs", url: "/repairs", icon: Wrench },
    { title: "Customers", url: "/customers", icon: Users },
    { title: "Devices", url: "/devices", icon: Smartphone },
    { title: "Sales", url: "/sales", icon: ShoppingCart },
  ] },
  { label: "Workshop", items: [
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Suppliers & Payables", url: "/inventory/purchases", icon: Truck },
    { title: "Engineer workflow", url: "/engineer-workflow", icon: UserCog },
    { title: "Parts ledger", url: "/technician-ledger", icon: ClipboardCheck },
  ] },
  { label: "Billing", items: [
    { title: "Invoices", url: "/invoices", icon: FileText },
    { title: "Outstanding", url: "/outstanding", icon: HandCoins },
    { title: "Finance", url: "/finance", icon: WalletCards },
  ] },
  { label: "Communication", items: [
    { title: "WhatsApp Center", url: "/whatsapp", icon: MessageCircle },
  ] },
  { label: "Insights", items: [
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Assistant", url: "/assistant", icon: Bot },
  ] },
];

const MANAGE_ROLES: StaffRole[] = ["owner", "branch_manager"];

export default function AppSidebar() {
  const pathname = usePathname();
  const [myRole, setMyRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    staffService.getMyRole().then(({ data }) => {
      if (data) setMyRole(data);
    });
  }, []);

  const canManageStaff = myRole ? MANAGE_ROLES.includes(myRole) : false;

  const renderItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton
        isActive={pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(`${item.url}/`))}
        tooltip={item.title}
        render={<Link href={item.url} />}
        className="h-9 rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:font-semibold data-[active=true]:text-teal-700"
      >
        <item.icon className="size-[17px]" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 font-heading font-bold text-white">N</div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-base font-bold tracking-tight text-slate-950">Novatech</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Repair Suite</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[{ title: "Activity", url: "/activity", icon: Activity }, { title: "Alerts", url: "/alerts", icon: AlertTriangle }, { title: "Customer Requests", url: "/customer-requests", icon: BellRing }].map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {canManageStaff && <>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === "/staff"} tooltip="Staff & Branches" render={<Link href="/staff" />} className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700">
                <Building2 className="size-[17px]" /><span>Staff & Branches</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === "/audit"} tooltip="Audit Log" render={<Link href="/audit" />} className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700">
                <ShieldCheck className="size-[17px]" /><span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>}
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname === "/settings"} tooltip="Settings" render={<Link href="/settings" />} className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700">
              <Settings className="size-[17px]" /><span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname === "/help"} tooltip="Help & Support" render={<Link href="/help" />} className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700">
              <HelpCircle className="size-[17px]" /><span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

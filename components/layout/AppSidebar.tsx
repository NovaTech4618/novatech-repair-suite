"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Smartphone, Wrench, Package, ShoppingCart, BarChart3, Settings, Cpu, Building2, WalletCards, ClipboardList } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Devices", url: "/devices", icon: Smartphone },
  { title: "Repairs", url: "/repairs", icon: Wrench },
  { title: "Tickets", url: "/tickets", icon: ClipboardList },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Finance", url: "/finance", icon: WalletCards },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Technical Services", url: "/technical-services", icon: Cpu },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 font-heading font-bold text-white shadow-sm shadow-teal-600/20">N</div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-base font-bold tracking-tight text-slate-950">Novatech</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Repair Suite</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={pathname === item.url || (item.url === "/tickets" && pathname.startsWith("/tickets/"))} tooltip={item.title} render={<Link href={item.url} />} className="h-10 rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:font-semibold data-[active=true]:text-teal-700 data-[active=true]:shadow-none">
                    <item.icon className="size-[18px]" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {canManageStaff && <SidebarMenuItem><SidebarMenuButton isActive={pathname === "/staff"} tooltip="Staff & Branches" render={<Link href="/staff" />} className="h-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700"><Building2 className="size-[18px]" /><span>Staff & Branches</span></SidebarMenuButton></SidebarMenuItem>}
          <SidebarMenuItem><SidebarMenuButton isActive={pathname === "/settings"} tooltip="Settings" render={<Link href="/settings" />} className="h-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700"><Settings className="size-[18px]" /><span>Settings</span></SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Smartphone, Wrench, Package, ShoppingCart, BarChart3, Settings, Cpu, Building2, WalletCards } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Devices", url: "/devices", icon: Smartphone },
  { title: "Repairs", url: "/repairs", icon: Wrench },
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
  useEffect(() => { staffService.getMyRole().then(({ data }) => { if (data) setMyRole(data); }); }, []);
  const canManageStaff = myRole ? MANAGE_ROLES.includes(myRole) : false;

  return <Sidebar collapsible="icon">
    <SidebarHeader><div className="flex items-center gap-2 px-2 py-1.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">N</div><span className="font-heading text-base font-semibold group-data-[collapsible=icon]:hidden">Novatech</span></div></SidebarHeader>
    <SidebarContent><SidebarGroup><SidebarGroupLabel>Menu</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{navItems.map((item) => <SidebarMenuItem key={item.url}><SidebarMenuButton isActive={pathname === item.url} tooltip={item.title} render={<Link href={item.url} />}><item.icon /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
    <SidebarFooter><SidebarMenu>{canManageStaff && <SidebarMenuItem><SidebarMenuButton isActive={pathname === "/staff"} tooltip="Staff & Branches" render={<Link href="/staff" />}><Building2 /><span>Staff & Branches</span></SidebarMenuButton></SidebarMenuItem>}<SidebarMenuItem><SidebarMenuButton isActive={pathname === "/settings"} tooltip="Settings" render={<Link href="/settings" />}><Settings /><span>Settings</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>;
}

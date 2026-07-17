"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Wrench,
  Package,
  ShoppingCart,
  Laptop,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Devices", href: "/devices", icon: Smartphone },
  { title: "Repairs", href: "/repairs", icon: Wrench },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Sales", href: "/sales", icon: ShoppingCart },
  { title: "Technical Services", href: "/technical-services", icon: Laptop },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function AppSidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-8">
        Novatech
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800"
          >
            <item.icon size={20} />
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
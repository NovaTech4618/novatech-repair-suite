"use client";

import { useRouter } from "next/navigation";
import { Wrench, UserPlus, PackagePlus, ShoppingCart } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    { name: "New Repair", icon: Wrench, href: "/devices" },
    { name: "Add Customer", icon: UserPlus, href: "/customers" },
    { name: "Add Inventory", icon: PackagePlus, href: "/inventory" },
    { name: "New Sale", icon: ShoppingCart, href: "/sales" },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.name}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center justify-center gap-2 border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <Icon size={24} />
              <span className="text-sm font-medium">{action.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
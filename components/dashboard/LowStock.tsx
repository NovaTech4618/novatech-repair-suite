"use client";

import { useEffect, useState } from "react";

import { getCurrentSession } from "@/lib/supabase";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

export default function LowStock() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchLowStock();
  }, []);

  async function fetchLowStock() {
    await getCurrentSession();
    const { data } = await inventoryService.getLowStock();
    setItems((data || []).slice(0, 5));
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-4">Low Stock Alert</h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">All stock levels are healthy.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-3">
              <p className="text-sm font-medium">{item.item_name}</p>
              <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
                {item.quantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
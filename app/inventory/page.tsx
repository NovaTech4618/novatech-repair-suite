"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import ReceiveStockPanel from "@/components/inventory/ReceiveStockPanel";
import type { InventoryItem } from "@/types/inventory";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  function handleSaved() { setRefreshKey((prev) => prev + 1); }
  return <AppLayout><div className="space-y-6 sm:space-y-8">
    <div><h1 className="text-2xl font-bold sm:text-3xl">Inventory Management</h1><p className="mt-1 text-sm text-muted-foreground">Manage parts, receive supplier stock, and keep actual inventory costs accurate.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <InventoryForm editingItem={editingItem} onSaved={handleSaved} onCancelEdit={() => setEditingItem(null)} />
      <ReceiveStockPanel refreshKey={refreshKey} onReceived={handleSaved} />
    </div>
    <InventoryTable refreshKey={refreshKey} onEdit={setEditingItem} />
  </div></AppLayout>;
}

"use client";

import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";

import type { InventoryItem } from "@/types/inventory";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  function handleSaved() {
    setRefreshKey((prev) => prev + 1);
  }

  function handleEdit(item: InventoryItem) {
    setEditingItem(item);
  }

  function handleCancelEdit() {
    setEditingItem(null);
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>

        <InventoryForm
          editingItem={editingItem}
          onSaved={handleSaved}
          onCancelEdit={handleCancelEdit}
        />

        <InventoryTable refreshKey={refreshKey} onEdit={handleEdit} />
      </div>
    </AppLayout>
  );
}
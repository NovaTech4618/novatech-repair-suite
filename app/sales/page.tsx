"use client";

import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import SaleForm from "@/components/sales/SaleForm";
import SalesTable from "@/components/sales/SalesTable";

export default function SalesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaleCompleted() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Sales</h1>
        <SaleForm onSaleCompleted={handleSaleCompleted} />
        <SalesTable refreshKey={refreshKey} />
      </div>
    </AppLayout>
  );
}
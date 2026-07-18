"use client";

import { useState } from "react";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerTable from "@/components/customers/CustomerTable";

export default function CustomersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleCustomerAdded() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">
        Customer Management
      </h1>

      <CustomerForm onCustomerAdded={handleCustomerAdded} />

      <CustomerTable refreshKey={refreshKey} />
    </div>
  );
}
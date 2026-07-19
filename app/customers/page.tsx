"use client";

import { useState } from "react";

import CustomerForm from "@/components/customers/CustomerForm";
import CustomerTable from "@/components/customers/CustomerTable";

import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  function handleCustomerAdded() {
    setRefreshKey((prev) => prev + 1);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
  }

  function handleCancelEdit() {
    setEditingCustomer(null);
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">
        Customer Management
      </h1>

      <CustomerForm
        onCustomerAdded={handleCustomerAdded}
        editingCustomer={editingCustomer}
        onCancelEdit={handleCancelEdit}
      />

      <CustomerTable
        refreshKey={refreshKey}
        onEdit={handleEdit}
      />
    </div>
  );
}
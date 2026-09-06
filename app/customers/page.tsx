"use client";

import { useState } from "react";
import { Users, UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerTable from "@/components/customers/CustomerTable";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  function handleCustomerChanged() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-7 p-5 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-50/80 to-transparent" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">
                <Users className="size-3.5 text-teal-700" />
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Customer management
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Customers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Keep customer records organized and give your team a clear view of every relationship.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="relative inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
            >
              Dashboard
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <section className="min-w-0">
            <div className="mb-4 flex items-center gap-3 px-1">
              <div className="flex size-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
                <UserPlus className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-950">
                  {editingCustomer ? "Update customer" : "Add customer"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingCustomer ? "Keep the customer's information up to date." : "Create a customer record in seconds."}
                </p>
              </div>
            </div>
            <CustomerForm
              onCustomerAdded={handleCustomerChanged}
              editingCustomer={editingCustomer}
              onCancelEdit={() => setEditingCustomer(null)}
            />
          </section>

          <CustomerTable refreshKey={refreshKey} onEdit={setEditingCustomer} />
        </section>
      </main>
    </AppLayout>
  );
}

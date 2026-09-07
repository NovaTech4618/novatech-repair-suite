"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";

type Balance = {
  customer_id: string;
  customer_name: string;
  phone: string;
  debit: number;
  credit: number;
  balance: number;
};

const money = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export default function OutstandingPage() {
  const [rows, setRows] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const result = await businessOperationsService.getCustomerBalances();
    if (result.error) {
      setError(result.error.message);
      setRows([]);
    } else {
      setRows((result.data ?? []) as Balance[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      `${row.customer_name} ${row.phone}`.toLowerCase().includes(query),
    );
  }, [rows, q]);

  const total = rows.reduce((sum, row) => sum + Number(row.balance), 0);
  const largest = Math.max(0, ...rows.map((row) => Number(row.balance)));
  const visibleTotal = filtered.reduce((sum, row) => sum + Number(row.balance), 0);

  return (
    <AppLayout>
      <div className="space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
              Receivables
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Outstanding Balances
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              One source of truth for customer debt across the branches you are allowed to see.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Customers owing" value={String(rows.length)} />
          <Stat label="Total outstanding" value={money(total)} />
          <Stat label="Largest balance" value={money(largest)} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Customer ledger</h2>
              <p className="mt-1 text-xs text-slate-500">
                {q.trim() ? `${filtered.length} customers · ${money(visibleTotal)} shown` : "Balances are calculated from the debt ledger."}
              </p>
            </div>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search customer or phone"
              aria-label="Search outstanding customers"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 sm:w-72"
            />
          </div>

          {loading ? (
            <div className="space-y-3 p-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                {q.trim() ? "No customers match that search." : "No outstanding customer balances."}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {q.trim() ? "Try the customer name or phone number." : "Customers with a zero balance are automatically excluded."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3 text-right">Charged</th>
                    <th className="px-5 py-3 text-right">Paid</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.customer_id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-950">{row.customer_name}</td>
                      <td className="px-5 py-4 text-slate-500">{row.phone || "—"}</td>
                      <td className="px-5 py-4 text-right">{money(row.debit)}</td>
                      <td className="px-5 py-4 text-right">{money(row.credit)}</td>
                      <td className="px-5 py-4 text-right font-bold text-amber-700">{money(row.balance)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/customers/${row.customer_id}`}
                          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Open customer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

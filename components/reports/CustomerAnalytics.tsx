"use client";

import { useEffect, useMemo, useState } from "react";
import { reportsService, type CustomerAnalyticsRow, type CustomerRepairRow, type CustomerSaleRow } from "@/services/reportsService";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

type CustomerStat = CustomerAnalyticsRow & {
  spend: number;
  repairs: number;
  sales: number;
  totalActivity: number;
};

export default function CustomerAnalytics({ from, to }: { from: string; to: string }) {
  const [customers, setCustomers] = useState<CustomerAnalyticsRow[]>([]);
  const [sales, setSales] = useState<CustomerSaleRow[]>([]);
  const [repairs, setRepairs] = useState<CustomerRepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const result = await reportsService.getCustomerAnalytics(from, to);
    if (result.error) setError(result.error.message || "Unable to load customer analytics");
    setCustomers(result.customers);
    setSales(result.sales);
    setRepairs(result.repairs);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [from, to]);

  const stats = useMemo(() => {
    const byId = new Map<string, CustomerStat>();
    customers.forEach((customer) => byId.set(customer.id, { ...customer, spend: 0, repairs: 0, sales: 0, totalActivity: 0 }));

    sales.forEach((sale) => {
      if (!sale.customer_id) return;
      const customer = byId.get(sale.customer_id);
      if (!customer) return;
      customer.spend += Number(sale.total || 0);
      customer.sales += 1;
      customer.totalActivity += 1;
    });
    repairs.forEach((repair) => {
      if (!repair.customer_id) return;
      const customer = byId.get(repair.customer_id);
      if (!customer) return;
      customer.spend += Number(repair.final_cost || 0);
      customer.repairs += 1;
      customer.totalActivity += 1;
    });

    const active = [...byId.values()].filter((customer) => customer.totalActivity > 0);
    const newCustomers = customers.filter((customer) => customer.created_at >= from).length;
    const repeatCustomers = active.filter((customer) => customer.totalActivity >= 2).length;
    const revenue = active.reduce((sum, customer) => sum + customer.spend, 0);
    const average = active.length ? revenue / active.length : 0;
    const top = [...active].sort((a, b) => b.spend - a.spend).slice(0, 5);

    return { total: customers.length, active: active.length, newCustomers, repeatCustomers, revenue, average, top };
  }, [customers, sales, repairs, from]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Customer analytics</h2>
          <p className="mt-1 text-xs text-slate-500">Understand customer activity, repeat business and highest-value relationships.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat title="Customers" value={String(stats.total)} />
        <Stat title="Active in period" value={String(stats.active)} />
        <Stat title="New customers" value={String(stats.newCustomers)} />
        <Stat title="Repeat customers" value={String(stats.repeatCustomers)} />
        <Stat title="Tracked value" value={money(stats.revenue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div><h3 className="text-sm font-semibold text-slate-900">Top customers</h3><p className="mt-1 text-xs text-slate-500">Combined recorded sales and repair value in the selected period.</p></div>
            <span className="text-xs text-slate-400">Avg {money(stats.average)}</span>
          </div>
          <div className="mt-4 space-y-2">
            {stats.top.length ? stats.top.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <span className="w-5 text-xs font-bold text-slate-400">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{customer.full_name}</p><p className="text-xs text-slate-500">{customer.repairs} repair{customer.repairs === 1 ? "" : "s"} · {customer.sales} sale{customer.sales === 1 ? "" : "s"}</p></div>
                <strong className="text-sm text-slate-900">{money(customer.spend)}</strong>
              </div>
            )) : <p className="py-5 text-center text-sm text-slate-400">No customer activity in this period.</p>}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Customer health</h3>
          <div className="mt-4 space-y-4 text-sm">
            <Health label="Active rate" value={stats.total ? `${(stats.active / stats.total * 100).toFixed(0)}%` : "0%"} />
            <Health label="Repeat rate" value={stats.active ? `${(stats.repeatCustomers / stats.active * 100).toFixed(0)}%` : "0%"} />
            <Health label="New customer share" value={stats.total ? `${(stats.newCustomers / stats.total * 100).toFixed(0)}%` : "0%"} />
          </div>
          <p className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">Use repeat-customer growth as a retention signal. “Tracked value” combines sales totals and repair final costs; it is not profit.</p>
        </div>
      </div>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>;
}

function Health({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-200 pb-3"><span className="text-slate-600">{label}</span><strong className="text-slate-950">{value}</strong></div>;
}

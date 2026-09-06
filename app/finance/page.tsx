"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  Plus,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { financeService } from "@/services/financeService";
import type { FinancialCategory, FinancialDirection, FinancialTransaction } from "@/types/finance";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const labels: Record<string, string> = {
  sales: "Sales",
  customer_payment: "Customer payment",
  engineer_payment: "Engineer payment",
  repair_payment: "Repair payment",
  part_purchase: "Part purchase",
  salary: "Salary",
  rent: "Rent",
  utility: "Utility",
  other: "Other",
};

const manualCategories: Array<[FinancialCategory, string]> = [
  ["part_purchase", "Part purchase"],
  ["salary", "Salary"],
  ["rent", "Rent"],
  ["utility", "Utility"],
  ["other", "Other"],
];

const methodLabels: Record<string, string> = {
  cash: "Cash",
  transfer: "Transfer",
  pos: "POS",
  other: "Other",
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [direction, setDirection] = useState<FinancialDirection>("out");
  const [category, setCategory] = useState<FinancialCategory>("other");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const result = await financeService.getTransactions();
    if (result.error) setError(result.error.message);
    else setTransactions((result.data ?? []) as FinancialTransaction[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (period === "all") return transactions;
    const now = new Date();
    const start = new Date(now);
    if (period === "day") start.setHours(0, 0, 0, 0);
    if (period === "week") {
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
    }
    if (period === "month") {
      start.setHours(0, 0, 0, 0);
      start.setDate(1);
    }
    if (period === "year") {
      start.setHours(0, 0, 0, 0);
      start.setMonth(0, 1);
    }
    return transactions.filter((item) => new Date(item.occurred_at) >= start);
  }, [transactions, period]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, item) => {
          if (item.direction === "in") acc.in += Number(item.amount);
          else acc.out += Number(item.amount);
          return acc;
        },
        { in: 0, out: 0 },
      ),
    [filtered],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!description.trim()) {
      setError("Enter a description.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const result = await financeService.createTransaction({
      direction,
      category,
      amount: value,
      payment_method: paymentMethod,
      description,
      occurred_at: new Date(occurredAt).toISOString(),
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage("Transaction recorded successfully.");
      setAmount("");
      setDescription("");
      await load();
    }
    setSaving(false);
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-7 p-5 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-50/80 to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">
              <CircleDollarSign className="size-3.5 text-teal-700" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-700">Financial control</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Finance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Track every naira moving through the workshop and keep your cash position clear.
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

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<ArrowDownLeft className="size-5" />}
          label="Money in"
          value={money(totals.in)}
          detail="Income recorded in this period"
          tone="teal"
        />
        <SummaryCard
          icon={<ArrowUpRight className="size-5" />}
          label="Money out"
          value={money(totals.out)}
          detail="Expenses and payouts recorded"
          tone="slate"
        />
        <SummaryCard
          icon={<WalletCards className="size-5" />}
          label="Net movement"
          value={money(totals.in - totals.out)}
          detail={totals.in - totals.out >= 0 ? "Positive cash movement" : "Negative cash movement"}
          tone={totals.in - totals.out >= 0 ? "green" : "red"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
              <Plus className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-slate-950">Record transaction</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Add a manual income or expense that is not created by another workflow.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Direction">
                <select value={direction} onChange={(e) => setDirection(e.target.value as FinancialDirection)} className="finance-control">
                  <option value="out">Money out</option>
                  <option value="in">Money in</option>
                </select>
              </Field>
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value as FinancialCategory)} className="finance-control">
                  {manualCategories.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₦</span>
                  <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="finance-control pl-8" />
                </div>
              </Field>
              <Field label="Payment method">
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="finance-control">
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <Field label="Date & time">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="finance-control pl-10" />
              </div>
            </Field>

            <Field label="Description">
              <input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Shop electricity bill" className="finance-control" />
            </Field>

            <button
              disabled={saving}
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ReceiptText className="size-4" />
              {saving ? "Saving..." : "Record transaction"}
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <Landmark className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-950">Money ledger</h2>
                <p className="mt-1 text-sm text-slate-500">Automatic operational entries and manual transactions.</p>
              </div>
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="finance-filter">
              <option value="day">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Banknote className="size-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-slate-900">No transactions yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Financial activity for this period will appear here as payments, sales, and expenses are recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(item.occurred_at).toLocaleString()}</td>
                      <td className="max-w-[280px] px-5 py-4 font-medium text-slate-900">{item.description}</td>
                      <td className="px-5 py-4 text-slate-600">{labels[item.category] ?? item.category}</td>
                      <td className="px-5 py-4 text-slate-600">{methodLabels[item.payment_method] ?? item.payment_method}</td>
                      <td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${item.direction === "in" ? "text-emerald-700" : "text-slate-900"}`}>
                        <span className="mr-1 text-xs">{item.direction === "in" ? "+" : "−"}</span>
                        {money(Number(item.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
        .finance-control {
          margin-top: 0.375rem;
          display: block;
          width: 100%;
          min-height: 40px;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .finance-control:focus {
          border-color: rgb(13 148 136);
          box-shadow: 0 0 0 3px rgb(20 184 166 / 0.12);
        }
        .finance-filter {
          min-height: 40px;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
        }
        .finance-filter:focus {
          border-color: rgb(13 148 136);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "slate" | "green" | "red";
}) {
  const tones = {
    teal: "border-teal-100 bg-teal-50/60 text-teal-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    red: "border-red-100 bg-red-50/60 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

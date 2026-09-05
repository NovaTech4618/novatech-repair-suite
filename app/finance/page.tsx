"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { financeService } from "@/services/financeService";
import type { FinancialCategory, FinancialDirection, FinancialTransaction } from "@/types/finance";

const money = (value: number) => `₦${Number(value || 0).toLocaleString()}`;
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

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    if (period === "all") return transactions;
    const now = new Date();
    const start = new Date(now);
    if (period === "day") start.setHours(0, 0, 0, 0);
    if (period === "week") { start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6); }
    if (period === "month") { start.setHours(0, 0, 0, 0); start.setDate(1); }
    if (period === "year") { start.setHours(0, 0, 0, 0); start.setMonth(0, 1); }
    return transactions.filter((item) => new Date(item.occurred_at) >= start);
  }, [transactions, period]);

  const totals = useMemo(() => filtered.reduce((acc, item) => {
    if (item.direction === "in") acc.in += Number(item.amount);
    else acc.out += Number(item.amount);
    return acc;
  }, { in: 0, out: 0 }), [filtered]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter a valid amount."); return; }
    if (!description.trim()) { setError("Enter a description."); return; }
    setSaving(true); setError(""); setMessage("");
    const result = await financeService.createTransaction({ direction, category, amount: value, payment_method: paymentMethod, description, occurred_at: new Date(occurredAt).toISOString() });
    if (result.error) setError(result.error.message);
    else { setMessage("Financial transaction recorded successfully."); setAmount(""); setDescription(""); await load(); }
    setSaving(false);
  }

  return <main className="space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Finance</h1><p className="text-muted-foreground">Control money coming into and leaving the shop.</p></div><Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Back to dashboard</Link></div>
    {error && <div className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-md border p-3 text-sm">{message}</div>}

    <div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Money in</p><p className="mt-1 text-2xl font-bold">{money(totals.in)}</p></div><div className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Money out</p><p className="mt-1 text-2xl font-bold">{money(totals.out)}</p></div><div className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Net movement</p><p className="mt-1 text-2xl font-bold">{money(totals.in - totals.out)}</p></div></div>

    <section className="rounded-xl border p-5"><h2 className="font-semibold">Record money movement</h2><p className="mb-4 text-sm text-muted-foreground">Use this for expenses and income that are not automatically recorded by another NOVATECH workflow.</p><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm">Direction<select value={direction} onChange={(e) => setDirection(e.target.value as FinancialDirection)} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="out">Money out</option><option value="in">Money in</option></select></label>
      <label className="text-sm">Category<select value={category} onChange={(e) => setCategory(e.target.value as FinancialCategory)} className="mt-1 w-full rounded-md border bg-background p-2.5">{manualCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm">Amount<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
      <label className="text-sm">Payment method<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>
      <label className="text-sm">Date & time<input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
      <label className="text-sm">Description<input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Shop electricity bill" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
      <button disabled={saving} type="submit" className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-50 md:w-fit">{saving ? "Saving..." : "Record transaction"}</button>
    </form></section>

    <section className="rounded-xl border"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-semibold">Money ledger</h2><p className="text-sm text-muted-foreground">Manual shop-wide financial movements plus automatic operational entries.</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option><option value="all">All time</option></select></div>
      {loading ? <p className="p-8 text-center text-muted-foreground">Loading ledger...</p> : filtered.length === 0 ? <p className="p-8 text-center text-muted-foreground">No financial transactions in this period.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Method</th><th className="p-3 text-right">In</th><th className="p-3 text-right">Out</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="whitespace-nowrap p-3">{new Date(item.occurred_at).toLocaleString()}</td><td className="p-3">{item.description}</td><td className="p-3">{labels[item.category] ?? item.category}</td><td className="p-3 capitalize">{item.payment_method}</td><td className="p-3 text-right">{item.direction === "in" ? money(Number(item.amount)) : "—"}</td><td className="p-3 text-right">{item.direction === "out" ? money(Number(item.amount)) : "—"}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

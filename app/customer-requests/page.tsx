"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Plus, Search } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { customerRequestService } from "@/services/customerRequestService";
import { supabase } from "@/lib/supabase";
import type { CustomerRequest, CustomerRequestPriority, CustomerRequestStatus } from "@/types/customerRequest";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
const statuses: CustomerRequestStatus[] = ["pending", "sourcing", "available", "fulfilled", "cancelled"];
const priorities: CustomerRequestPriority[] = ["low", "normal", "high", "urgent"];

export default function CustomerRequestsPage() {
  const [rows, setRows] = useState<CustomerRequest[]>([]);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; phone: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | CustomerRequestStatus>("all");
  const [item, setItem] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<CustomerRequestPriority>("normal");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [requests, customerRows] = await Promise.all([
      customerRequestService.getAll(),
      supabase.from("customers").select("id,full_name,phone").order("full_name"),
    ]);
    if (requests.error) setError(requests.error.message);
    setRows((requests.data ?? []) as CustomerRequest[]);
    setCustomers(customerRows.data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!item.trim()) { setError("Write what the customer is looking for."); return; }
    setSaving(true); setError("");
    const result = await customerRequestService.create({
      customer_id: customerId || null,
      requested_item: item,
      details,
      priority,
      quoted_price: price ? Number(price) : null,
      contact_customer: true,
    });
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setItem(""); setCustomerId(""); setDetails(""); setPriority("normal"); setPrice("");
    await load(); setSaving(false);
  }

  async function changeStatus(id: string, next: CustomerRequestStatus) {
    const result = await customerRequestService.updateStatus(id, next);
    if (result.error) { setError(result.error.message); return; }
    await load();
  }

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matches = !q || r.requested_item.toLowerCase().includes(q) || r.details?.toLowerCase().includes(q) || r.customers?.full_name?.toLowerCase().includes(q);
    return matches && (status === "all" || r.status === status);
  }), [rows, search, status]);

  const pending = rows.filter((r) => ["pending", "sourcing"].includes(r.status)).length;
  const available = rows.filter((r) => r.status === "available").length;

  return <AppLayout><main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-teal-700">Customer demand</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Customer Requests</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Record things customers ask for when the shop does not currently have them. Turn missed requests into a sourcing list instead of forgetting them.</p></div></header>

    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Needs attention" value={String(pending)} hint="Pending or being sourced"/><Metric label="Ready to contact" value={String(available)} hint="Item/service found"/><Metric label="All requests" value={String(rows.length)} hint="Demand captured"/></section>

    <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Plus className="size-4"/></div><div><h2 className="font-semibold text-slate-950">Capture a request</h2><p className="text-xs text-slate-500">Example: “iPhone 13 Pro Max back glass — customer wants us to source it.”</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-5"><Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="What does the customer need?"/><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Walk-in / no customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.phone ? ` · ${c.phone}` : ""}</option>)}</select><select value={priority} onChange={(e) => setPriority(e.target.value as CustomerRequestPriority)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">{priorities.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} priority</option>)}</select><Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" placeholder="Expected price ₦ (optional)"/><Button disabled={saving} onClick={() => void create()}>{saving ? "Saving…" : "Save request"}</Button></div><textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Extra details: model, colour, quantity, customer's deadline, alternative part, supplier preference…" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500"/>{error && <p className="mt-2 text-sm text-rose-600">{error}</p>}</CardContent></Card>

    <Card className="overflow-hidden border-slate-200 shadow-sm"><CardContent className="p-0"><div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search request or customer..." className="h-10 bg-white pl-9"/></div><select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>{filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-500"><BellRing className="mx-auto size-8 text-slate-300"/><p className="mt-3 font-medium text-slate-700">No customer requests</p></div> : <div className="divide-y divide-slate-100">{filtered.map((r) => <div key={r.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{r.requested_item}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-600">{r.priority}</span><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-teal-700">{r.status}</span></div><p className="mt-1 text-sm text-slate-500">{r.customers?.full_name ?? "Walk-in customer"}{r.customers?.phone ? ` · ${r.customers.phone}` : ""}</p>{r.details && <p className="mt-2 max-w-3xl text-sm text-slate-600">{r.details}</p>}{r.quoted_price != null && <p className="mt-2 text-xs font-semibold text-slate-700">Expected price: {money(r.quoted_price)}</p>}</div><select value={r.status} onChange={(e) => void changeStatus(r.id, e.target.value as CustomerRequestStatus)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm lg:w-40">{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>)}</div>}</CardContent></Card>
  </main></AppLayout>;
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) { return <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></CardContent></Card>; }

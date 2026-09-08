"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, RefreshCw, Search, Send, Smartphone } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { customerBalanceMessage, customerGeneralMessage, openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type Balance = { customer_id: string; customer_name: string; phone: string; debit: number; credit: number; balance: number };
type Template = "general" | "balance" | "ready" | "payment";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const templates: { id: Template; label: string; description: string }[] = [
  { id: "balance", label: "Payment reminder", description: "Remind a customer about an outstanding balance." },
  { id: "ready", label: "Repair ready", description: "Let a customer know their device is ready for pickup." },
  { id: "payment", label: "Payment received", description: "Confirm that a payment has been received." },
  { id: "general", label: "General message", description: "Start a normal conversation with a customer." },
];

function messageFor(template: Template, customer: Balance) {
  switch (template) {
    case "balance": return customerBalanceMessage(customer.customer_name, customer.balance);
    case "ready": return `Hello ${customer.customer_name}, good news! Your device repair is ready for pickup at our workshop. Please let us know when you will be coming. Thank you.`;
    case "payment": return `Hello ${customer.customer_name}, we confirm that your payment has been received. Thank you for choosing our workshop.`;
    default: return customerGeneralMessage(customer.customer_name);
  }
}

export default function WhatsAppCenterPage() {
  const [rows, setRows] = useState<Balance[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [template, setTemplate] = useState<Template>("balance");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const result = await businessOperationsService.getCustomerBalances();
    if (result.error) toast.error(result.error.message);
    else setRows((result.data ?? []) as Balance[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.customer_name} ${row.phone}`.toLowerCase().includes(q));
  }, [rows, query]);

  const selected = rows.find((row) => row.customer_id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setMessage(messageFor(template, selected));
    else setMessage("");
  }, [selected, template]);

  function send() {
    if (!selected) { toast.error("Select a customer first."); return; }
    if (!selected.phone) { toast.error("This customer has no phone number."); return; }
    if (!message.trim()) { toast.error("Write a message first."); return; }
    if (openWhatsApp(selected.phone, message.trim())) toast.success(`WhatsApp opened for ${selected.customer_name}.`);
    else toast.error("Unable to open WhatsApp.");
  }

  return <AppLayout><div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Customer communication</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">WhatsApp Center</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Keep customer conversations close to the repair workflow. Choose a customer, use a template, edit the message, and send it through WhatsApp.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="size-4" />{loading ? "Refreshing…" : "Refresh"}</button>
    </header>

    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Customers owing" value={String(rows.length)} /><Stat label="Outstanding" value={money(rows.reduce((sum, row) => sum + Number(row.balance), 0))} /><Stat label="Ready to message" value={String(rows.filter((row) => Boolean(row.phone)).length)} /></div>

    <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-950">Customers</h2><p className="mt-1 text-xs text-slate-500">Customers with outstanding balances appear first.</p><div className="relative mt-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or phone" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500" /></div></div>
        <div className="max-h-[520px] overflow-y-auto p-2">
          {loading ? <div className="space-y-2 p-3">{[1,2,3,4].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No customers match your search.</div> : filtered.map((row) => <button type="button" key={row.customer_id} onClick={() => setSelectedId(row.customer_id)} className={`w-full rounded-xl p-3 text-left transition ${selectedId === row.customer_id ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50"}`}><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Smartphone className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{row.customer_name}</p><p className="truncate text-xs text-slate-500">{row.phone || "No phone number"}</p></div><div className="text-right">{Number(row.balance) > 0 && <p className="text-xs font-bold text-amber-700">{money(row.balance)}</p>}{row.phone && <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">WhatsApp</p>}</div></div></button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><MessageCircle className="size-5" /></div><div><h2 className="font-semibold text-slate-950">Compose message</h2><p className="text-xs text-slate-500">{selected ? `To ${selected.customer_name}` : "Select a customer to begin"}</p></div></div></div>
        <div className="space-y-5 p-5">
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message template</label><div className="grid gap-2 sm:grid-cols-2">{templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-xl border p-3 text-left ${template === item.id ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p></button>)}</div></div>
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="whatsapp-message">Message</label><textarea id="whatsapp-message" value={message} onChange={(e) => setMessage(e.target.value)} disabled={!selected} rows={8} placeholder="Your message will appear here…" className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-teal-500 disabled:bg-slate-50" /></div>
          {selected && <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">Phone:</span> {selected.phone || "No phone number"}{Number(selected.balance) > 0 && <><span className="mx-2">•</span><span className="font-semibold text-amber-700">Outstanding: {money(selected.balance)}</span></>}</div>}
          <button type="button" onClick={send} disabled={!selected || !selected.phone} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" />Open WhatsApp & Send</button>
          <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-400"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />WhatsApp opens with the message pre-filled. You still review and send it from WhatsApp.</p>
        </div>
      </section>
    </div>

    <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">Need the full customer record?</p><p className="mt-1 text-sm text-slate-500">Open the customer directory to view devices, repairs, payments and account history.</p></div><Link href="/customers" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open Customers</Link></div></div>
  </div></AppLayout>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }

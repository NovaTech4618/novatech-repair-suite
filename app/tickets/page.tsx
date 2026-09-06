"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock3, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/supabase";
import { repairService } from "@/services/repairService";
import { ticketService } from "@/services/ticketService";

type TicketRow = {
  id: string;
  ticket_number: string;
  issued_at: string;
  status: string;
  repair_id: string;
  device_id: string;
  device: string;
  customer: string;
  phone: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    await getCurrentSession();
    const { data, error } = await repairService.getAllRepairs();
    setLoading(false);
    if (error) { toast.error("Could not load pickup tickets."); return; }
    const rows: TicketRow[] = [];
    for (const repair of (data ?? []) as any[]) {
      const ticket = repair.repair_tickets?.[0];
      if (!ticket) continue;
      const device = repair.devices;
      rows.push({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        issued_at: ticket.issued_at,
        status: repair.status,
        repair_id: repair.id,
        device_id: repair.device_id,
        device: `${device?.brand ?? "Unknown"} ${device?.model ?? "device"}`,
        customer: device?.customers?.full_name ?? "Unknown customer",
        phone: "",
      });
    }
    setTickets(rows);
  }

  useEffect(() => { void load(); }, []);

  async function collect(ticket: TicketRow) {
    if (ticket.status === "Collected") return;
    if (!confirm(`Mark ${ticket.ticket_number} as collected?`)) return;
    setCollecting(ticket.id);
    const { error } = await ticketService.markCollected(ticket.repair_id);
    setCollecting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ticket.ticket_number} marked as collected.`);
    await load();
  }

  const filtered = useMemo(() => tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    const matches = !q || t.ticket_number.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.device.toLowerCase().includes(q);
    return matches && (filter === "all" || (filter === "ready" ? t.status === "Completed" : t.status === "Collected"));
  }), [tickets, search, filter]);

  const ready = tickets.filter((t) => t.status === "Completed").length;
  const collected = tickets.filter((t) => t.status === "Collected").length;

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">Front desk operations</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Pickup Tickets</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Find completed repairs quickly, verify the job, print the ticket and close the collection.</p>
          </div>
          <Link href="/repairs" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><ClipboardList className="size-4" />View repairs</Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric icon={<Clock3 className="size-4" />} label="Ready for pickup" value={String(ready)} hint="Completed jobs awaiting customer" />
          <Metric icon={<CheckCircle2 className="size-4" />} label="Collected" value={String(collected)} hint="Closed pickup tickets" />
          <Metric icon={<ClipboardList className="size-4" />} label="Total tickets" value={String(tickets.length)} hint="Issued pickup tickets" />
        </section>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, customer or device..." className="h-11 rounded-xl pl-9" /></div>
                <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                  {[["all","All"],["ready","Ready"],["collected","Collected"]].map(([value,label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{filtered.length} {filtered.length === 1 ? "ticket" : "tickets"}</p>
            </div>

            {loading ? <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-xl bg-slate-100"/><div className="h-16 animate-pulse rounded-xl bg-slate-100"/><div className="h-16 animate-pulse rounded-xl bg-slate-100"/></div> : filtered.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><ClipboardList className="size-9 text-slate-300"/><h2 className="mt-4 font-heading text-lg font-semibold text-slate-900">No pickup tickets</h2><p className="mt-1 max-w-md text-sm text-slate-500">Tickets appear automatically when a repair is completed.</p></div> : <div className="divide-y divide-slate-100">
              {filtered.map((ticket) => <div key={ticket.id} className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/70 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><ClipboardList className="size-5"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-bold text-slate-950">{ticket.ticket_number}</span><Badge variant={ticket.status === "Collected" ? "secondary" : "default"}>{ticket.status === "Collected" ? "Collected" : "Ready"}</Badge></div><p className="mt-1 font-semibold text-slate-800">{ticket.device}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><UserRound className="size-3.5"/>{ticket.customer}</p><p className="mt-1 text-[11px] text-slate-400">Issued {new Date(ticket.issued_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p></div></div>
                <div className="flex flex-wrap gap-2 lg:justify-end"><Button variant="outline" render={<Link href={`/tickets/${ticket.id}`} />}>Open ticket</Button>{ticket.status === "Completed" && <Button disabled={collecting === ticket.id} onClick={() => void collect(ticket)}>{collecting === ticket.id ? "Collecting..." : "Mark collected"}</Button>}</div>
              </div>)}
            </div>}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</div><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 font-heading text-2xl font-bold text-slate-950">{value}</p></div></div><p className="mt-3 text-xs text-slate-400">{hint}</p></CardContent></Card>;
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, Phone, Printer, Smartphone, UserRound, Wrench } from "lucide-react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { ticketService } from "@/services/ticketService";
import PrintButton from "@/components/tickets/PrintButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  async function fetchTicket() {
    setLoading(true);
    await getCurrentSession();
    const { data, error } = await ticketService.getTicketById(params.id);
    setLoading(false);
    if (error || !data) { toast.error("Ticket not found."); return; }
    setData(data);
  }

  useEffect(() => { if (params.id) void fetchTicket(); }, [params.id]);

  async function markCollected() {
    const repair = Array.isArray(data?.repairs) ? data.repairs[0] : data?.repairs;
    if (!repair?.id || repair.status === "Collected") return;
    if (!confirm(`Mark ${data.ticket_number} as collected?`)) return;
    setCollecting(true);
    const { error } = await ticketService.markCollected(repair.id);
    setCollecting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Device marked as collected.");
    await fetchTicket();
  }

  if (loading) return <AppShell><div className="space-y-4"><div className="h-5 w-32 animate-pulse rounded bg-slate-100"/><div className="h-44 animate-pulse rounded-2xl bg-slate-100"/><div className="grid gap-4 md:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-slate-100"/><div className="h-56 animate-pulse rounded-2xl bg-slate-100"/></div></div></AppShell>;
  if (!data) return <AppShell><Card><CardContent className="flex min-h-64 items-center justify-center text-slate-500">Ticket not found.</CardContent></Card></AppShell>;

  const repair = Array.isArray(data.repairs) ? data.repairs[0] : data.repairs;
  const device = Array.isArray(repair?.devices) ? repair.devices[0] : repair?.devices;
  const customer = Array.isArray(device?.customers) ? device.customers[0] : device?.customers;
  const company = Array.isArray(repair?.companies) ? repair.companies[0] : repair?.companies;
  const total = Number(repair?.final_cost ?? repair?.estimated_cost ?? 0);
  const deposit = Number(repair?.deposit ?? 0);
  const balance = Math.max(total - deposit, 0);
  const collected = repair?.status === "Collected";

  return <AppShell>
    <main className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"><ArrowLeft className="size-4"/>Back to tickets</Link>
        <PrintButton />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><Badge variant={collected ? "secondary" : "default"}>{collected ? "Collected" : "Ready for pickup"}</Badge><span className="font-mono text-xs font-semibold text-slate-500">Issued {new Date(data.issued_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span></div><p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{data.ticket_number}</p><p className="mt-1 text-sm text-slate-500">{company?.name || "Novatech Repair Suite"} · Pickup ticket</p></div>
            <div className="flex flex-wrap gap-2 print:hidden">{repair?.id && <Button variant="outline" render={<Link href={`/repairs/${repair.id}`} />}><Wrench className="size-4"/>Open repair</Button>}{!collected && <Button disabled={collecting} onClick={() => void markCollected()}><CheckCircle2 className="size-4"/>{collecting ? "Updating..." : "Mark collected"}</Button>}</div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="font-heading text-lg">Customer & device</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info icon={<UserRound className="size-4"/>} label="Customer" value={customer?.full_name || "-"}/><Info icon={<Phone className="size-4"/>} label="Phone" value={customer?.phone || "-"}/><Info icon={<Smartphone className="size-4"/>} label="Device" value={`${device?.brand || ""} ${device?.model || ""}`.trim() || "-"}/><Info icon={<ClipboardList className="size-4"/>} label="Serial number" value={device?.serial_number || "-"}/></CardContent></Card>
            <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="font-heading text-lg">Repair summary</CardTitle></CardHeader><CardContent className="space-y-5"><Detail label="Customer issue" value={repair?.issue}/><Detail label="Diagnosis" value={repair?.diagnosis}/><Detail label="Solution / work performed" value={repair?.solution}/><Detail label="Technician" value={repair?.technician}/></CardContent></Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-teal-100 bg-teal-50/50 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 size-5 ${collected ? "text-slate-500" : "text-teal-700"}`}/><div><p className="font-semibold text-slate-900">{collected ? "Collection completed" : "Ready for collection"}</p><p className="mt-1 text-sm text-slate-600">{collected ? "This device has been marked as collected." : "Verify the customer and device before closing the pickup."}</p></div></div></CardContent></Card>
            <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="font-heading text-lg">Payment summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Line label="Final cost" value={money(total)}/><Line label="Deposit" value={money(deposit)}/><div className="border-t border-slate-100 pt-3"><Line label="Balance due" value={money(balance)} strong/></div></CardContent></Card>
            <Card className="border-slate-200 shadow-none print:hidden"><CardContent className="p-5"><p className="text-sm font-semibold text-slate-900">Collection checklist</p><ul className="mt-3 space-y-2 text-sm text-slate-600"><li>✓ Confirm ticket number</li><li>✓ Confirm customer identity</li><li>✓ Match device details</li><li>✓ Confirm payment/balance</li><li>✓ Mark device collected</li></ul></CardContent></Card>
          </aside>
        </div>
        <div className="border-t border-slate-100 px-6 py-5 text-center text-xs text-slate-500 sm:px-8">Please present this ticket when collecting your device. Keep this ticket for your records.</div>
      </section>
    </main>
  </AppShell>;
}

function AppShell({ children }: { children: React.ReactNode }) { return <AppLayout>{children}</AppLayout>; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div><div className="flex items-center gap-2 text-xs font-medium text-slate-400">{icon}{label}</div><p className="mt-1 font-semibold text-slate-900">{value}</p></div>; }
function Detail({ label, value }: { label: string; value?: string | null }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || "Not recorded"}</p></div>; }
function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4"><span className="text-slate-500">{label}</span><span className={strong ? "font-bold text-slate-950" : "font-semibold text-slate-800"}>{value}</span></div>; }
function money(value: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value); }

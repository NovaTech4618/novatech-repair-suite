"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, CreditCard, Package, Search, Wrench } from "lucide-react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { repairService } from "@/services/repairService";
import { repairPaymentService } from "@/services/repairPaymentService";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type RepairRow = {
  id: string;
  device_id: string;
  issue: string;
  status: string;
  priority: string;
  created_at: string;
  deposit: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  devices: { brand: string; model: string; customers: { full_name: string } | null } | null;
  repair_tickets: { id: string; ticket_number: string }[] | null;
};

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

function statusVariant(status: string) {
  if (status === "Completed" || status === "Collected") return "default";
  if (status === "Repairing" || status === "Testing") return "secondary";
  return "outline";
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [paymentRepairId, setPaymentRepairId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchRepairs(); }, []);

  async function fetchRepairs() {
    setLoading(true);
    await getCurrentSession();
    const { data, error } = await repairService.getAllRepairs();
    setLoading(false);
    if (error) { toast.error("Failed to load repairs."); return; }
    setRepairs((data as unknown as RepairRow[]) || []);
  }

  function openPayment(id: string) {
    setPaymentRepairId((current) => (current === id ? null : id));
    setPaymentAmount("");
    setPaymentMethod("Cash");
  }

  async function handleComplete(id: string) {
    if (!confirm("Mark this repair as completed and issue a pickup ticket?")) return;
    setCompletingId(id);
    const { data, error } = await repairService.completeRepair(id);
    setCompletingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Repair completed! Ticket ${data?.ticket_number} issued.`);
    await fetchRepairs();
  }

  async function handlePayment(repair: RepairRow) {
    const amount = Number(paymentAmount);
    const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0);
    const paid = Number(repair.deposit ?? 0);
    const balance = Math.max(total - paid, 0);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a valid payment amount."); return; }
    if (amount > balance) { toast.error(`Payment cannot exceed ${money(balance)}.`); return; }
    setPaying(true);
    const { error } = await repairPaymentService.recordPayment(repair.id, amount, paymentMethod);
    setPaying(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${money(amount)} payment recorded.`);
    setPaymentRepairId(null);
    await fetchRepairs();
  }

  const filtered = useMemo(() => repairs.filter((repair) => {
    const query = search.trim().toLowerCase();
    const device = repair.devices;
    const customer = device?.customers;
    const matchesSearch = !query || repair.issue.toLowerCase().includes(query) || device?.brand?.toLowerCase().includes(query) || device?.model?.toLowerCase().includes(query) || customer?.full_name?.toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "all" || repair.status === statusFilter);
  }), [repairs, search, statusFilter]);

  const metrics = useMemo(() => {
    const active = repairs.filter((r) => !["Completed", "Collected"].includes(r.status)).length;
    const completed = repairs.filter((r) => ["Completed", "Collected"].includes(r.status)).length;
    const value = repairs.reduce((sum, r) => sum + Number(r.final_cost ?? r.estimated_cost ?? 0), 0);
    const outstanding = repairs.reduce((sum, r) => Math.max(Number(r.final_cost ?? r.estimated_cost ?? 0) - Number(r.deposit ?? 0), 0) + sum, 0);
    return { active, completed, value, outstanding };
  }, [repairs]);

  const statusOptions = ["all", "Received", "Diagnosis", "Estimate Sent", "Customer Approved", "Repairing", "Testing", "Completed", "Collected"];

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">Workshop operations</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Repairs</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Manage the repair pipeline, payments, balances and parts from one workspace.</p>
          </div>
          <Link href="/devices" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"><Wrench className="size-4" />Start from a device</Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Wrench className="size-4" />} label="Active repairs" value={metrics.active.toString()} hint="Currently in workflow" />
          <Metric icon={<ClipboardList className="size-4" />} label="Completed" value={metrics.completed.toString()} hint="Completed or collected" />
          <Metric icon={<CreditCard className="size-4" />} label="Repair value" value={money(metrics.value)} hint="Estimated / final total" />
          <Metric icon={<CreditCard className="size-4" />} label="Outstanding" value={money(metrics.outstanding)} hint="Customer balances" />
        </section>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search customer, device or issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl border-slate-200 bg-white pl-9" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 xl:w-56">
                  {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
                </select>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} {filtered.length === 1 ? "repair" : "repairs"}</span>{(search || statusFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="font-semibold text-teal-700 hover:text-teal-800">Clear filters</button>}</div>
            </div>

            {loading ? <div className="space-y-3 p-5"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div> : filtered.length === 0 ? <EmptyState hasFilters={Boolean(search || statusFilter !== "all")} /> : <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader><TableRow className="bg-white"><TableHead>Device</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Balance</TableHead><TableHead>Ticket</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((repair) => <RepairTableRow key={repair.id} repair={repair} paymentRepairId={paymentRepairId} paymentAmount={paymentAmount} paymentMethod={paymentMethod} paying={paying} completingId={completingId} setPaymentAmount={setPaymentAmount} setPaymentMethod={setPaymentMethod} openPayment={openPayment} onPayment={handlePayment} onComplete={handleComplete} />)}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 p-3 md:hidden sm:p-4">{filtered.map((repair) => <RepairMobileCard key={repair.id} repair={repair} paymentRepairId={paymentRepairId} paymentAmount={paymentAmount} paymentMethod={paymentMethod} paying={paying} completingId={completingId} setPaymentAmount={setPaymentAmount} setPaymentMethod={setPaymentMethod} openPayment={openPayment} onPayment={handlePayment} onComplete={handleComplete} />)}</div>
            </>}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</div><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 truncate font-heading text-xl font-bold text-slate-950">{value}</p></div></div><p className="mt-3 text-xs text-slate-400">{hint}</p></CardContent></Card>;
}

function RepairTableRow({ repair, paymentRepairId, paymentAmount, paymentMethod, paying, completingId, setPaymentAmount, setPaymentMethod, openPayment, onPayment, onComplete }: any) {
  const device = repair.devices; const customer = device?.customers; const ticket = repair.repair_tickets?.[0];
  const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0); const paid = Number(repair.deposit ?? 0); const balance = Math.max(total - paid, 0); const paymentOpen = paymentRepairId === repair.id; const done = ["Completed", "Collected"].includes(repair.status);
  return <TableRow className="align-top"><TableCell className="py-4"><Link href={`/devices/${repair.device_id}`} className="font-semibold text-slate-900 hover:text-teal-700">{device?.brand} {device?.model}</Link><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{repair.issue}</p></TableCell><TableCell className="py-4 text-sm text-slate-700">{customer?.full_name || "—"}</TableCell><TableCell className="py-4"><Badge variant={statusVariant(repair.status)}>{repair.status}</Badge><p className="mt-1 text-[11px] text-slate-400">{paid > 0 ? "Partially paid" : "Unpaid"}</p></TableCell><TableCell className="py-4 text-sm font-semibold">{money(total)}</TableCell><TableCell className={`py-4 text-sm font-bold ${balance > 0 ? "text-slate-900" : "text-slate-400"}`}>{money(balance)}</TableCell><TableCell className="py-4">{ticket ? <Link href={`/tickets/${ticket.id}`} className="text-sm font-semibold text-teal-700 hover:underline">{ticket.ticket_number}</Link> : "—"}</TableCell><TableCell className="min-w-[310px] py-4"><div className="flex justify-end gap-2"><Link href={`/repairs/${repair.id}/parts`}><Button size="sm" variant="outline"><Package className="mr-1.5 size-3.5" />Parts</Button></Link>{balance > 0 && <Button size="sm" variant="secondary" onClick={() => openPayment(repair.id)}>{paymentOpen ? "Close" : "Payment"}</Button>}{!done && <Button size="sm" onClick={() => onComplete(repair.id)} disabled={completingId === repair.id}>{completingId === repair.id ? "Completing..." : "Complete"}</Button>}</div>{paymentOpen && balance > 0 && <PaymentForm repair={repair} balance={balance} amount={paymentAmount} method={paymentMethod} saving={paying} setAmount={setPaymentAmount} setMethod={setPaymentMethod} onSubmit={onPayment} />}</TableCell></TableRow>;
}

function RepairMobileCard({ repair, paymentRepairId, paymentAmount, paymentMethod, paying, completingId, setPaymentAmount, setPaymentMethod, openPayment, onPayment, onComplete }: any) {
  const device = repair.devices; const customer = device?.customers; const ticket = repair.repair_tickets?.[0]; const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0); const paid = Number(repair.deposit ?? 0); const balance = Math.max(total - paid, 0); const paymentOpen = paymentRepairId === repair.id; const done = ["Completed", "Collected"].includes(repair.status);
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/devices/${repair.device_id}`} className="block truncate font-semibold text-slate-950 hover:text-teal-700">{device?.brand} {device?.model}</Link><p className="mt-1 line-clamp-2 text-sm text-slate-500">{repair.issue}</p></div><Badge className="shrink-0" variant={statusVariant(repair.status)}>{repair.status}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3"><Info label="Customer" value={customer?.full_name || "—"} /><Info label="Ticket" value={ticket?.ticket_number || "—"} /><Info label="Total" value={money(total)} /><Info label="Balance" value={money(balance)} /></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Link href={`/repairs/${repair.id}/parts`} className="flex-1"><Button type="button" variant="outline" className="w-full"><Package className="mr-1.5 size-4" />Parts Used</Button></Link>{balance > 0 && <Button type="button" variant="secondary" className="flex-1" onClick={() => openPayment(repair.id)}>{paymentOpen ? "Close Payment" : "Record Payment"}</Button>}{!done && <Button type="button" className="flex-1" onClick={() => onComplete(repair.id)} disabled={completingId === repair.id}>{completingId === repair.id ? "Completing..." : "Complete"}</Button>}</div>{paymentOpen && balance > 0 && <PaymentForm repair={repair} balance={balance} amount={paymentAmount} method={paymentMethod} saving={paying} setAmount={setPaymentAmount} setMethod={setPaymentMethod} onSubmit={onPayment} />}</article>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div>; }

function PaymentForm({ repair, balance, amount, method, saving, setAmount, setMethod, onSubmit }: any) {
  return <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Outstanding</span><span className="font-bold text-slate-900">{money(balance)}</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-xs font-medium text-slate-600">Amount</label><Input type="number" inputMode="decimal" min="0.01" max={balance} step="0.01" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 bg-white" /></div><div><label className="mb-1 block text-xs font-medium text-slate-600">Method</label><select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-400"><option>Cash</option><option>Transfer</option><option>POS</option><option>Other</option></select></div></div><Button type="button" className="mt-3 h-10 w-full" disabled={saving} onClick={() => onSubmit(repair)}>{saving ? "Recording..." : `Confirm ${money(Number(amount) || 0)} payment`}</Button></div>;
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Wrench className="size-5" /></div><h2 className="mt-4 font-heading text-lg font-semibold text-slate-900">{hasFilters ? "No matching repairs" : "No repairs yet"}</h2><p className="mt-1 max-w-sm text-sm text-slate-500">{hasFilters ? "Try a different search or status filter." : "Start a repair from a registered customer device."}</p>{!hasFilters && <Link href="/devices" className="mt-4 text-sm font-semibold text-teal-700 hover:underline">View devices</Link>}</div>; }

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { repairService } from "@/services/repairService";
import { repairPaymentService } from "@/services/repairPaymentService";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function statusVariant(status: string) {
  if (status === "Completed" || status === "Collected") return "default";
  if (status === "Repairing" || status === "Testing") return "secondary";
  return "outline";
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
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

  useEffect(() => { void fetchRepairs(); }, []);

  async function fetchRepairs() {
    await getCurrentSession();
    const { data, error } = await repairService.getAllRepairs();
    if (error) { toast.error("Failed to load repairs."); return; }
    setRepairs((data as unknown as RepairRow[]) || []);
  }

  function openPayment(repairId: string) {
    setPaymentRepairId((current) => (current === repairId ? null : repairId));
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
    const totalCost = Number(repair.final_cost ?? repair.estimated_cost ?? 0);
    const paid = Number(repair.deposit ?? 0);
    const outstanding = Math.max(totalCost - paid, 0);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a valid payment amount."); return; }
    if (amount > outstanding) { toast.error(`Payment cannot exceed the outstanding ${money(outstanding)}.`); return; }
    setPaying(true);
    const { error } = await repairPaymentService.recordPayment(repair.id, amount, paymentMethod);
    setPaying(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${money(amount)} payment recorded.`);
    setPaymentRepairId(null); setPaymentAmount(""); setPaymentMethod("Cash");
    await fetchRepairs();
  }

  const filtered = useMemo(() => repairs.filter((repair) => {
    const device = repair.devices;
    const customer = device?.customers;
    const query = search.trim().toLowerCase();
    const matchesSearch = repair.issue.toLowerCase().includes(query) || device?.brand?.toLowerCase().includes(query) || device?.model?.toLowerCase().includes(query) || customer?.full_name?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [repairs, search, statusFilter]);

  const statusOptions = ["all", "Received", "Diagnosis", "Estimate Sent", "Customer Approved", "Repairing", "Testing", "Completed", "Collected"];

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-1 sm:space-y-6 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">All Repairs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track repair revenue, customer payments, and outstanding balances.</p>
        </div>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row">
              <Input placeholder="🔍 Search by device, customer, or issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 min-w-0 flex-1" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm outline-none sm:w-auto">
                {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No repairs found.</p> : <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Ticket #</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((repair) => {
                      const device = repair.devices; const customer = device?.customers; const ticket = repair.repair_tickets?.[0];
                      const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0); const paid = Number(repair.deposit ?? 0); const balance = Math.max(total - paid, 0);
                      const isDone = repair.status === "Completed" || repair.status === "Collected"; const paymentOpen = paymentRepairId === repair.id;
                      return <TableRow key={repair.id}>
                        <TableCell><Link href={`/devices/${repair.device_id}`} className="font-medium text-blue-600 hover:underline">{device?.brand} {device?.model}</Link><div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{repair.issue}</div></TableCell>
                        <TableCell>{customer?.full_name || "-"}</TableCell>
                        <TableCell><Badge variant={statusVariant(repair.status)}>{repair.status}</Badge><div className="mt-1 text-xs text-muted-foreground">{balance === 0 && total > 0 ? "Paid" : paid > 0 ? "Partially paid" : "Unpaid"}</div></TableCell>
                        <TableCell>{money(total)}</TableCell><TableCell>{money(paid)}</TableCell>
                        <TableCell className={balance > 0 ? "font-semibold" : "text-muted-foreground"}>{money(balance)}</TableCell>
                        <TableCell>{ticket ? <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:underline">{ticket.ticket_number}</Link> : "-"}</TableCell>
                        <TableCell className="min-w-[300px]">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline"><Link href={`/repairs/${repair.id}/parts`}>Parts Used</Link></Button>
                            {balance > 0 && <Button size="sm" variant="secondary" onClick={() => openPayment(repair.id)}>{paymentOpen ? "Close" : "Record Payment"}</Button>}
                            {!isDone && <Button size="sm" onClick={() => handleComplete(repair.id)} disabled={completingId === repair.id}>{completingId === repair.id ? "Completing..." : "Mark Completed"}</Button>}
                          </div>
                          {paymentOpen && balance > 0 && <PaymentForm repair={repair} balance={balance} amount={paymentAmount} method={paymentMethod} saving={paying} setAmount={setPaymentAmount} setMethod={setPaymentMethod} onSubmit={handlePayment} />}
                        </TableCell>
                      </TableRow>;
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {filtered.map((repair) => {
                  const device = repair.devices; const customer = device?.customers; const ticket = repair.repair_tickets?.[0];
                  const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0); const paid = Number(repair.deposit ?? 0); const balance = Math.max(total - paid, 0);
                  const isDone = repair.status === "Completed" || repair.status === "Collected"; const paymentOpen = paymentRepairId === repair.id;
                  return <div key={repair.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/devices/${repair.device_id}`} className="block truncate font-semibold text-blue-600 hover:underline">{device?.brand} {device?.model}</Link><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{repair.issue}</p></div><Badge className="shrink-0" variant={statusVariant(repair.status)}>{repair.status}</Badge></div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Customer</p><p className="mt-0.5 truncate font-medium">{customer?.full_name || "-"}</p></div><div><p className="text-xs text-muted-foreground">Ticket</p>{ticket ? <Link href={`/tickets/${ticket.id}`} className="mt-0.5 block truncate font-medium text-blue-600 hover:underline">{ticket.ticket_number}</Link> : <p className="mt-0.5">-</p>}</div><div><p className="text-xs text-muted-foreground">Total</p><p className="mt-0.5 font-semibold">{money(total)}</p></div><div><p className="text-xs text-muted-foreground">Paid</p><p className="mt-0.5 font-semibold">{money(paid)}</p></div></div>
                    <div className="mt-3 rounded-xl bg-muted/50 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Outstanding</span><span className={balance > 0 ? "font-bold" : "font-medium text-muted-foreground"}>{money(balance)}</span></div><p className="mt-1 text-xs text-muted-foreground">{balance === 0 && total > 0 ? "Fully paid" : paid > 0 ? "Partially paid" : "No payment recorded"}</p></div>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><Button asChild type="button" className="w-full" variant="outline"><Link href={`/repairs/${repair.id}/parts`}>Parts Used</Link></Button>{balance > 0 && <Button type="button" className="w-full" variant="secondary" onClick={() => openPayment(repair.id)}>{paymentOpen ? "Close Payment" : "Record Payment"}</Button>}{!isDone && <Button type="button" className="w-full" onClick={() => handleComplete(repair.id)} disabled={completingId === repair.id}>{completingId === repair.id ? "Completing..." : "Mark Completed"}</Button>}</div>
                    {paymentOpen && balance > 0 && <PaymentForm repair={repair} balance={balance} amount={paymentAmount} method={paymentMethod} saving={paying} setAmount={setPaymentAmount} setMethod={setPaymentMethod} onSubmit={handlePayment} />}
                  </div>;
                })}
              </div>
            </>}
          </CardContent>
        </Card>

        <Card><CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Repair money flow</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-sm text-muted-foreground sm:px-6 sm:pb-6">Customer payment → repair balance reduces → payment enters Finance automatically. Once the full repair cost is paid, the repair shows <span className="font-medium text-foreground">Paid</span>.</CardContent></Card>
      </div>
    </AppLayout>
  );
}

type PaymentFormProps = { repair: RepairRow; balance: number; amount: string; method: string; saving: boolean; setAmount: (value: string) => void; setMethod: (value: string) => void; onSubmit: (repair: RepairRow) => void; };

function PaymentForm({ repair, balance, amount, method, saving, setAmount, setMethod, onSubmit }: PaymentFormProps) {
  return <div className="mt-3 w-full rounded-2xl border bg-muted/30 p-3 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Outstanding</span><span className="text-sm font-bold">{money(balance)}</span></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment amount</label><Input type="number" inputMode="decimal" min="0.01" max={balance} step="0.01" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 w-full" /></div><div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment method</label><select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"><option>Cash</option><option>Transfer</option><option>POS</option><option>Other</option></select></div></div>
    <Button type="button" className="mt-3 h-10 w-full" disabled={saving} onClick={() => onSubmit(repair)}>{saving ? "Recording payment..." : `Confirm ${money(Number(amount) || 0)} Payment`}</Button>
  </div>;
}

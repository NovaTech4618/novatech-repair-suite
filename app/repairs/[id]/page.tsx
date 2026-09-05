"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import RepairPartsPanel from "@/components/repairs/RepairPartsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { repairService } from "@/services/repairService";
import { repairPaymentService } from "@/services/repairPaymentService";
import type { RepairPayment } from "@/types/repairPayment";
import type { RepairProfit } from "@/types/repairParts";

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

function paymentLabel(method: string) {
  const normalized = method.toLowerCase();
  if (normalized === "cash") return "Cash";
  if (normalized === "transfer" || normalized === "bank transfer") return "Transfer";
  if (normalized === "pos" || normalized === "card") return "POS";
  return method || "Other";
}

export default function RepairDetailPage() {
  const params = useParams<{ id: string }>();
  const [repair, setRepair] = useState<any>(null);
  const [profit, setProfit] = useState<RepairProfit | null>(null);
  const [payments, setPayments] = useState<RepairPayment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: profitRows, error: profitError }, { data: paymentRows, error: paymentError }] = await Promise.all([
      repairService.getRepairById(params.id),
      repairService.getRepairProfit(params.id),
      repairPaymentService.getPayments(params.id),
    ]);
    setLoading(false);
    if (error) { toast.error("Could not load this repair."); return; }
    if (profitError) toast.error("Repair loaded, but profit metrics could not be calculated.");
    if (paymentError) toast.error("Payment history could not be loaded.");
    setRepair(data);
    setProfit(profitRows?.[0] ?? null);
    setPayments(paymentRows ?? []);
  }

  useEffect(() => { if (params.id) void load(); }, [params.id]);

  if (loading) return <AppLayout><div className="p-6 text-sm text-muted-foreground">Loading repair...</div></AppLayout>;
  if (!repair) return <AppLayout><div className="p-6"><p>Repair not found.</p><Button asChild className="mt-4"><Link href="/repairs">Back to Repairs</Link></Button></div></AppLayout>;

  const device = repair.devices;
  const customer = device?.customers;
  const total = Number(profit?.revenue ?? repair.final_cost ?? repair.estimated_cost ?? 0);
  const paid = Number(profit?.amount_paid ?? repair.deposit ?? 0);
  const balance = Number(profit?.outstanding ?? Math.max(total - paid, 0));
  const ticket = repair.repair_tickets?.[0];
  const partsCost = Number(profit?.parts_cost ?? 0);
  const grossProfit = Number(profit?.gross_profit ?? total - partsCost);
  const margin = Number(profit?.margin_percent ?? (total > 0 ? (grossProfit / total) * 100 : 0));

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-5 px-1 sm:space-y-6 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/repairs" className="text-sm text-blue-600 hover:underline">← All Repairs</Link>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{device?.brand} {device?.model}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{customer?.full_name || "Unknown customer"} · {repair.issue}</p>
          </div>
          <Badge>{repair.status}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Repair Revenue</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(total)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Parts Cost</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(partsCost)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Gross Profit</CardTitle></CardHeader><CardContent className={`text-xl font-bold ${grossProfit < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(grossProfit)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Margin</CardTitle></CardHeader><CardContent className={`text-xl font-bold ${grossProfit < 0 ? "text-red-600" : "text-emerald-600"}`}>{margin.toFixed(1)}%</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Paid</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(paid)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(balance)}</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment has been recorded for this repair yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{money(Number(payment.amount))}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
                      {payment.notes && <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>}
                    </div>
                    <Badge variant="secondary">{paymentLabel(payment.payment_method)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Repair Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Issue</p><p className="mt-1 font-medium">{repair.issue || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Technician</p><p className="mt-1 font-medium">{repair.technician || "Not assigned"}</p></div>
            <div><p className="text-xs text-muted-foreground">Diagnosis</p><p className="mt-1">{repair.diagnosis || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Solution</p><p className="mt-1">{repair.solution || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Ticket</p><p className="mt-1">{ticket ? <Link href={`/tickets/${ticket.id}`} className="font-semibold text-blue-600 hover:underline">{ticket.ticket_number}</Link> : "—"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Repair Notes</p><p className="mt-1 whitespace-pre-wrap">{repair.repair_notes || "—"}</p></div>
          </CardContent>
        </Card>

        <RepairPartsPanel repairId={repair.id} />
      </div>
    </AppLayout>
  );
}

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

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export default function RepairDetailPage() {
  const params = useParams<{ id: string }>();
  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await repairService.getRepairById(params.id);
    setLoading(false);
    if (error) { toast.error("Could not load this repair."); return; }
    setRepair(data);
  }

  useEffect(() => { if (params.id) void load(); }, [params.id]);

  if (loading) return <AppLayout><div className="p-6 text-sm text-muted-foreground">Loading repair...</div></AppLayout>;
  if (!repair) return <AppLayout><div className="p-6"><p>Repair not found.</p><Button asChild className="mt-4"><Link href="/repairs">Back to Repairs</Link></Button></div></AppLayout>;

  const device = repair.devices;
  const customer = device?.customers;
  const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0);
  const paid = Number(repair.deposit ?? 0);
  const balance = Math.max(total - paid, 0);
  const ticket = repair.repair_tickets?.[0];

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

        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Repair Total</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(total)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Paid</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(paid)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent className="text-xl font-bold">{money(balance)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Ticket</CardTitle></CardHeader><CardContent>{ticket ? <Link href={`/tickets/${ticket.id}`} className="font-semibold text-blue-600 hover:underline">{ticket.ticket_number}</Link> : "—"}</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Repair Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Issue</p><p className="mt-1 font-medium">{repair.issue || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Technician</p><p className="mt-1 font-medium">{repair.technician || "Not assigned"}</p></div>
            <div><p className="text-xs text-muted-foreground">Diagnosis</p><p className="mt-1">{repair.diagnosis || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Solution</p><p className="mt-1">{repair.solution || "—"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Repair Notes</p><p className="mt-1 whitespace-pre-wrap">{repair.repair_notes || "—"}</p></div>
          </CardContent>
        </Card>

        <RepairPartsPanel repairId={repair.id} />
      </div>
    </AppLayout>
  );
}

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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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
  devices: {
    brand: string;
    model: string;
    customers: { full_name: string } | null;
  } | null;
  repair_tickets: { id: string; ticket_number: string }[] | null;
};

function statusVariant(status: string) {
  if (status === "Completed" || status === "Collected") return "default";
  if (status === "Repairing" || status === "Testing") return "secondary";
  return "outline";
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
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

  useEffect(() => {
    fetchRepairs();
  }, []);

  async function fetchRepairs() {
    await getCurrentSession();

    const { data, error } = await repairService.getAllRepairs();

    if (error) {
      toast.error("Failed to load repairs.");
      return;
    }

    setRepairs((data as unknown as RepairRow[]) || []);
  }

  async function handleComplete(id: string) {
    if (!confirm("Mark this repair as completed and issue a pickup ticket?")) return;

    setCompletingId(id);
    const { data, error } = await repairService.completeRepair(id);
    setCompletingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Repair completed! Ticket ${data?.ticket_number} issued.`);
    fetchRepairs();
  }

  async function handlePayment(repair: RepairRow) {
    const amount = Number(paymentAmount);
    const totalCost = Number(repair.final_cost ?? repair.estimated_cost ?? 0);
    const paid = Number(repair.deposit ?? 0);
    const outstanding = Math.max(totalCost - paid, 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    if (amount > outstanding) {
      toast.error(`Payment cannot exceed the outstanding ${money(outstanding)}.`);
      return;
    }

    setPaying(true);
    const { error } = await repairPaymentService.recordPayment(
      repair.id,
      amount,
      paymentMethod
    );
    setPaying(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${money(amount)} payment recorded.`);
    setPaymentRepairId(null);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    await fetchRepairs();
  }

  const filtered = useMemo(() => repairs.filter((repair) => {
    const device = repair.devices;
    const customer = device?.customers;
    const query = search.toLowerCase();

    const matchesSearch =
      repair.issue.toLowerCase().includes(query) ||
      device?.brand?.toLowerCase().includes(query) ||
      device?.model?.toLowerCase().includes(query) ||
      customer?.full_name?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [repairs, search, statusFilter]);

  const statusOptions = [
    "all",
    "Received",
    "Diagnosis",
    "Estimate Sent",
    "Customer Approved",
    "Repairing",
    "Testing",
    "Completed",
    "Collected",
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Repairs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track repair revenue, customer payments, and outstanding balances.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="🔍 Search by device, customer, or issue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Statuses" : s}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No repairs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((repair) => {
                    const device = repair.devices;
                    const customer = device?.customers;
                    const ticket = repair.repair_tickets?.[0];
                    const total = Number(repair.final_cost ?? repair.estimated_cost ?? 0);
                    const paid = Number(repair.deposit ?? 0);
                    const balance = Math.max(total - paid, 0);
                    const isDone = repair.status === "Completed" || repair.status === "Collected";
                    const paymentOpen = paymentRepairId === repair.id;

                    return (
                      <TableRow key={repair.id}>
                        <TableCell>
                          <Link
                            href={`/devices/${repair.device_id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {device?.brand} {device?.model}
                          </Link>
                          <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            {repair.issue}
                          </div>
                        </TableCell>
                        <TableCell>{customer?.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(repair.status)}>{repair.status}</Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {balance === 0 && total > 0 ? "Paid" : paid > 0 ? "Partially paid" : "Unpaid"}
                          </div>
                        </TableCell>
                        <TableCell>{money(total)}</TableCell>
                        <TableCell>{money(paid)}</TableCell>
                        <TableCell className={balance > 0 ? "font-semibold" : "text-muted-foreground"}>
                          {money(balance)}
                        </TableCell>
                        <TableCell>
                          {ticket ? (
                            <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:underline">
                              {ticket.ticket_number}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {balance > 0 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setPaymentRepairId(paymentOpen ? null : repair.id);
                                  setPaymentAmount("");
                                }}
                              >
                                {paymentOpen ? "Close" : "Record Payment"}
                              </Button>
                            )}
                            {!isDone && (
                              <Button
                                size="sm"
                                onClick={() => handleComplete(repair.id)}
                                disabled={completingId === repair.id}
                              >
                                {completingId === repair.id ? "Completing..." : "Mark Completed"}
                              </Button>
                            )}
                          </div>

                          {paymentOpen && (
                            <div className="mt-3 w-72 rounded-xl border bg-muted/30 p-3">
                              <div className="mb-2 text-xs text-muted-foreground">
                                Outstanding: <span className="font-semibold text-foreground">{money(balance)}</span>
                              </div>
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max={balance}
                                  placeholder="Amount"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none"
                                >
                                  <option>Cash</option>
                                  <option>Transfer</option>
                                  <option>POS</option>
                                  <option>Other</option>
                                </select>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  disabled={paying}
                                  onClick={() => handlePayment(repair)}
                                >
                                  {paying ? "Recording..." : "Confirm Payment"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repair money flow</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Customer payment → repair balance reduces → payment enters Finance automatically. Once the full repair cost is paid, the repair shows <span className="font-medium text-foreground">Paid</span>.
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

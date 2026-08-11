"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { repairService } from "@/services/repairService";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [completingId, setCompletingId] = useState<string | null>(null);

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
    if (!confirm("Mark this repair as completed and issue a pickup ticket?")) {
      return;
    }

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

  const filtered = repairs.filter((repair) => {
    const device = repair.devices;
    const customer = device?.customers;

    const matchesSearch =
      repair.issue.toLowerCase().includes(search.toLowerCase()) ||
      device?.brand?.toLowerCase().includes(search.toLowerCase()) ||
      device?.model?.toLowerCase().includes(search.toLowerCase()) ||
      customer?.full_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || repair.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-3xl font-bold">All Repairs</h1>

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
              <p className="py-6 text-center text-gray-500">
                No repairs found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((repair) => {
                    const device = repair.devices;
                    const customer = device?.customers;
                    const ticket = repair.repair_tickets?.[0];
                    const isDone =
                      repair.status === "Completed" ||
                      repair.status === "Collected";

                    return (
                      <TableRow key={repair.id}>
                        <TableCell>
                          <Link
                            href={`/devices/${repair.device_id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {device?.brand} {device?.model}
                          </Link>
                        </TableCell>
                        <TableCell>{customer?.full_name || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {repair.issue}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(repair.status)}>
                            {repair.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket ? (
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {ticket.ticket_number}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {!isDone && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(repair.id)}
                              disabled={completingId === repair.id}
                            >
                              {completingId === repair.id
                                ? "Completing..."
                                : "Mark Completed"}
                            </Button>
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
      </div>
    </AppLayout>
  );
}
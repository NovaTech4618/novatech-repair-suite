"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { repairService } from "@/services/repairService";
import type { Repair } from "@/types/repair";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type RepairTableProps = {
  deviceId: string;
  refreshKey: number;
};

export default function RepairTable({
  deviceId,
  refreshKey,
}: RepairTableProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRepairs();
  }, [deviceId, refreshKey]);

  async function fetchRepairs() {
    const { data, error } = await repairService.getRepairs(deviceId);

    if (error) {
      toast.error("Failed to load repairs.");
      return;
    }

    setRepairs((data as Repair[]) || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this repair?")) return;

    const { error } = await repairService.deleteRepair(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Repair deleted successfully!");
    fetchRepairs();
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

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">Repair History</h3>

        {repairs.length === 0 ? (
          <p className="text-gray-500">No repairs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {repairs.map((repair) => {
                const ticket = repair.repair_tickets?.[0];
                const isDone =
                  repair.status === "Completed" ||
                  repair.status === "Collected";

                return (
                  <TableRow key={repair.id}>
                    <TableCell>{repair.issue}</TableCell>
                    <TableCell>{repair.status}</TableCell>
                    <TableCell>{repair.technician || "-"}</TableCell>
                    <TableCell>{ticket?.ticket_number || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(repair.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
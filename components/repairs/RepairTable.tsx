"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { repairService } from "@/services/repairService";
import type { Repair } from "@/types/repair";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RepairTableProps = {
  deviceId: string;
  refreshKey: number;
};

export default function RepairTable({
  deviceId,
  refreshKey,
}: RepairTableProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    fetchRepairs();
  }, [deviceId, refreshKey]);

  async function fetchRepairs() {
    const { data, error } =
      await repairService.getRepairs(deviceId);

    if (error) {
      toast.error("Failed to load repairs.");
      return;
    }

    setRepairs(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this repair?")) return;

    const { error } =
      await repairService.deleteRepair(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Repair deleted successfully!");

    fetchRepairs();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">
          Repair History
        </h3>

        {repairs.length === 0 ? (
          <p className="text-gray-500">
            No repairs yet.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Issue</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Technician</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {repairs.map((repair) => (
                <tr
                  key={repair.id}
                  className="border-b"
                >
                  <td className="py-3">
                    {repair.issue}
                  </td>

                  <td>{repair.status}</td>

                  <td>
                    {repair.technician || "-"}
                  </td>

                  <td>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDelete(repair.id)
                      }
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
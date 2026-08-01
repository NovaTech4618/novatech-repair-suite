"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { deviceService } from "@/services/deviceService";
import type { Device } from "@/types/device";

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

type DeviceTableProps = {
  customerId: string;
  refreshKey: number;
};

export default function DeviceTable({
  customerId,
  refreshKey,
}: DeviceTableProps) {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetchDevices();
  }, [customerId, refreshKey]);

  async function fetchDevices() {
    const { data, error } = await deviceService.getDevices(customerId);

    if (error) {
      toast.error("Failed to load devices.");
      return;
    }

    setDevices(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this device?")) return;

    const { error } = await deviceService.deleteDevice(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Device deleted successfully!");
    fetchDevices();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">Device List</h3>

        {devices.length === 0 ? (
          <p className="text-gray-500">No devices added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
  <Link
    href={`/devices/${device.id}`}
    className="text-blue-600 hover:underline font-medium"
  >
    {device.brand}
  </Link>
</TableCell>
<TableCell>{device.model}</TableCell>
                  <TableCell>{device.problem}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(device.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
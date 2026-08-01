"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { deviceService } from "@/services/deviceService";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type DeviceRow = {
  id: string;
  brand: string;
  model: string;
  problem: string;
  customers: { full_name: string } | null;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    const { data, error } = await deviceService.getAllDevices();

    if (error) {
      toast.error("Failed to load devices.");
      return;
    }

    setDevices((data as unknown as DeviceRow[]) || []);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Devices</h1>

        <Card>
          <CardContent className="p-6">
            {devices.length === 0 ? (
              <p className="text-gray-500">No devices found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Problem</TableHead>
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
                          {device.brand} {device.model}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {device.customers?.full_name || "-"}
                      </TableCell>
                      <TableCell>{device.problem}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { deviceService } from "@/services/deviceService";
import type { Device } from "@/types/device";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    const { data, error } =
      await deviceService.getDevices(customerId);

    if (error) {
      toast.error("Failed to load devices.");
      return;
    }

    setDevices(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this device?")) return;

    const { error } =
      await deviceService.deleteDevice(id);

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
        <h3 className="text-xl font-bold mb-4">
          Device List
        </h3>

        {devices.length === 0 ? (
          <p className="text-gray-500">
            No devices added yet.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Brand</th>
                <th className="text-left py-3">Model</th>
                <th className="text-left py-3">Problem</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b"
                >
                  <td className="py-3">
                    {device.brand}
                  </td>

                  <td>{device.model}</td>

                  <td>{device.problem}</td>

                  <td>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDelete(device.id)
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
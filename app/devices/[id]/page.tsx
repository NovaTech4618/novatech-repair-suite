"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getCurrentSession } from "@/lib/supabase";
import { deviceService } from "@/services/deviceService";
import AppLayout from "@/components/layout/AppLayout";
import DeviceRepairs from "@/components/repairs/DeviceRepairs";

import type { Device } from "@/types/device";

export default function DeviceDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchDevice();
  }, [params.id]);

  async function fetchDevice() {
    await getCurrentSession();

    const { data, error } = await deviceService.getDeviceById(params.id);

    setLoading(false);

    if (error || !data) {
      setNotFound(true);
      return;
    }

    setData(data);
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-gray-500">Loading...</p>
      </AppLayout>
    );
  }

  if (notFound || !data) {
    return (
      <AppLayout>
        <p className="text-gray-500">Device not found.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            {data.brand} {data.model}
          </h1>

          <div className="mt-6 space-y-2">
            <p><strong>Device Type:</strong> {data.device_type}</p>
            <p><strong>Serial Number:</strong> {data.serial_number || "-"}</p>
            <p><strong>Color:</strong> {data.color || "-"}</p>
            <p><strong>Condition:</strong> {data.condition || "-"}</p>
            <p><strong>Accessories:</strong> {data.accessories || "-"}</p>
            <p><strong>Problem:</strong> {data.problem}</p>
          </div>
        </div>

        <hr />

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Repairs</h2>
          <DeviceRepairs deviceId={data.id} />
        </div>
      </div>
    </AppLayout>
  );
}
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import DeviceRepairs from "@/components/repairs/DeviceRepairs";
import { deviceService } from "@/services/deviceService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DeviceDetailsPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await deviceService.getDeviceById(id);

  if (error || !data) {
    notFound();
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
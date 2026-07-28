export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { customerService } from "@/services/customerService";
import AppLayout from "@/components/layout/AppLayout";
import CustomerDevices from "@/components/devices/CustomerDevices";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await customerService.getCustomerById(id);

  if (error || !data) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">{data.full_name}</h1>

          <div className="space-y-3">
            <p><strong>Phone:</strong> {data.phone}</p>
            <p><strong>Email:</strong> {data.email || "-"}</p>
            <p><strong>Address:</strong> {data.address || "-"}</p>
          </div>
        </div>

        <hr />

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Devices</h2>
          <CustomerDevices customerId={data.id} />
        </div>
      </div>
    </AppLayout>
  );
}
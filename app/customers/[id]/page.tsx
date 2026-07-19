export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { customerService } from "@/services/customerService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const { data, error } =
    await customerService.getCustomerById(id);

  if (error || !data) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Customer Information */}

      <div>
        <h1 className="text-3xl font-bold mb-6">
          {data.full_name}
        </h1>

        <div className="space-y-3">

          <p>
            <strong>Phone:</strong> {data.phone}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {data.email || "-"}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {data.address || "-"}
          </p>

        </div>
      </div>

      <hr />

      {/* Devices Section */}

      <div className="space-y-6">

        <h2 className="text-2xl font-bold">
          Devices
        </h2>

        {/* Device Form will go here */}

        {/* Device Table will go here */}

      </div>

    </div>
  );
}
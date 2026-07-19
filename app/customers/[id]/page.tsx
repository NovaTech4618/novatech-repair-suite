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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        {data.full_name}
      </h1>

      <div className="space-y-2">
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
  );
}
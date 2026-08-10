"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getCurrentSession } from "@/lib/supabase";
import { customerService } from "@/services/customerService";
import AppLayout from "@/components/layout/AppLayout";
import CustomerDevices from "@/components/devices/CustomerDevices";

import type { Customer } from "@/types/customer";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  async function fetchCustomer() {
    await getCurrentSession();

    const { data, error } = await customerService.getCustomerById(params.id);

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
        <p className="text-gray-500">Customer not found.</p>
      </AppLayout>
    );
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
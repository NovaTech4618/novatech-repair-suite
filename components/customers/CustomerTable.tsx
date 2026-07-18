"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
};

type CustomerTableProps = {
  refreshKey: number;
};

export default function CustomerTable({
  refreshKey,
}: CustomerTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, [refreshKey]);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setCustomers(data || []);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchCustomers();
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Customer List
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Phone</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b">
                <td className="py-3">{customer.full_name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCustomer(customer.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
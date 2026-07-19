"use client";

import { useEffect, useState } from "react";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

 

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
    const { data, error } = await customerService.getCustomers();

    if (error) {
      console.error(error);
      return;
    }

    setCustomers(data || []);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;

    const { error } = await customerService.deleteCustomer(id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchCustomers();
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
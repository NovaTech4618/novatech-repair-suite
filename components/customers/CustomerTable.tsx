"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type CustomerTableProps = {
  refreshKey: number;
  onEdit: (customer: Customer) => void;
};

export default function CustomerTable({
  refreshKey,
  onEdit,
}: CustomerTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [refreshKey]);

  async function fetchCustomers() {
    const { data, error } = await customerService.getCustomers();

    if (error) {
      toast.error("Failed to load customers.");
      return;
    }

    setCustomers(data || []);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;

    const { error } = await customerService.deleteCustomer(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Customer deleted successfully!");
    fetchCustomers();
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search)
  );

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Customer List</h2>

        <Input
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6"
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {customer.full_name}
                    </Link>
                  </TableCell>

                  <TableCell>{customer.phone}</TableCell>

                  <TableCell>{customer.email || "-"}</TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onEdit(customer)}>
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCustomer(customer.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
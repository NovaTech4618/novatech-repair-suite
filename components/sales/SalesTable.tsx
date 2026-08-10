"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { saleService } from "@/services/saleService";
import type { Sale } from "@/types/sale";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type SalesTableProps = {
  refreshKey: number;
};

export default function SalesTable({ refreshKey }: SalesTableProps) {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchSales();
  }, [refreshKey]);

  async function fetchSales() {
    const { data, error } = await saleService.getSales();

    if (error) {
      toast.error("Failed to load sales.");
      return;
    }

    setSales((data as Sale[]) || []);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Sales History</h2>

        {sales.length === 0 ? (
          <p className="text-gray-500">No sales yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const customer = Array.isArray(sale.customers)
                  ? sale.customers[0]
                  : sale.customers;

                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{customer?.full_name || "Walk-in"}</TableCell>
                    <TableCell>{sale.payment_method || "-"}</TableCell>
                    <TableCell>₦{sale.total}</TableCell>
                    <TableCell>
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
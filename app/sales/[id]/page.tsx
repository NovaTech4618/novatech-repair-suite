"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/lib/supabase";
import { saleService } from "@/services/saleService";
import PrintButton from "@/components/tickets/PrintButton";
import { Card, CardContent } from "@/components/ui/card";

export default function SaleReceiptPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [params.id]);

  async function fetchSale() {
    await getCurrentSession();

    const { data, error } = await saleService.getSaleById(params.id);

    setLoading(false);

    if (error || !data) {
      setNotFound(true);
      return;
    }

    setData(data);
  }

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (notFound || !data) return <p className="p-6 text-gray-500">Sale not found.</p>;

  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  const items = data.sale_items || [];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Back
        </Link>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold">Sales Receipt</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(data.sale_date).toLocaleString()}
            </p>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{customer?.full_name || "Walk-in"}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const inv = Array.isArray(item.inventory)
                  ? item.inventory[0]
                  : item.inventory;
                return (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{inv?.item_name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">₦{item.unit_price}</td>
                    <td className="py-2 text-right">₦{item.total_price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-1 text-sm text-right">
            <p className="text-muted-foreground">Subtotal: ₦{data.subtotal}</p>
            <p className="text-muted-foreground">Discount: ₦{data.discount}</p>
            <p className="text-lg font-bold">Total: ₦{data.total}</p>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-6 border-t">
            Thank you for your Patronage!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { partsCreditService } from "@/services/partsCreditService";
import type { PartsCredit } from "@/types/partsCredit";
import type { Customer } from "@/types/customer";
import type { InventoryItem } from "@/types/inventory";

export default function PartsCreditPage() {
  const [credits, setCredits] = useState<PartsCredit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [creditsRes, customersRes, inventoryRes] = await Promise.all([
      partsCreditService.getCredits(),
      import("@/services/customerService").then(({ customerService }) =>
        customerService.getCustomers()
      ),
      import("@/services/inventoryService").then(({ inventoryService }) =>
        inventoryService.getInventory()
      ),
    ]);

    if (creditsRes.data) setCredits(creditsRes.data as PartsCredit[]);
    if (customersRes.data) setCustomers(customersRes.data as Customer[]);
    if (inventoryRes.data) setInventory(inventoryRes.data as InventoryItem[]);

    setLoading(false);
  }

  if (loading) {
    return <div className="p-6">Loading parts credit...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Parts Credit</h1>
        <p className="text-muted-foreground">
          Track parts collected by customers and outstanding balances.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Credit Records</h2>

        {credits.length === 0 ? (
          <p className="text-muted-foreground">
            No parts credit records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Part</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.id} className="border-b">
                    <td className="p-3">
                      {Array.isArray(credit.customers)
                        ? credit.customers[0]?.full_name
                        : credit.customers?.full_name ?? "Unknown"}
                    </td>

                    <td className="p-3">
                      {Array.isArray(credit.inventory)
                        ? credit.inventory[0]?.item_name
                        : credit.inventory?.item_name ?? "Unknown"}
                    </td>

                    <td className="p-3">{credit.quantity}</td>

                    <td className="p-3">
                      ₦{Number(credit.unit_price).toLocaleString()}
                    </td>

                    <td className="p-3 font-medium">
                      ₦{Number(credit.total_price).toLocaleString()}
                    </td>

                    <td className="p-3 capitalize">
                      {credit.status.replace("_", " ")}
                    </td>

                    <td className="p-3">
                      {new Date(credit.credit_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
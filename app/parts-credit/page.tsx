"use client";

import { useEffect, useState } from "react";
import { partsCreditService } from "@/services/partsCreditService";
import { customerService } from "@/services/customerService";
import { inventoryService } from "@/services/inventoryService";

import type { PartsCredit } from "@/types/partsCredit";
import type { Customer } from "@/types/customer";
import type { InventoryItem } from "@/types/inventory";

export default function PartsCreditPage() {
  const [credits, setCredits] = useState<PartsCredit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [creditsRes, customersRes, inventoryRes] = await Promise.all([
      partsCreditService.getCredits(),
      customerService.getCustomers(),
      inventoryService.getInventory(),
    ]);

    if (creditsRes.error) {
      setError(creditsRes.error.message);
    }

    if (customersRes.error) {
      setError(customersRes.error.message);
    }

    if (inventoryRes.error) {
      setError(inventoryRes.error.message);
    }

    if (creditsRes.data) {
      setCredits(creditsRes.data as PartsCredit[]);
    }

    if (customersRes.data) {
      setCustomers(customersRes.data as Customer[]);
    }

    if (inventoryRes.data) {
      setInventory(inventoryRes.data as InventoryItem[]);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!inventoryId) {
      setError("Please select a part.");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (!unitPrice || Number(unitPrice) < 0) {
      setError("Please enter a valid unit price.");
      return;
    }

    setSaving(true);

    const { error } = await partsCreditService.addCredit({
      customer_id: customerId,
      inventory_id: inventoryId,
      quantity,
      unit_price: Number(unitPrice),
      notes: notes.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    // Reset form
    setCustomerId("");
    setInventoryId("");
    setQuantity(1);
    setUnitPrice("");
    setNotes("");

    await loadData();

    setSaving(false);
  }

  function handlePartChange(id: string) {
    setInventoryId(id);

    const selectedItem = inventory.find((item) => item.id === id);

    if (selectedItem) {
      setUnitPrice(String(selectedItem.selling_price));
    } else {
      setUnitPrice("");
    }
  }

  const total = quantity * Number(unitPrice || 0);

  const totalCredit = credits.reduce(
    (sum, credit) => sum + Number(credit.total_price || 0),
    0
  );

  const unpaidCredit = credits
    .filter((credit) => credit.status !== "paid")
    .reduce(
      (sum, credit) => sum + Number(credit.total_price || 0),
      0
    );

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Loading parts credit...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Parts Credit
        </h1>

        <p className="text-muted-foreground">
          Record parts collected on credit and track outstanding balances.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">
            Total Credit Records
          </p>

          <p className="mt-2 text-2xl font-bold">
            {credits.length}
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">
            Total Credit
          </p>

          <p className="mt-2 text-2xl font-bold">
            ₦{totalCredit.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold">
            ₦{unpaidCredit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* New Credit */}
      <div className="rounded-lg border p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            New Parts Credit
          </h2>

          <p className="text-sm text-muted-foreground">
            Record a part collected by a customer or engineer.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          {/* Customer */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Customer / Engineer *
            </label>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border bg-background p-2.5"
            >
              <option value="">
                Select customer / engineer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.full_name} — {customer.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Part */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Part *
            </label>

            <select
              value={inventoryId}
              onChange={(e) =>
                handlePartChange(e.target.value)
              }
              className="w-full rounded-md border bg-background p-2.5"
            >
              <option value="">
                Select part
              </option>

              {inventory.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.item_name} — ₦
                  {Number(
                    item.selling_price
                  ).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Quantity *
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
              className="w-full rounded-md border bg-background p-2.5"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Unit Price *
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(e.target.value)
              }
              placeholder="Enter price"
              className="w-full rounded-md border bg-background p-2.5"
            />
          </div>

          {/* Total */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Total
            </label>

            <div className="rounded-md border bg-muted p-2.5 font-semibold">
              ₦{total.toLocaleString()}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Notes
            </label>

            <input
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-md border bg-background p-2.5"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="md:col-span-2 rounded-md border p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Recording..."
                : "Record Credit"}
            </button>
          </div>
        </form>
      </div>

      {/* Credit Records */}
      <div className="rounded-lg border p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Credit Records
          </h2>

          <p className="text-sm text-muted-foreground">
            Recent parts collected on credit.
          </p>
        </div>

        {credits.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No parts credit records yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Part</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {credits.map((credit) => {
                  const customerName = Array.isArray(
                    credit.customers
                  )
                    ? credit.customers[0]?.full_name
                    : credit.customers?.full_name;

                  const partName = Array.isArray(
                    credit.inventory
                  )
                    ? credit.inventory[0]?.item_name
                    : credit.inventory?.item_name;

                  return (
                    <tr
                      key={credit.id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3">
                        {customerName ?? "Unknown"}
                      </td>

                      <td className="p-3">
                        {partName ?? "Unknown"}
                      </td>

                      <td className="p-3">
                        {credit.quantity}
                      </td>

                      <td className="p-3">
                        ₦
                        {Number(
                          credit.unit_price
                        ).toLocaleString()}
                      </td>

                      <td className="p-3 font-medium">
                        ₦
                        {Number(
                          credit.total_price
                        ).toLocaleString()}
                      </td>

                      <td className="p-3">
                        <span className="capitalize">
                          {credit.status.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="p-3">
                        {new Date(
                          credit.credit_date
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
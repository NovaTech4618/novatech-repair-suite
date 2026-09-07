"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { branchService } from "@/services/branchService";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import type { Branch } from "@/types/staff";

export default function TransferStockPanel({
  items,
  onTransferred,
}: {
  items: InventoryItem[];
  onTransferred: () => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [itemId, setItemId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    branchService.getBranches().then(({ data, error }) => {
      if (error) toast.error("Could not load branches.");
      else setBranches((data ?? []) as Branch[]);
    });
  }, []);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) ?? null,
    [items, itemId],
  );

  const destinations = useMemo(
    () => branches.filter((branch) => branch.is_active && branch.id !== selectedItem?.branch_id),
    [branches, selectedItem],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);

    if (!selectedItem) return toast.error("Select an inventory item.");
    if (!selectedItem.branch_id) return toast.error("This item is not assigned to a branch yet.");
    if (!destinationId) return toast.error("Select a destination branch.");
    if (destinationId === selectedItem.branch_id) return toast.error("Source and destination must be different.");
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("Quantity must be a positive whole number.");
    if (qty > selectedItem.quantity) return toast.error(`Only ${selectedItem.quantity} units are available at the source branch.`);

    setSaving(true);
    const { error } = await inventoryService.createInventoryTransfer(
      selectedItem.id,
      destinationId,
      qty,
      notes,
    );
    setSaving(false);

    if (error) {
      toast.error(error.message || "Transfer failed.");
      return;
    }

    toast.success(`${qty} × ${selectedItem.item_name} transferred successfully.`);
    setQuantity("");
    setNotes("");
    setDestinationId("");
    onTransferred();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Multi-branch stock</p>
        <h2 className="mt-1 font-semibold text-slate-950">Transfer stock</h2>
        <p className="mt-1 text-sm text-slate-500">Move parts between branches without editing quantities manually.</p>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <select value={itemId} onChange={(e) => { setItemId(e.target.value); setDestinationId(""); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500">
          <option value="">Select part</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.item_name} · {item.quantity} available
            </option>
          ))}
        </select>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Destination branch</label>
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} disabled={!selectedItem} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-50 focus:border-teal-500">
              <option value="">Select branch</option>
              {destinations.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Quantity</label>
            <input type="number" min="1" step="1" max={selectedItem?.quantity ?? undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Units" disabled={!selectedItem} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50 focus:border-teal-500" />
          </div>
        </div>

        {selectedItem && (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Source stock: <strong className="text-slate-900">{selectedItem.quantity}</strong> units · after transfer: <strong className="text-slate-900">{Math.max(0, selectedItem.quantity - (Number(quantity) || 0))}</strong>
          </div>
        )}

        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional transfer note" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
        <button type="submit" disabled={saving || !selectedItem} className="h-10 w-full rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Transferring…" : "Transfer stock"}
        </button>
      </form>
    </section>
  );
}

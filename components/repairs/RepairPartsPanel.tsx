"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { repairPartsService } from "@/services/repairPartsService";
import { inventoryService } from "@/services/inventoryService";
import type { RepairPartUsage } from "@/types/repairParts";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export default function RepairPartsPanel({ repairId }: { repairId: string }) {
  const [usage, setUsage] = useState<RepairPartUsage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});

  async function load() {
    const [usageResult, inventoryResult] = await Promise.all([
      repairPartsService.getUsage(repairId),
      inventoryService.getInventory(),
    ]);
    if (usageResult.error) toast.error("Failed to load repair parts.");
    if (inventoryResult.error) toast.error("Failed to load inventory.");
    setUsage(usageResult.data || []);
    setInventory((inventoryResult.data || []) as InventoryItem[]);
  }

  useEffect(() => { void load(); }, [repairId]);

  const selected = useMemo(() => inventory.find((item) => item.id === inventoryId), [inventory, inventoryId]);
  const totalCost = usage.reduce((sum, row) => sum + Math.max(row.quantity_used - row.quantity_returned, 0) * Number(row.unit_cost), 0);

  async function handleUse() {
    const qty = Number(quantity);
    if (!inventoryId || !Number.isInteger(qty) || qty <= 0) return toast.error("Select a part and enter a valid quantity.");
    if (selected && qty > selected.quantity) return toast.error("Not enough stock available.");
    setSaving(true);
    const { error } = await repairPartsService.recordUsage(repairId, inventoryId, qty, notes);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${qty} × ${selected?.item_name || "part"} issued to this repair.`);
    setInventoryId(""); setQuantity("1"); setNotes(""); await load();
  }

  async function handleReturn(row: RepairPartUsage) {
    const qty = Number(returnQty[row.id] || 0);
    const outstanding = row.quantity_used - row.quantity_returned;
    if (!Number.isInteger(qty) || qty <= 0 || qty > outstanding) return toast.error(`Enter a return quantity from 1 to ${outstanding}.`);
    setReturningId(row.id);
    const { error } = await repairPartsService.returnUsage(row.id, qty, "Unused part returned from repair");
    setReturningId(null);
    if (error) return toast.error(error.message);
    toast.success(`${qty} part${qty === 1 ? "" : "s"} returned to inventory.`);
    setReturnQty((current) => ({ ...current, [row.id]: "" }));
    await load();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-lg">Parts Used on This Repair</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-2xl border bg-muted/20 p-3 sm:grid-cols-[1fr_100px_1fr_auto] sm:items-end">
          <label className="text-sm font-medium">Part
            <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="">Select inventory item</option>
              {inventory.map((item) => <option key={item.id} value={item.id} disabled={item.quantity <= 0}>{item.item_name} — {item.quantity} in stock</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Qty
            <Input className="mt-1" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label className="text-sm font-medium">Note
            <Input className="mt-1" placeholder="e.g. Screen replacement" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <Button onClick={handleUse} disabled={saving || !inventoryId}>{saving ? "Issuing..." : "Use Part"}</Button>
        </div>

        {selected && <p className="text-xs text-muted-foreground">Current stock: <span className="font-medium text-foreground">{selected.quantity}</span> · Cost captured: {money(Number(selected.cost_price || 0))} each</p>}

        {usage.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No parts have been recorded for this repair.</p> : (
          <div className="space-y-2">
            {usage.map((row) => {
              const outstanding = row.quantity_used - row.quantity_returned;
              return <div key={row.id} className="rounded-2xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{row.inventory?.item_name || "Inventory item"}</p>
                    <p className="text-xs text-muted-foreground">Used {row.quantity_used} · Returned {row.quantity_returned} · Cost {money(Number(row.unit_cost))}/unit</p>
                  </div>
                  <div className="text-sm font-semibold">{money(outstanding * Number(row.unit_cost))}</div>
                </div>
                {outstanding > 0 && <div className="mt-3 flex gap-2 sm:justify-end">
                  <Input className="w-24" type="number" min="1" max={outstanding} placeholder="Qty" value={returnQty[row.id] || ""} onChange={(e) => setReturnQty((current) => ({ ...current, [row.id]: e.target.value }))} />
                  <Button size="sm" variant="secondary" onClick={() => handleReturn(row)} disabled={returningId === row.id}>{returningId === row.id ? "Returning..." : "Return"}</Button>
                </div>}
              </div>;
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Current parts cost</span>
          <span className="font-bold">{money(totalCost)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Every part used reduces inventory immediately and creates a <span className="font-medium text-foreground">repair_use</span> movement for true repair COGS. Returned unused parts are reversed.</p>
      </CardContent>
    </Card>
  );
}

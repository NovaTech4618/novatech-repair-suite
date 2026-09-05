"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCurrentSession } from "@/lib/supabase";
import { inventoryService } from "@/services/inventoryService";
import { inventoryPurchaseService } from "@/services/inventoryPurchaseService";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = { refreshKey?: number; onReceived?: () => void };

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function ReceiveStockPanel({ refreshKey = 0, onReceived }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");
  const [method, setMethod] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void loadInventory(); }, [refreshKey]);

  async function loadInventory() {
    await getCurrentSession();
    const { data, error } = await inventoryService.getInventory();
    if (error) { toast.error("Failed to load inventory."); return; }
    setInventory((data || []) as InventoryItem[]);
  }

  const selected = inventory.find((item) => item.id === itemId);
  const qty = Number(quantity) || 0;
  const cost = Number(unitCost) || 0;
  const total = qty * cost;
  const newStock = selected ? selected.quantity + qty : 0;

  const suggestedCost = useMemo(() => selected?.cost_price ?? null, [selected]);

  function chooseItem(id: string) {
    setItemId(id);
    const item = inventory.find((entry) => entry.id === id);
    if (item?.cost_price != null) setUnitCost(String(item.cost_price));
    if (item?.supplier) setSupplier(item.supplier);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedQty = Number(quantity);
    const parsedCost = Number(unitCost);
    if (!itemId) return toast.error("Select an inventory item.");
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) return toast.error("Quantity must be a whole number greater than zero.");
    if (!Number.isFinite(parsedCost) || parsedCost < 0) return toast.error("Unit cost cannot be negative.");
    setSaving(true);
    const { error } = await inventoryPurchaseService.receive({ supplier, invoice_reference: invoice, purchase_date: new Date(date).toISOString(), payment_method: method, inventory_id: itemId, quantity: parsedQty, unit_cost: parsedCost, notes });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${parsedQty} unit${parsedQty === 1 ? "" : "s"} received into stock.`);
    setQuantity(""); setInvoice(""); setNotes("");
    await loadInventory();
    onReceived?.();
  }

  return <Card>
    <CardHeader><CardTitle>Receive Stock</CardTitle></CardHeader>
    <CardContent>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Inventory item</label>
          <select value={itemId} onChange={(e) => chooseItem(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            <option value="">Select part...</option>
            {inventory.map((item) => <option key={item.id} value={item.id}>{item.item_name} — {item.quantity} in stock</option>)}
          </select>
        </div>

        {selected && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm"><Badge variant={selected.quantity <= selected.minimum_stock ? "destructive" : "secondary"}>Current: {selected.quantity}</Badge><span className="text-muted-foreground">After receipt: <strong className="text-foreground">{newStock}</strong></span>{suggestedCost != null && <span className="text-muted-foreground">Current avg cost: {money(suggestedCost)}</span>}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input type="number" min="1" step="1" placeholder="Quantity received" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Input type="number" min="0" step="0.01" placeholder="Unit cost" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
          <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <Input placeholder="Invoice / reference" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select>
        </div>
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="rounded-xl border p-3 text-sm"><div className="flex items-center justify-between"><span className="text-muted-foreground">Purchase total</span><strong>{money(total)}</strong></div><p className="mt-1 text-xs text-muted-foreground">This increases stock and records the purchase in Finance. It does not become COGS until the stock is actually used or sold.</p></div>
        <Button type="submit" disabled={saving || !itemId} className="w-full">{saving ? "Receiving stock..." : "Receive Stock"}</Button>
      </form>
    </CardContent>
  </Card>;
}

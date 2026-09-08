"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import InventoryImage from "@/components/inventory/InventoryImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type InventoryTableProps = { refreshKey: number; onEdit: (item: InventoryItem) => void; itemsOverride?: InventoryItem[]; embedded?: boolean };

export default function InventoryTable({ refreshKey, onEdit, itemsOverride, embedded = false }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => { if (!itemsOverride) inventoryService.getInventory().then(({ data, error }) => { if (error) toast.error("Failed to load inventory."); else setItems((data || []) as InventoryItem[]); }); }, [refreshKey, itemsOverride]);
  const source = itemsOverride ?? items;
  const filtered = source.filter((item) => `${item.item_name} ${item.sku || ""} ${item.brand || ""} ${item.compatible_models || ""}`.toLowerCase().includes(search.toLowerCase()));
  async function handleDelete(id: string) { if (!confirm("Delete this item?")) return; const { error } = await inventoryService.deleteInventoryItem(id); if (error) toast.error(error.message); else { toast.success("Item deleted."); const result = await inventoryService.getInventory(); setItems((result.data || []) as InventoryItem[]); } }
  return <div className={embedded ? "" : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"}>
    {!embedded && <h2 className="mb-4 text-xl font-bold">Inventory List</h2>}
    <div className="border-b border-slate-100 p-4"><input placeholder="Search name, SKU, brand or model..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" /></div>
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Brand</TableHead><TableHead>Shelf</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-500">No inventory items found.</TableCell></TableRow> : filtered.map((item) => { const low = item.quantity <= item.minimum_stock; return <TableRow key={item.id}><TableCell><div className="flex items-center gap-3"><InventoryImage src={item.image_url} alt={item.item_name} /><div><div className="font-medium">{item.item_name}</div>{item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}</div></div></TableCell><TableCell><Badge variant={String(item.category || "Part").toLowerCase() === "part" ? "default" : "secondary"}>{item.category || "Part"}</Badge></TableCell><TableCell>{item.brand || "—"}</TableCell><TableCell>{item.shelf_location || "—"}</TableCell><TableCell><div className="flex items-center gap-2"><span className="font-semibold">{item.quantity}</span>{low && <Badge variant="destructive">{item.quantity === 0 ? "Out" : "Low"}</Badge>}</div></TableCell><TableCell>₦{Number(item.selling_price).toLocaleString()}</TableCell><TableCell><div className="flex gap-2"><Button size="sm" onClick={() => onEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button></div></TableCell></TableRow>; })}</TableBody></Table></div>
  </div>;
}

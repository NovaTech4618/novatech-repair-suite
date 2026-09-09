"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import InventoryImage from "@/components/inventory/InventoryImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type InventoryTableProps = { refreshKey: number; onEdit: (item: InventoryItem) => void; itemsOverride?: InventoryItem[]; embedded?: boolean };

const FALLBACK_CATEGORY = "Part";

function labelize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function InventoryTable({ refreshKey, onEdit, itemsOverride, embedded = false }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  useEffect(() => {
    if (!itemsOverride) {
      inventoryService.getInventory().then(({ data, error }) => {
        if (error) toast.error("Failed to load inventory.");
        else setItems((data || []) as InventoryItem[]);
      });
    }
  }, [refreshKey, itemsOverride]);

  const source = itemsOverride ?? items;
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    source.forEach((item) => {
      const value = item.category || FALLBACK_CATEGORY;
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [source]);

  const brands = useMemo(() => {
    const values = new Set<string>();
    source.forEach((item) => {
      if (item.brand?.trim()) values.add(item.brand.trim());
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [source]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return source.filter((item) => {
      const itemCategory = item.category || FALLBACK_CATEGORY;
      const text = `${item.item_name} ${item.sku || ""} ${item.brand || ""} ${item.compatible_models || ""} ${item.shelf_location || ""}`.toLowerCase();
      return (!needle || text.includes(needle)) &&
        (category === "all" || itemCategory === category) &&
        (brand === "all" || item.brand === brand);
    });
  }, [source, search, category, brand]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await inventoryService.deleteInventoryItem(id);
    if (error) toast.error(error.message);
    else {
      toast.success("Item deleted.");
      const result = await inventoryService.getInventory();
      setItems((result.data || []) as InventoryItem[]);
    }
  }

  return (
    <div className={embedded ? "" : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"}>
      {!embedded && <h2 className="mb-4 text-xl font-bold">Inventory</h2>}

      <div className="border-b border-slate-100 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            placeholder="Search item, SKU, brand, model or shelf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"
          />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setBrand("all"); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">All categories</option>
            {categories.map(([value]) => <option key={value} value={value}>{labelize(value)}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">All brands</option>
            {brands.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{filtered.length} item{filtered.length === 1 ? "" : "s"} shown</p>
          {(category !== "all" || brand !== "all" || search) && (
            <button type="button" onClick={() => { setCategory("all"); setBrand("all"); setSearch(""); }} className="text-xs font-semibold text-teal-700 hover:text-teal-800">Clear filters</button>
          )}
        </div>
      </div>

      {category === "all" && !search && brand === "all" ? (
        <div className="p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-950">Browse your stockroom</h3>
            <p className="mt-1 text-sm text-slate-500">Start with a category instead of scanning every product at once.</p>
          </div>
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">No inventory items found.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map(([value, count]) => {
                const categoryItems = source.filter((item) => (item.category || FALLBACK_CATEGORY) === value);
                const low = categoryItems.filter((item) => item.quantity <= item.minimum_stock).length;
                const categoryBrands = new Set(categoryItems.map((item) => item.brand).filter(Boolean));
                return (
                  <button key={value} type="button" onClick={() => setCategory(value)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Category</p>
                        <h4 className="mt-2 text-xl font-bold text-slate-950">{labelize(value)}</h4>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{count}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{categoryBrands.size} brand{categoryBrands.size === 1 ? "" : "s"}</span>
                      <span>•</span>
                      <span>{low ? `${low} need attention` : "Stock healthy"}</span>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-slate-600 transition group-hover:text-teal-700">Open category →</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Brand</TableHead><TableHead>Shelf</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-500">No inventory items found.</TableCell></TableRow> : filtered.map((item) => {
                const low = item.quantity <= item.minimum_stock;
                return <TableRow key={item.id}>
                  <TableCell><div className="flex items-center gap-3"><InventoryImage src={item.image_url} alt={item.item_name} /><div><div className="font-medium">{item.item_name}</div>{item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}</div></div></TableCell>
                  <TableCell><Badge variant={String(item.category || FALLBACK_CATEGORY).toLowerCase() === "part" ? "default" : "secondary"}>{item.category || FALLBACK_CATEGORY}</Badge></TableCell>
                  <TableCell>{item.brand || "—"}</TableCell>
                  <TableCell>{item.shelf_location || "—"}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><span className="font-semibold">{item.quantity}</span>{low && <Badge variant="destructive">{item.quantity === 0 ? "Out" : "Low"}</Badge>}</div></TableCell>
                  <TableCell>₦{Number(item.selling_price).toLocaleString()}</TableCell>
                  <TableCell><div className="flex gap-2"><Button size="sm" onClick={() => onEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button></div></TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

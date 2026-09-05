"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InventoryFormProps = { editingItem: InventoryItem | null; onSaved: () => void; onCancelEdit: () => void };

export default function InventoryForm({ editingItem, onSaved, onCancelEdit }: InventoryFormProps) {
  const [itemName, setItemName] = useState(""); const [category, setCategory] = useState(""); const [brand, setBrand] = useState("");
  const [compatibleModels, setCompatibleModels] = useState(""); const [sku, setSku] = useState(""); const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState(""); const [quantity, setQuantity] = useState("0"); const [minimumStock, setMinimumStock] = useState("5");
  const [supplier, setSupplier] = useState(""); const [shelfLocation, setShelfLocation] = useState(""); const [notes, setNotes] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => { if (editingItem) { setItemName(editingItem.item_name); setCategory(editingItem.category || ""); setBrand(editingItem.brand || ""); setCompatibleModels(editingItem.compatible_models || ""); setSku(editingItem.sku || ""); setSellingPrice(String(editingItem.selling_price)); setCostPrice(editingItem.cost_price != null ? String(editingItem.cost_price) : ""); setQuantity(String(editingItem.quantity)); setMinimumStock(String(editingItem.minimum_stock)); setSupplier(editingItem.supplier || ""); setShelfLocation(editingItem.shelf_location || ""); setNotes(editingItem.notes || ""); } else resetForm(); }, [editingItem]);

  function resetForm() { setItemName(""); setCategory(""); setBrand(""); setCompatibleModels(""); setSku(""); setSellingPrice(""); setCostPrice(""); setQuantity("0"); setMinimumStock("5"); setSupplier(""); setShelfLocation(""); setNotes(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); await getCurrentSession();
    const parsedSellingPrice = Number(sellingPrice); const parsedCostPrice = costPrice ? Number(costPrice) : null; const parsedQuantity = quantity ? Number(quantity) : 0; const parsedMinimumStock = minimumStock ? Number(minimumStock) : 5;
    if (!itemName.trim()) return toast.error("Item name is required.");
    if (!sellingPrice || !Number.isFinite(parsedSellingPrice) || parsedSellingPrice <= 0) return toast.error("Selling price must be greater than 0.");
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0 || !Number.isInteger(parsedQuantity)) return toast.error("Quantity cannot be negative and must be a whole number.");
    if (!Number.isFinite(parsedMinimumStock) || parsedMinimumStock < 0 || !Number.isInteger(parsedMinimumStock)) return toast.error("Minimum stock cannot be negative and must be a whole number.");
    if (parsedCostPrice !== null && (!Number.isFinite(parsedCostPrice) || parsedCostPrice < 0)) return toast.error("Cost price cannot be negative.");
    setLoading(true);
    const payload = { item_name: itemName.trim(), category: category.trim() || null, brand: brand.trim() || null, compatible_models: compatibleModels.trim() || null, sku: sku.trim() || null, selling_price: parsedSellingPrice, cost_price: parsedCostPrice, quantity: parsedQuantity, minimum_stock: parsedMinimumStock, supplier: supplier.trim() || null, shelf_location: shelfLocation.trim() || null, notes: notes.trim() || null };
    const { error } = editingItem ? await inventoryService.updateInventoryItem(editingItem.id, payload) : await inventoryService.addInventoryItem(payload);
    setLoading(false); if (error) return toast.error(error.message);
    toast.success(editingItem ? "Item updated!" : "Item added!"); resetForm(); onSaved(); onCancelEdit();
  }

  return <Card><CardHeader><CardTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4">
    <Input placeholder="Item Name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} /><Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
    <Input placeholder="Compatible Models (e.g. iPhone 13, 13 Pro)" value={compatibleModels} onChange={(e) => setCompatibleModels(e.target.value)} />
    <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input type="number" min="0.01" step="0.01" placeholder="Selling Price" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required /><Input type="number" min="0" step="0.01" placeholder="Cost Price" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} /></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input type="number" min="0" step="1" placeholder="Quantity in Stock" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /><Input type="number" min="0" step="1" placeholder="Minimum Stock (alert threshold)" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} required /></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} /><Input placeholder="Shelf Location" value={shelfLocation} onChange={(e) => setShelfLocation(e.target.value)} /></div>
    <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
    <div className="flex gap-2"><Button type="submit" disabled={loading} className="flex-1">{loading ? "Saving..." : editingItem ? "Update Item" : "Save Item"}</Button>{editingItem && <Button type="button" variant="outline" onClick={onCancelEdit}>Cancel</Button>}</div>
  </form></CardContent></Card>;
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { supabase, getCurrentSession } from "@/lib/supabase";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InventoryFormProps = {
  editingItem: InventoryItem | null;
  onSaved: () => void;
  onCancelEdit: () => void;
};

export default function InventoryForm({
  editingItem,
  onSaved,
  onCancelEdit,
}: InventoryFormProps) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [compatibleModels, setCompatibleModels] = useState("");
  const [sku, setSku] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [minimumStock, setMinimumStock] = useState("5");
  const [supplier, setSupplier] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.item_name);
      setCategory(editingItem.category || "");
      setBrand(editingItem.brand || "");
      setCompatibleModels(editingItem.compatible_models || "");
      setSku(editingItem.sku || "");
      setSellingPrice(String(editingItem.selling_price));
      setCostPrice(editingItem.cost_price ? String(editingItem.cost_price) : "");
      setQuantity(String(editingItem.quantity));
      setMinimumStock(String(editingItem.minimum_stock));
      setSupplier(editingItem.supplier || "");
      setShelfLocation(editingItem.shelf_location || "");
      setNotes(editingItem.notes || "");
    } else {
      resetForm();
    }
  }, [editingItem]);

  function resetForm() {
    setItemName("");
    setCategory("");
    setBrand("");
    setCompatibleModels("");
    setSku("");
    setSellingPrice("");
    setCostPrice("");
    setQuantity("0");
    setMinimumStock("5");
    setSupplier("");
    setShelfLocation("");
    setNotes("");
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  // Ensure the client's session is fully restored before making any
  // authenticated request — prevents a race on fresh page loads.
  await getCurrentSession();

  if (!itemName.trim()) {
      toast.error("Item name is required.");
      return;
    }

    if (!sellingPrice || Number(sellingPrice) <= 0) {
      toast.error("Selling price is required.");
      return;
    }

    setLoading(true);

    const payload = {
      item_name: itemName.trim(),
      category: category.trim() || null,
      brand: brand.trim() || null,
      compatible_models: compatibleModels.trim() || null,
      sku: sku.trim() || null,
      selling_price: Number(sellingPrice),
      cost_price: costPrice ? Number(costPrice) : null,
      quantity: quantity ? Number(quantity) : 0,
      minimum_stock: minimumStock ? Number(minimumStock) : 5,
      supplier: supplier.trim() || null,
      shelf_location: shelfLocation.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = editingItem
      ? await inventoryService.updateInventoryItem(editingItem.id, payload)
      : await inventoryService.addInventoryItem(payload);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(editingItem ? "Item updated!" : "Item added!");
    resetForm();
    onSaved();
    onCancelEdit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              placeholder="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <Input
            placeholder="Compatible Models (e.g. iPhone 13, 13 Pro)"
            value={compatibleModels}
            onChange={(e) => setCompatibleModels(e.target.value)}
          />

          <Input
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Selling Price"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Cost Price"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Quantity in Stock"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Minimum Stock (alert threshold)"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
            <Input
              placeholder="Shelf Location"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
            />
          </div>

          <Input
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : editingItem ? "Update Item" : "Save Item"}
            </Button>

            {editingItem && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
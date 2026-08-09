"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type InventoryTableProps = {
  refreshKey: number;
  onEdit: (item: InventoryItem) => void;
};

export default function InventoryTable({
  refreshKey,
  onEdit,
}: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, [refreshKey]);

  async function fetchItems() {
    const { data, error } = await inventoryService.getInventory();

    if (error) {
      toast.error("Failed to load inventory.");
      return;
    }

    setItems(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;

    const { error } = await inventoryService.deleteInventoryItem(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Item deleted.");
    fetchItems();
  }

  const filtered = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Inventory List</h2>

        <Input
          placeholder="🔍 Search by name, SKU, or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6"
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isLow = item.quantity <= item.minimum_stock;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.item_name}</div>
                      {item.sku && (
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.brand || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.quantity}</span>
                        {isLow && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₦{item.selling_price}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { customerService } from "@/services/customerService";
import { inventoryService } from "@/services/inventoryService";
import { saleService } from "@/services/saleService";
import { PAYMENT_METHODS } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type CartLine = {
  inventory_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  available: number;
};

const selectClassName =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

type SaleFormProps = {
  onSaleCompleted: () => void;
};

export default function SaleForm({ onSaleCompleted }: SaleFormProps) {
  const [customers, setCustomers] = useState<{ id: string; full_name: string }[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [discount, setDiscount] = useState("0");
  const [staffName, setStaffName] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const [customersRes, inventoryRes] = await Promise.all([
      customerService.getCustomers(),
      inventoryService.getInventory(),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (inventoryRes.data) setInventory(inventoryRes.data);
  }

  function addToCart() {
    if (!selectedItemId) {
      toast.error("Select an item first.");
      return;
    }

    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) return;

    const qty = Number(selectedQty);

    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    const alreadyInCart = cart.find((c) => c.inventory_id === item.id);
    const totalRequested = qty + (alreadyInCart?.quantity || 0);

    if (totalRequested > item.quantity) {
      toast.error(`Only ${item.quantity} in stock.`);
      return;
    }

    if (alreadyInCart) {
      setCart(
        cart.map((c) =>
          c.inventory_id === item.id
            ? { ...c, quantity: c.quantity + qty }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          inventory_id: item.id,
          item_name: item.item_name,
          quantity: qty,
          unit_price: item.selling_price,
          available: item.quantity,
        },
      ]);
    }

    setSelectedItemId("");
    setSelectedQty("1");
  }

  function removeFromCart(inventoryId: string) {
    setCart(cart.filter((c) => c.inventory_id !== inventoryId));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.unit_price, 0);
  const total = subtotal - (Number(discount) || 0);

  async function handleCompleteSale() {
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart.");
      return;
    }

    await getCurrentSession();
    setLoading(true);

    const { error } = await saleService.createSale({
      customerId: customerId || null,
      paymentMethod,
      discount: Number(discount) || 0,
      staffName: staffName.trim() || null,
      notes: notes.trim() || null,
      items: cart.map((c) => ({
        inventory_id: c.inventory_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
      })),
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sale completed!");
    setCart([]);
    setCustomerId("");
    setDiscount("0");
    setStaffName("");
    setNotes("");
    loadOptions();
    onSaleCompleted();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Sale</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Customer (optional — walk-in if blank)
            </label>
            <select
              className={selectClassName}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Payment Method
            </label>
            <select
              className={selectClassName}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr />

        <div>
          <p className="mb-2 text-sm font-medium">Add Items</p>
          <div className="flex gap-2">
            <select
              className={selectClassName}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">Select an item...</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} — ₦{item.selling_price} ({item.quantity} in stock)
                </option>
              ))}
            </select>

            <Input
              type="number"
              placeholder="Qty"
              value={selectedQty}
              onChange={(e) => setSelectedQty(e.target.value)}
              className="w-24"
            />

            <Button type="button" onClick={addToCart}>
              Add
            </Button>
          </div>
        </div>

        {cart.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((line) => (
                <TableRow key={line.inventory_id}>
                  <TableCell>{line.item_name}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>₦{line.unit_price}</TableCell>
                  <TableCell>₦{line.quantity * line.unit_price}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFromCart(line.inventory_id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Staff Name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Discount"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>

        <Input
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Subtotal: ₦{subtotal}</p>
            <p className="text-lg font-bold">Total: ₦{total}</p>
          </div>

          <Button onClick={handleCompleteSale} disabled={loading}>
            {loading ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
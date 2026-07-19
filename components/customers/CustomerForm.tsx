"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CustomerFormProps = {
  onCustomerAdded: () => void;
  editingCustomer: Customer | null;
  onCancelEdit: () => void;
};

export default function CustomerForm({
  onCustomerAdded,
  editingCustomer,
  onCancelEdit,
}: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setFullName(editingCustomer.full_name);
      setPhone(editingCustomer.phone);
      setEmail(editingCustomer.email || "");
      setAddress(editingCustomer.address || "");
    } else {
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
    }
  }, [editingCustomer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    if (!fullName.trim()) {
      toast.error("Full Name is required.");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone Number is required.");
      setLoading(false);
      return;
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      toast.error("Please enter a valid email.");
      setLoading(false);
      return;
    }

    let error;

    if (editingCustomer) {
      ({ error } = await customerService.updateCustomer(
        editingCustomer.id,
        {
          full_name: fullName,
          phone,
          email,
          address,
        }
      ));
    } else {
      ({ error } = await customerService.addCustomer({
        full_name: fullName,
        phone,
        email,
        address,
      }));
    }

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(
      editingCustomer
        ? "Customer updated successfully!"
        : "Customer added successfully!"
    );

    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");

    onCustomerAdded();
    onCancelEdit();

    setLoading(false);
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>
          {editingCustomer ? "Edit Customer" : "Add Customer"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading
                ? "Saving..."
                : editingCustomer
                ? "Update Customer"
                : "Save Customer"}
            </Button>

            {editingCustomer && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
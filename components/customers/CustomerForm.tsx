"use client";

import { useState } from "react";
import { customerService } from "@/services/customerService";
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
};

export default function CustomerForm({
  onCustomerAdded,
}: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  // Validate Full Name
  if (!fullName.trim()) {
    alert("Full Name is required.");
    return;
  }

  // Validate Phone
  if (!phone.trim()) {
    alert("Phone Number is required.");
    return;
  }

  // Validate Email (optional)
  if (
    email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    alert("Please enter a valid email address.");
    return;
  }

  const { error } = await customerService.addCustomer({
    full_name: fullName,
    phone,
    email,
    address,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Customer added successfully!");

  setFullName("");
  setPhone("");
  setEmail("");
  setAddress("");

  onCustomerAdded();
}

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Add Customer</CardTitle>
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

          <Button type="submit" className="w-full">
            Save Customer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
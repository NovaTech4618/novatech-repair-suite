"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

    const { error } = await supabase.from("customers").insert([
      {
        full_name: fullName,
        phone,
        email,
        address,
      },
    ]);

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
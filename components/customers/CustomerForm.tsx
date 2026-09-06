"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCurrentSession } from "@/lib/supabase";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";

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
    await getCurrentSession();
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
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email.");
      setLoading(false);
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim() || null,
    };

    const { error } = editingCustomer
      ? await customerService.updateCustomer(editingCustomer.id, payload)
      : await customerService.addCustomer(payload);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(editingCustomer ? "Customer updated successfully!" : "Customer added successfully!");
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    onCustomerAdded();
    onCancelEdit();
    setLoading(false);
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" icon={<UserRound className="size-4" />}>
              <Input
                required
                placeholder="e.g. Abdullahi Salawu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-xl border-slate-200 pl-3 shadow-none focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
              />
            </Field>
            <Field label="Phone number" icon={<Phone className="size-4" />}>
              <Input
                required
                type="tel"
                placeholder="e.g. 0803 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-xl border-slate-200 pl-3 shadow-none focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email address" icon={<Mail className="size-4" />} optional>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-xl border-slate-200 shadow-none focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
              />
            </Field>
            <Field label="Address" icon={<MapPin className="size-4" />} optional>
              <Input
                placeholder="Customer address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10 rounded-xl border-slate-200 shadow-none focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            {editingCustomer && (
              <Button type="button" variant="outline" onClick={onCancelEdit} className="h-10 rounded-xl border-slate-200 px-5">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="h-10 rounded-xl bg-teal-700 px-5 font-semibold text-white shadow-sm hover:bg-teal-800 sm:min-w-36">
              {loading ? "Saving..." : editingCustomer ? "Update customer" : "Save customer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  icon,
  optional,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
        {optional && <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

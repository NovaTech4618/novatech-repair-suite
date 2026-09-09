"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserRound, Smartphone } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { customerService } from "@/services/customerService";
import { deviceService } from "@/services/deviceService";
import { repairService } from "@/services/repairService";
import { MANUAL_REPAIR_STATUSES, REPAIR_PRIORITIES } from "@/types/repair";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const input = "h-11 rounded-xl border-slate-200 bg-white";
const select = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function NewRepairPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("Phone");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [color, setColor] = useState("");
  const [issue, setIssue] = useState("");
  const [technician, setTechnician] = useState("");
  const [estimated, setEstimated] = useState("");
  const [deposit, setDeposit] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [priority, setPriority] = useState("Normal");
  const [expectedDate, setExpectedDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!customerName.trim() || !phone.trim()) return void toast.error("Customer name and phone are required.");
    if (!brand.trim() || !model.trim()) return void toast.error("Device brand and model are required.");
    if (!issue.trim()) return void toast.error("Tell us what is wrong with the device.");

    const estimatedCost = estimated ? Number(estimated) : null;
    const paid = deposit ? Number(deposit) : 0;
    if (estimatedCost !== null && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) return void toast.error("Estimated cost is invalid.");
    if (!Number.isFinite(paid) || paid < 0) return void toast.error("Deposit is invalid.");
    if (estimatedCost !== null && paid > estimatedCost) return void toast.error("Deposit cannot be greater than the estimated cost.");

    setLoading(true);
    try {
      const customer = await customerService.addCustomer({ full_name: customerName.trim(), phone: phone.trim(), email: null, address: null });
      if (customer.error || !customer.data?.id) throw new Error(customer.error?.message || "Could not create customer.");

      const device = await deviceService.addDevice({
        customer_id: customer.data.id,
        device_type: deviceType.trim() || "Phone",
        brand: brand.trim(), model: model.trim(), serial_number: serial.trim() || null,
        color: color.trim() || null, condition: null, accessories: null, problem: issue.trim(),
      });
      if (device.error || !device.data?.id) throw new Error(device.error?.message || "Could not create device.");

      const repair = await supabase.from("repairs").insert([{
        device_id: device.data.id,
        technician: technician.trim() || null,
        issue: issue.trim(), diagnosis: null, repair_notes: null, solution: null,
        priority, deposit: 0, expected_completion_date: expectedDate || null,
        estimated_cost: estimatedCost, final_cost: null,
        status: MANUAL_REPAIR_STATUSES[0],
      }]).select("id").single();
      if (repair.error || !repair.data?.id) throw new Error(repair.error?.message || "Could not create repair.");

      if (paid > 0) {
        const payment = await repairService.recordPayment(repair.data.id, paid, paymentMethod);
        if (payment.error) throw new Error(`Repair was created, but the deposit could not be recorded: ${payment.error.message}`);
      }

      toast.success("Walk-in repair created successfully.");
      window.location.href = `/repairs/${repair.data.id}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create repair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-4xl space-y-5 p-5 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Link href="/repairs" className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft className="size-4" /></Link>
          <div><p className="text-sm font-medium text-teal-700">Repair desk</p><h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">New walk-in repair</h1><p className="mt-1 text-sm text-slate-500">Create the customer, device and repair job together at the counter.</p></div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-teal-700" /> Customer</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label><Input className={input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" autoComplete="name" required /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label><Input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..." inputMode="tel" autoComplete="tel" required /></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4 text-teal-700" /> Device</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label><select className={select} value={deviceType} onChange={(e) => setDeviceType(e.target.value)}><option>Phone</option><option>Tablet</option><option>Laptop</option><option>Watch</option><option>Other</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label><Input className={input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Tecno, iPhone, Samsung..." required /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Model</label><Input className={input} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camon 20, iPhone 13..." required /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">IMEI / Serial</label><Input className={input} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Optional" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Color</label><Input className={input} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Optional" /></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-base">Repair job</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Customer complaint / problem</label><textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the fault exactly as reported by the customer..." required /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Technician</label><Input className={input} value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="Optional" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Expected completion</label><Input className={input} type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></div></div>
              <div className="grid gap-4 sm:grid-cols-3"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated cost</label><Input className={input} type="number" min="0" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="0" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Deposit paid</label><Input className={input} type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Payment method</label><select className={select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></div></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label><select className={select} value={priority} onChange={(e) => setPriority(e.target.value)}>{REPAIR_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/repairs" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</Link><Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-slate-800" disabled={loading}>{loading ? "Creating repair..." : "Create walk-in repair"}</Button></div>
        </form>
      </main>
    </AppLayout>
  );
}

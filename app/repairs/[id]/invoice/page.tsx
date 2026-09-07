"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { repairService } from "@/services/repairService";
import { businessOperationsService } from "@/services/businessOperationsService";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function RepairInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [repair, setRepair] = useState<any>(null);
  const [description, setDescription] = useState("Repair service");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await repairService.getRepairById(params.id);
      if (error || !data) toast.error(error?.message || "Repair not found.");
      else {
        setRepair(data);
        setAmount(String(Number(data.final_cost ?? data.estimated_cost ?? 0)));
        setDescription(`${data.devices?.brand ?? "Device"} ${data.devices?.model ?? "repair"} · ${data.issue || "Repair service"}`);
      }
      setLoading(false);
    }
    if (params.id) void load();
  }, [params.id]);

  async function createInvoice() {
    if (!repair) return;
    const amountValue = Number(amount);
    const discountValue = Number(discount || 0);
    if (!Number.isFinite(amountValue) || amountValue < 0) return toast.error("Enter a valid repair amount.");
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > amountValue) return toast.error("Enter a valid discount.");
    if (!description.trim()) return toast.error("Add an invoice description.");

    setSaving(true);
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { data, error } = await businessOperationsService.createRepairInvoice({
      repairId: repair.id,
      invoiceNumber,
      description: description.trim(),
      amount: amountValue,
      discount: discountValue,
    });
    setSaving(false);
    if (error) return toast.error(error.message);

    const invoiceId = typeof data === "string" ? data : data?.id ?? data?.invoice_id;
    if (!invoiceId) return toast.error("Invoice was created but its ID could not be returned.");
    toast.success(`Invoice ${invoiceNumber} created.`);
    router.push(`/invoices/${invoiceId}`);
  }

  if (loading) return <AppLayout><main className="mx-auto max-w-3xl p-5 sm:p-8"><div className="h-48 animate-pulse rounded-2xl bg-slate-100" /></main></AppLayout>;
  if (!repair) return <AppLayout><main className="mx-auto max-w-3xl p-5 sm:p-8"><Card><CardContent className="p-10 text-center"><p className="font-semibold">Repair not found</p><Button asChild className="mt-4"><Link href="/repairs">Back to repairs</Link></Button></CardContent></Card></main></AppLayout>;

  const device = repair.devices;
  const customer = device?.customers;
  const total = Math.max(Number(amount || 0) - Number(discount || 0), 0);

  return <AppLayout><main className="mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8">
    <Link href={`/repairs/${repair.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"><ArrowLeft className="size-4" />Back to repair</Link>
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-100 p-2 text-teal-700"><FileText className="size-5" /></div><div><CardTitle className="font-heading">Create repair invoice</CardTitle><p className="mt-1 text-sm text-slate-500">Create the financial record directly from this repair.</p></div></div></CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-7">
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p><p className="mt-1 font-semibold text-slate-900">{customer?.full_name || "Walk-in customer"}</p><p className="text-sm text-slate-500">{customer?.phone || "No phone recorded"}</p><div className="mt-3 border-t pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Device / repair</p><p className="mt-1 font-semibold">{device?.brand} {device?.model}</p><p className="text-sm text-slate-500">{repair.issue || "Repair service"}</p></div></div>
        <label className="block text-sm font-medium">Invoice description<Input className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Repair amount (₦)<Input className="mt-1.5" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label className="block text-sm font-medium">Discount (₦)<Input className="mt-1.5" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label></div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 text-white"><span className="text-sm text-slate-300">Invoice total</span><strong className="text-xl">{money(total)}</strong></div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" asChild><Link href={`/repairs/${repair.id}`}>Cancel</Link></Button><Button onClick={createInvoice} disabled={saving}>{saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating...</> : "Create Invoice"}</Button></div>
      </CardContent>
    </Card>
  </main></AppLayout>;
}

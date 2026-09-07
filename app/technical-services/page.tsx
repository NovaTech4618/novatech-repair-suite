"use client";

import { FormEvent, useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

export default function TechnicalServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  async function loadServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("technical_services")
      .select("id,name,description,price,is_active")
      .order("is_active", { ascending: false })
      .order("name");
    if (error) toast.error(error.message);
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, []);

  async function addService(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || Number(price) < 0) return toast.error("Enter a service name and valid price.");
    setSaving(true);
    const { data: profile } = await supabase.auth.getUser();
    const userId = profile.user?.id;
    if (!userId) { setSaving(false); return toast.error("Please log in again."); }
    const { data: me } = await supabase.from("profiles").select("company_id").eq("id", userId).maybeSingle();
    const { data: branch } = await supabase.from("branches").select("id").eq("company_id", me?.company_id ?? "").eq("is_active", true).order("is_main", { ascending: false }).limit(1).maybeSingle();
    if (!me?.company_id || !branch?.id) { setSaving(false); return toast.error("No active workshop branch is available."); }
    const { error } = await supabase.from("technical_services").insert({ company_id: me.company_id, branch_id: branch.id, name: name.trim(), description: description.trim() || null, price: Number(price) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Technical service added.");
    setName(""); setDescription(""); setPrice("");
    loadServices();
  }

  async function toggleService(service: Service) {
    const { error } = await supabase.from("technical_services").update({ is_active: !service.is_active, updated_at: new Date().toISOString() }).eq("id", service.id);
    if (error) toast.error(error.message); else loadServices();
  }

  const active = services.filter((s) => s.is_active).length;
  const totalValue = services.filter((s) => s.is_active).reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">Workshop catalogue</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950">Technical Services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Define the labour and technical services your workshop sells, with consistent pricing for repairs and POS.</p></div>
            <div className="flex gap-3 text-sm"><div className="rounded-xl border bg-slate-50 px-4 py-3"><b>{active}</b><span className="ml-2 text-slate-500">Active</span></div><div className="rounded-xl border bg-slate-50 px-4 py-3"><b>₦{totalValue.toLocaleString()}</b><span className="ml-2 text-slate-500">Catalogue value</span></div></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5"><h2 className="font-heading text-lg font-semibold">Add service</h2><p className="text-sm text-slate-500">Examples: Screen replacement labour, Software flashing, FRP removal, Charging-port repair.</p></div>
          <form onSubmit={addService} className="grid gap-4 md:grid-cols-[1fr_1.3fr_180px_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-500" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-500" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Price (₦)" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-500" />
            <button disabled={saving} className="h-11 rounded-lg bg-teal-700 px-5 font-semibold text-white disabled:opacity-50">{saving ? "Adding..." : "Add service"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-heading text-lg font-semibold">Service catalogue</h2></div>
          {loading ? <div className="p-8 text-sm text-slate-500">Loading services...</div> : services.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-slate-800">No technical services yet</p><p className="mt-1 text-sm text-slate-500">Add your first service above.</p></div> : <div className="divide-y divide-slate-100">{services.map((service) => <div key={service.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><h3 className="font-semibold text-slate-900">{service.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${service.is_active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>{service.is_active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-slate-500">{service.description || "No description"}</p></div><div className="flex items-center gap-4"><span className="font-mono font-semibold">₦{Number(service.price).toLocaleString()}</span><button onClick={() => toggleService(service)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">{service.is_active ? "Deactivate" : "Activate"}</button></div></div>)}</div>}
        </section>
      </div>
    </AppLayout>
  );
}

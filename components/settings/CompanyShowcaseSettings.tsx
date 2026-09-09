"use client";

import { useState } from "react";
import { Eye, Globe2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { settingsService } from "@/services/settingsService";

export default function CompanyShowcaseSettings({
  companyId,
  initialSlug,
  initialEnabled,
  initialDescription,
  initialPhone,
  initialAddress,
  initialServices,
}: {
  companyId: string;
  initialSlug: string;
  initialEnabled: boolean;
  initialDescription: string | null;
  initialPhone: string | null;
  initialAddress: string | null;
  initialServices: string[];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [slug, setSlug] = useState(initialSlug);
  const [description, setDescription] = useState(initialDescription || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [services, setServices] = useState(initialServices.join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleanSlug) {
      toast.error("Choose a public showcase name.");
      return;
    }
    setSaving(true);
    const { error } = await settingsService.updateShowcase(companyId, {
      slug: cleanSlug,
      showcase_enabled: enabled,
      showcase_description: description.trim() || null,
      showcase_phone: phone.trim() || null,
      showcase_address: address.trim() || null,
      showcase_services: services.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save showcase settings.");
      return;
    }
    setSlug(cleanSlug);
    toast.success(enabled ? "Public showcase is live." : "Public showcase saved and hidden.");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Globe2 className="size-5" /></div>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-950">Public business showcase</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Give customers a simple public page for your business. Internal customers, repairs, stock, payments and staff records stay private.</p>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-teal-600" />
          Publish showcase
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Public link name</label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="your-business" /><p className="mt-1.5 text-xs text-slate-400">Your page will use /showcase/{slug || "your-business"}</p></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Public phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Business phone number" /></div>
        <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-slate-600">Short business description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers what your business does." rows={3} /></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Address</label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business location" /></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Services</label><Input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Phone repair, accessories, software service" /><p className="mt-1.5 text-xs text-slate-400">Separate services with commas.</p></div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={saving} className="gap-2"><Save className="size-4" />{saving ? "Saving…" : "Save showcase"}</Button>
        {enabled && <a href={`/showcase/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="size-4" />View public page</a>}
      </div>
    </section>
  );
}

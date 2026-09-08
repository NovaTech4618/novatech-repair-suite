"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CircleHelp, ImagePlus, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { settingsService } from "@/services/settingsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => { void fetchSettings(); }, []);

  async function fetchSettings() {
    const { data, error } = await settingsService.getProfileAndCompany();
    setLoading(false);
    if (error || !data) {
      console.error("Settings load error:", error);
      toast.error("Failed to load settings.");
      return;
    }
    setUserId(data.id);
    setCompanyId(data.company_id);
    setFullName(data.full_name || "");
    setRole(data.role || "");
    const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
    setCompanyName(company?.name || "");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSavingProfile(true);
    const { error } = await settingsService.updateFullName(userId, fullName.trim());
    setSavingProfile(false);
    if (error) toast.error(error.message); else toast.success("Profile updated!");
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !companyName.trim()) {
      toast.error("Business name is required.");
      return;
    }
    setSavingCompany(true);
    const { error } = await settingsService.updateCompanyName(companyId, companyName.trim());
    setSavingCompany(false);
    if (error) toast.error(error.message); else toast.success("Business name updated!");
  }

  if (loading) {
    return <AppLayout><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading settings…</div></AppLayout>;
  }

  const initial = (companyName || "N").charAt(0).toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Business control center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your identity, business workspace and the services around it.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">{role || "Staff"}</span>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-950/10 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-teal-400 font-heading text-2xl font-bold text-slate-950">{initial}</div>
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Current workspace</p><h2 className="mt-2 truncate font-heading text-2xl font-bold">{companyName || "Your business"}</h2><p className="mt-2 text-sm text-slate-400">This business identity is the tenant boundary used by your staff, branches and operational records.</p></div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start gap-4"><div className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-600"><ImagePlus className="size-5" /></div><div><p className="font-semibold text-slate-950">Company picture</p><p className="mt-1 text-sm leading-6 text-slate-500">A dedicated logo area belongs here. Secure storage upload is intentionally not faked until the company branding storage flow is wired.</p></div></div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
            <CardContent><form onSubmit={handleSaveProfile} className="space-y-4"><div><label className="mb-1 block text-xs text-muted-foreground">Full Name</label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></div><Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Profile"}</Button></form></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Business Details</CardTitle></CardHeader>
            <CardContent><form onSubmit={handleSaveCompany} className="space-y-4"><div><label className="mb-1 block text-xs text-muted-foreground">Business / Shop Name</label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your business name" /></div><Button type="submit" disabled={savingCompany}>{savingCompany ? "Saving…" : "Save Business Details"}</Button></form></CardContent>
          </Card>
        </div>

        <section>
          <h2 className="font-heading text-lg font-bold text-slate-950">Workspace services</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SettingsLink href="/settings/subscription" icon={Sparkles} title="Subscription" text="View your current plan and future upgrades." />
            <SettingsLink href="/whatsapp" icon={MessageCircle} title="WhatsApp" text="Open customer communication tools." />
            <SettingsLink href="/staff" icon={Building2} title="Staff & Branches" text="Manage your team and locations." />
            <SettingsLink href="/help" icon={CircleHelp} title="Help & Support" text="Guides, quick links and system status." />
          </div>
        </section>

        <Link href="/audit" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm hover:border-slate-300"><ShieldCheck className="size-5 text-slate-500" /><span><strong className="text-slate-900">Audit Log</strong><span className="ml-2 text-slate-500">Manager/owner security history stays separate from ordinary business activity.</span></span></Link>
      </div>
    </AppLayout>
  );
}

function SettingsLink({ href, icon: Icon, title, text }: { href: string; icon: typeof Sparkles; title: string; text: string }) {
  return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" /></div><p className="mt-4 font-semibold text-slate-950">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></Link>;
}

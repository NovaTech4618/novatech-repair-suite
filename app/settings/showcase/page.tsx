"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CompanyShowcaseSettings from "@/components/settings/CompanyShowcaseSettings";
import { settingsService } from "@/services/settingsService";

export default function ShowcaseSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void settingsService.getProfileAndCompany().then(({ data }) => { setData(data); setLoading(false); }); }, []);
  if (loading) return <AppLayout><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading showcase settings…</div></AppLayout>;
  const company = Array.isArray(data?.companies) ? data.companies[0] : data?.companies;
  if (!data?.company_id || !company) return <AppLayout><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Business workspace not found.</div></AppLayout>;
  return <AppLayout><div className="space-y-6"><Link href="/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />Back to Settings</Link><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Business identity</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950">Your public presence</h1><p className="mt-1 text-sm text-slate-500">Control what customers see outside your private workspace.</p></div><CompanyShowcaseSettings companyId={data.company_id} initialShowcaseName={company.showcase_name} initialSlug={company.slug || ""} initialEnabled={company.showcase_enabled || false} initialDescription={company.showcase_description} initialPhone={company.showcase_phone} initialAddress={company.showcase_address} initialServices={company.showcase_services || []} /></div></AppLayout>;
}

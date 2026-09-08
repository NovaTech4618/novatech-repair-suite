"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { getCurrentSession, supabase } from "@/lib/supabase";

export default function SubscriptionPage() {
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const session = await getCurrentSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", session.user.id).maybeSingle();
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("company_subscriptions").select("plan,status").eq("company_id", profile.company_id).maybeSingle();
    if (data) {
      setPlan(data.plan || "free");
      setStatus(data.status || "active");
    }
    setLoading(false);
  }

  const label = plan.toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Workspace plan</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Subscription</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">Your plan is visible here now, while paid checkout can be connected later without changing the rest of the workspace.</p>
        </header>

        <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          {loading ? <p className="text-sm text-slate-500">Loading subscription…</p> : <>
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current plan</p><p className="mt-2 font-heading text-3xl font-bold text-slate-950">{label}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">{status}</span></div>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="font-semibold text-slate-950">Premium features</p><p className="mt-1 text-sm leading-6 text-slate-500">Premium is prepared in the product architecture, but payment and checkout are intentionally not enabled yet.</p></div>
            <p className="mt-5 text-xs text-slate-400">No payment is required for the current workspace.</p>
          </>}
        </section>

        <div className="flex flex-wrap gap-3"><Link href="/settings" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Back to Settings</Link><Link href="/help" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300">Help & Support</Link></div>
      </div>
    </AppLayout>
  );
}

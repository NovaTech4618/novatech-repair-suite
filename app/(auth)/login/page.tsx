"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "setup" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureCompanyThenRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    if (profile?.company_id) { setLoading(false); router.push("/dashboard"); return; }
    const { data: joinedCompanyId, error: inviteError } = await supabase.rpc("accept_staff_invitation");
    setLoading(false);
    if (!inviteError && joinedCompanyId) { toast.success("Welcome to the team!"); router.push("/dashboard"); return; }
    setMode("setup");
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { toast.error("Business name is required."); return; }
    setLoading(true);
    const { error } = await supabase.rpc("create_company_for_new_user", { company_name: companyName });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to Novatech Repair Suite!");
    router.push("/dashboard");
  }

  async function resendVerification() {
    if (!email.trim()) { toast.error("Enter your email first."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verification email sent again.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Email and password are required."); return; }
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { toast.error(error.message); setLoading(false); return; }
      if (!data.session) { setLoading(false); setMode("verify"); return; }
      await ensureCompanyThenRedirect();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setLoading(false);
        setMode("verify");
        return;
      }
      toast.error(error.message); setLoading(false); return;
    }
    await ensureCompanyThenRedirect();
  }

  if (mode === "verify") {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-10">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-500/10 text-2xl text-teal-300">✉</div>
            <h1 className="mt-6 text-center font-heading text-3xl font-bold">Check your email</h1>
            <p className="mt-3 text-center text-sm leading-6 text-slate-400">We sent a verification link to <strong className="text-slate-200">{email}</strong>. Verify your email, then return here to log in.</p>
            <button type="button" onClick={resendVerification} disabled={loading} className="mt-7 w-full rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? "Sending..." : "Resend verification email"}</button>
            <button type="button" onClick={() => setMode("login")} className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:border-slate-500">Back to login</button>
            <p className="mt-6 text-center text-xs text-slate-500">Check your spam or promotions folder if you don't see it.</p>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "setup") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="text-center"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-teal-500 font-heading text-xl font-bold text-slate-950">N</div><h1 className="mt-5 font-heading text-2xl font-bold">Set up your workshop</h1><p className="mt-2 text-sm text-slate-400">Your account is ready. Give your business a name to create its workspace.</p></div>
          <form onSubmit={handleCreateCompany} className="mt-7 space-y-4"><label className="block text-sm font-semibold text-slate-300">Business / Shop name<input type="text" placeholder="e.g. Danchrista Four Communications" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400" /></label><button type="submit" disabled={loading} className="w-full rounded-xl bg-teal-500 p-3.5 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? "Setting up..." : "Create my workspace"}</button></form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-12 lg:grid-cols-[1fr_420px]">
        <div className="hidden lg:block"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-teal-500 font-heading text-xl font-bold text-slate-950">N</div><div><div className="font-heading text-lg font-bold">NOVATECH</div><div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">REPAIR SUITE</div></div></div><h1 className="mt-10 max-w-xl font-heading text-5xl font-bold leading-tight">Your workshop, organized from intake to pickup.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Manage customers, repairs, engineers, parts, inventory, sales, payments and business records in one workspace.</p><div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2"><span>✓ Track every repair</span><span>✓ Control workshop stock</span><span>✓ Account for engineer parts</span><span>✓ Know what customers owe</span></div></div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9">
          <div className="text-center"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-teal-500 font-heading text-xl font-bold text-slate-950 lg:hidden">N</div><h1 className="mt-4 font-heading text-3xl font-bold">NOVATECH Repair Suite</h1><p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Log in to your workshop" : "Create your workshop account"}</p></div>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold text-slate-300">Email<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none focus:border-teal-400" /></label>
            <label className="block text-sm font-semibold text-slate-300">Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none focus:border-teal-400" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-teal-500 p-3.5 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50">{loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
          </form>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 w-full text-center text-sm font-semibold text-teal-300 hover:text-teal-200">{mode === "login" ? "Don't have an account? Create one" : "Already have an account? Log in"}</button>
          {mode === "signup" && <p className="mt-5 text-center text-xs leading-5 text-slate-500">You'll verify your email before entering the workshop, then NOVATECH will guide you through setting up your business.</p>}
        </div>
      </div>
    </main>
  );
}

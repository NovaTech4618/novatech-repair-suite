"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "setup" | "verify" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    const { error } = await supabase.rpc("create_company_for_new_user", { company_name: companyName.trim() });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to NOVATECH!");
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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email first."); return; }
    setLoading(true);
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset email sent.");
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
      toast.error("Unable to sign in. Check your email and password.");
      setLoading(false);
      return;
    }
    await ensureCompanyThenRedirect();
  }

  if (mode === "verify") {
    return (
      <main className="min-h-screen bg-[#f5f7f6] px-5 py-6 text-slate-950 sm:px-8">
        <div className="mx-auto flex min-h-[92vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)] sm:p-10">
            <BrandMark />
            <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Mail className="size-6" /></div>
            <h1 className="mt-6 text-center font-heading text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-3 text-center text-sm leading-6 text-slate-500">We sent a verification link to <strong className="font-semibold text-slate-800">{email}</strong>.</p>
            <button type="button" onClick={resendVerification} disabled={loading} className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Sending…" : "Resend verification email"}</button>
            <button type="button" onClick={() => setMode("login")} className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Back to sign in</button>
            <p className="mt-6 text-center text-xs text-slate-400">Check spam or promotions if it doesn’t arrive.</p>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "setup") {
    return (
      <main className="min-h-screen bg-[#f5f7f6] px-5 py-6 text-slate-950 sm:px-8">
        <div className="mx-auto flex min-h-[92vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)] sm:p-10">
            <BrandMark />
            <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">First step</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Set up your workshop</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your account is ready. Give the business a name and NOVATECH will create the workspace.</p></div>
            <form onSubmit={handleCreateCompany} className="mt-7 space-y-4">
              <FieldLabel label="Business / shop name"><input type="text" autoFocus placeholder="e.g. Danchrista Four Communications" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="control" /></FieldLabel>
              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Creating workspace…" : "Create my workspace"}<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "forgot") {
    return (
      <main className="min-h-screen bg-[#f5f7f6] px-5 py-6 text-slate-950 sm:px-8">
        <div className="mx-auto flex min-h-[92vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)] sm:p-10">
            <BrandMark />
            <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Account recovery</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Reset your password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Enter your account email and we’ll send a secure reset link.</p></div>
            <form onSubmit={handleForgotPassword} className="mt-7 space-y-4">
              <FieldLabel label="Email"><input type="email" autoFocus autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="control" /></FieldLabel>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Sending reset link…" : "Send reset link"}</button>
            </form>
            <button type="button" onClick={() => setMode("login")} className="mt-5 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-900">Back to sign in</button>
          </div>
        </div>
      </main>
    );
  }

  const signup = mode === "signup";

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_90%_75%,rgba(20,184,166,0.12),transparent_34%)]" />
          <div className="relative"><BrandMark dark /><div className="mt-20 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">The calmer repair desk</p><h2 className="mt-5 font-heading text-5xl font-bold leading-[1.02] tracking-[-0.04em] xl:text-6xl">Run the shop without the notebook-and-WhatsApp chaos.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Keep customers, devices, repairs, engineers, stock and payments connected from intake to pickup.</p></div></div>
          <div className="relative grid max-w-xl gap-3 sm:grid-cols-2"><Benefit text="Track every repair" /><Benefit text="Know every part" /><Benefit text="See what customers owe" /><Benefit text="Keep engineers accountable" /></div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-8 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden"><BrandMark /></div>
            <div className="mb-8 mt-10 lg:mt-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{signup ? "Create your workspace" : "Welcome back"}</p><h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">{signup ? "Start with NOVATECH." : "Sign in to your workshop."}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{signup ? "Create your account, then set up the business workspace." : "Everything you need to run the repair desk is here."}</p></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldLabel label="Email"><div className="relative"><Mail className="icon" /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="control pl-11" /></div></FieldLabel>
              <FieldLabel label="Password"><div className="relative"><LockKeyhole className="icon" /><input type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="control pl-11 pr-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></FieldLabel>
              {!signup && <div className="flex justify-end"><button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-teal-700 hover:text-teal-800">Forgot password?</button></div>}
              <button type="submit" disabled={loading} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Please wait…" : signup ? "Create account" : "Sign in"}<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></button>
            </form>

            <div className="mt-7 flex items-center gap-3 text-[11px] font-medium text-slate-400"><div className="h-px flex-1 bg-slate-200" />SECURE WORKSPACE<div className="h-px flex-1 bg-slate-200" /></div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-teal-700" />Your workspace is protected by your account permissions.</div>
            <button type="button" onClick={() => setMode(signup ? "login" : "signup")} className="mt-7 w-full text-center text-sm font-semibold text-teal-700 hover:text-teal-800">{signup ? "Already have an account? Sign in" : "New to NOVATECH? Create an account"}</button>
            {signup && <p className="mt-5 text-center text-xs leading-5 text-slate-400">You’ll verify your email before entering the workshop.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandMark({ dark = false }: { dark?: boolean }) {
  return <div className="flex items-center gap-3"><div className={`grid size-11 place-items-center rounded-xl font-heading text-xl font-bold ${dark ? "bg-teal-400 text-slate-950" : "bg-slate-950 text-white"}`}>N</div><div><div className={`font-heading text-lg font-bold ${dark ? "text-white" : "text-slate-950"}`}>NOVATECH</div><div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-400"}`}>Repair Suite</div></div></div>;
}

function Benefit({ text }: { text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><span className="grid size-7 place-items-center rounded-full bg-teal-400/10 text-teal-300"><Check className="size-4" /></span>{text}</div>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-800">{label}{children}</label>;
}

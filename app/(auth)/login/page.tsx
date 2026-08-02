"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup" | "setup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  // After any successful sign-in, make sure this user actually has a
  // company. If not (e.g. they confirmed their email outside the app,
  // or something failed during signup), send them to setup instead of
  // straight to the dashboard.
  async function ensureCompanyThenRedirect() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    setLoading(false);

    if (profile?.company_id) {
      router.push("/dashboard");
    } else {
      setMode("setup");
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc("create_company_for_new_user", {
      company_name: companyName,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome to Novatech Repair Suite!");
    router.push("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        toast.success(
          "Account created! Check your email to confirm, then log in."
        );
        setMode("login");
        setLoading(false);
        return;
      }

      setMode("setup");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    await ensureCompanyThenRedirect();
  }

  if (mode === "setup") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold">
            Set Up Your Shop
          </h1>
          <p className="mb-6 text-center text-sm text-slate-500">
            One last step — name your business.
          </p>

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <input
              type="text"
              placeholder="Business / Shop Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Novatech Repair Suite
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {mode === "login" ? "Log in to your shop" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
        >
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}
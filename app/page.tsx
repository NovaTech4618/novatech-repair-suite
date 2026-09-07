"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getCurrentSession } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    getCurrentSession().then((session) => {
      if (!active) return;
      router.replace(session ? "/dashboard" : "/login");
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto mb-4 size-10 animate-pulse rounded-xl bg-teal-600" />
        <h1 className="font-heading text-2xl font-bold text-slate-950">
          Novatech Repair Suite
        </h1>
        <p className="mt-2 text-sm text-slate-500">Loading your workshop...</p>
      </div>
    </main>
  );
}

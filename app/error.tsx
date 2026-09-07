"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the error boundary intentionally quiet in production.
    // The hosting platform can capture the runtime error separately.
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="size-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">NOVATECH</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This page hit an unexpected problem. Your saved business data is not removed by this screen.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </section>
    </main>
  );
}

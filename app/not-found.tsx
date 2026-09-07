import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <SearchX className="size-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">NOVATECH</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The page you requested does not exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}

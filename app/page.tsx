import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Repair Shop Management Software",
  description:
    "NOVATECH Repair Suite helps repair shops manage customers, devices, repairs, inventory, engineers, sales, payments and business finances in one place.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "NOVATECH Repair Suite | Repair Shop Management Software",
    description:
      "Manage repairs, customers, inventory, engineers, sales and payments from one professional repair-shop system.",
    type: "website",
    siteName: "NOVATECH Repair Suite",
  },
};

const features = [
  ["Repairs", "Track every device from intake to completion and pickup."],
  ["Inventory", "Control stock, purchases, transfers and low-stock items."],
  ["Customers", "Keep customer details, devices, repairs and balances together."],
  ["Engineers", "Assign work and track parts issued, returns and accountability."],
  ["Sales & Payments", "Handle POS sales, invoices, receipts and outstanding balances."],
  ["Reports", "Understand workshop activity, stock and financial performance."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-6 lg:px-8">
          <header className="flex items-center justify-between">
            <div>
              <div className="font-heading text-xl font-bold tracking-tight">NOVATECH</div>
              <div className="text-xs font-medium text-slate-400">REPAIR SUITE</div>
            </div>
            <Link href="/login" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold transition hover:border-teal-400 hover:text-teal-300">
              Sign in
            </Link>
          </header>

          <div className="grid gap-14 py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-32">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Built for repair shops
              </div>
              <h1 className="max-w-3xl font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Run your repair shop from one place.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                NOVATECH Repair Suite brings repairs, customers, inventory, engineers, sales and payments into one clear workflow so your team can spend less time chasing records and more time fixing devices.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400">
                  Open Repair Suite
                </Link>
                <a href="#features" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
                  Explore features
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Workshop overview</p>
                  <p className="text-xs text-slate-500">Everything in one workflow</p>
                </div>
                <div className="size-3 rounded-full bg-teal-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Active repairs", "24"], ["Low stock", "7"], ["Outstanding", "₦186k"], ["Engineers", "5"]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 font-data text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400"><span>Repair workflow</span><span>Live</span></div>
                <div className="mt-3 flex gap-1">
                  {["Intake", "Assigned", "Repair", "Payment", "Pickup"].map((step) => (
                    <div key={step} className="flex-1 rounded bg-teal-500/20 px-2 py-2 text-center text-[10px] font-semibold text-teal-300">{step}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-400">One system</p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">The tools your workshop actually needs.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, description]) => (
              <article key={title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
                <h3 className="font-heading text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 px-6 py-12 text-center sm:px-12">
          <h2 className="font-heading text-3xl font-bold tracking-tight">Ready to run the workshop better?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">Sign in to your NOVATECH Repair Suite workspace and get back to work.</p>
          <Link href="/login" className="mt-7 inline-flex rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400">
            Sign in to Repair Suite
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} NOVATECH Repair Suite. Repair-shop management software.
      </footer>
    </main>
  );
}

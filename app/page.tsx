import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Repair Shop Management Software | NOVATECH",
  description:
    "NOVATECH gives repair shops one calm workspace for repairs, customers, inventory, engineers, payments and day-to-day operations.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "NOVATECH Repair Suite",
    description: "Run the repair shop without the notebook-and-WhatsApp chaos.",
    type: "website",
    siteName: "NOVATECH Repair Suite",
  },
};

const workflow = [
  ["01", "Take it in", "Capture the customer, device, fault and condition once."],
  ["02", "Work the job", "Assign the engineer and keep parts, status and notes together."],
  ["03", "Close it out", "Collect payment, send the update and hand the device back confidently."],
] as const;

const outcomes = [
  ["Know every repair", "See who owns the job, what has happened, what is delayed and what the customer is still waiting for."],
  ["Control every part", "Track stock, purchases, transfers and technician accountability without chasing handwritten records."],
  ["Understand the money", "Connect sales, repair payments, invoices, customer balances and business costs into one picture."],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-950">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f6f7f5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 font-heading text-lg font-bold text-white">N</span>
            <span>
              <span className="block font-heading text-lg font-bold tracking-tight">NOVATECH</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Repair Suite</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <a href="#solution" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block">Solution</a>
            <a href="#workflow" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block">How it works</a>
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Sign in</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.16),transparent_34%),radial-gradient(circle_at_10%_35%,rgba(15,23,42,0.06),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border border-teal-600/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700 shadow-sm">Built around the repair shop</div>
            <h1 className="mx-auto mt-7 max-w-4xl font-heading text-5xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-8xl">Every repair. Every part. Every payment. One place.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">NOVATECH replaces the notebooks, scattered chats and disconnected records that make a busy repair business harder to run than it needs to be.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800">Start your workshop</Link>
              <a href="#solution" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400">See the solution</a>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-2 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] sm:p-3">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900">
              <div className="aspect-video bg-[radial-gradient(circle_at_20%_25%,rgba(45,212,191,0.16),transparent_28%),linear-gradient(135deg,#0f172a,#111827_55%,#0b1120)]" aria-label="NOVATECH repair workflow story video">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full max-w-3xl">
                    <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      <span>NOVATECH Repair Story</span>
                      <span>8 sec · workshop flow</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-5">
                      {["DEVICE ARRIVES", "ENGINEER", "PARTS", "CUSTOMER", "COLLECTED"].map((label, index) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                          <div className="grid size-8 place-items-center rounded-full bg-teal-400/15 text-xs font-bold text-teal-300">{index + 1}</div>
                          <p className="mt-4 text-[11px] font-semibold text-white">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-1/5 animate-pulse bg-teal-400" />
                    </div>
                    <p className="mt-5 text-center text-sm font-medium text-slate-300">Less chaos. More control.</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-slate-950/90 px-5 py-3 text-center text-xs text-slate-400">Product story preview · a real repair-shop workflow from intake to collection</div>
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The problem NOVATECH solves</p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">A repair shop should not depend on memory.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">A customer asks about a device. Someone checks WhatsApp. A technician remembers a part. A payment is written in a notebook. Later, nobody is completely sure what happened. NOVATECH brings those threads into one operational record.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {outcomes.map(([title, description], index) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
              <span className="font-data text-sm font-bold text-teal-700">0{index + 1}</span>
              <h3 className="mt-6 font-heading text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">One clean workflow</p>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">From the front desk to the workshop and back.</h2>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {workflow.map(([number, title, description]) => (
              <div key={number} className="relative rounded-3xl border border-slate-200 bg-[#f8faf9] p-7">
                <div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-slate-950 font-data text-sm font-bold text-white">{number}</span><h3 className="font-heading text-xl font-bold">{title}</h3></div>
                <p className="mt-5 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Stay connected</p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">WhatsApp when the customer needs an update.</h2>
            <p className="mt-4 max-w-xl text-slate-400">The workspace already supports quick customer messaging for useful moments such as payment reminders, repair-ready updates and payment confirmations.</p>
            <Link href="/whatsapp" className="mt-7 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Open WhatsApp Center</Link>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Ask the workspace</p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Need the bigger picture? Ask NOVATECH.</h2>
            <p className="mt-4 max-w-xl text-slate-600">The built-in assistant is designed to help management understand repairs, stock, money and day-to-day operational signals from the records already in the system.</p>
            <Link href="/assistant" className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Open Assistant</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 px-6 py-20 text-white lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Ready for a calmer workshop</p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-6xl">Build the repair operation you can actually see.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">Bring your customers, devices, repairs, engineers, stock and payments into one system.</p>
          <Link href="/login" className="mt-8 inline-flex rounded-xl bg-teal-400 px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-300">Get started with NOVATECH</Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-10 text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-200">NOVATECH Repair Suite</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/login" className="hover:text-white">Sign in</Link><Link href="/help" className="hover:text-white">Help & Support</Link><Link href="/settings/subscription" className="hover:text-white">Subscription</Link></div>
        </div>
      </footer>
    </main>
  );
}

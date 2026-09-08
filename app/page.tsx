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
      "A complete workspace for repair intake, technicians, inventory, sales, payments and customer communication.",
    type: "website",
    siteName: "NOVATECH Repair Suite",
  },
};

const features = [
  ["Repair workflow", "Take devices in, record the fault, assign an engineer, track progress, invoice the job and close it when the customer collects."],
  ["Customers & devices", "Keep customer contact details, device history, repairs and balances connected instead of scattered across notebooks and chats."],
  ["Engineers & accountability", "Assign jobs, see workload and keep a proper record of parts issued, returned and still with each engineer."],
  ["Inventory control", "Manage parts, accessories and gadgets with stock levels, shelf locations, purchases, transfers, movements and low-stock alerts."],
  ["Sales, invoices & payments", "Handle retail sales, repair invoices, receipts, payment records and outstanding customer balances in one financial flow."],
  ["Suppliers & purchasing", "Track suppliers, purchases, supplier balances and payments so you know what the workshop owes and what has been paid."],
  ["Reports & alerts", "See workshop activity, financial performance, stock warnings and operational signals without digging through spreadsheets."],
  ["WhatsApp communication", "Reach customers quickly with useful messages such as outstanding-balance reminders from the workspace."],
  ["NOVATECH Assistant", "Use the built-in business copilot to understand your workshop data and get answers from the records your team already keeps."],
];

const workflow = ["Customer arrives", "Device intake", "Engineer assigned", "Repair & parts", "Payment", "Customer pickup"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-500 font-heading text-xl font-bold text-slate-950">N</span>
            <span><span className="block font-heading text-lg font-bold tracking-tight">NOVATECH</span><span className="block text-[10px] font-semibold tracking-[0.2em] text-slate-500">REPAIR SUITE</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block">Features</a>
            <a href="#how-it-works" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block">How it works</a>
            <Link href="/login" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold hover:border-teal-400 hover:text-teal-300">Sign in</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_20%_40%,rgba(14,116,144,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Built for modern repair shops</div>
            <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">Stop running your repair shop from notebooks and scattered chats.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">NOVATECH Repair Suite gives your front desk, workshop and management team one place to manage customers, devices, repairs, engineers, stock, sales, payments and business performance.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/30 hover:bg-teal-400">Create your workshop account</Link>
              <a href="#features" className="rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-slate-500">See what it manages</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span>✓ Repair tracking</span><span>✓ Stock control</span><span>✓ Engineer accountability</span><span>✓ Financial records</span></div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><p className="font-heading font-bold">Workshop command center</p><p className="mt-1 text-xs text-slate-500">A clear view of today's operation</p></div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">LIVE</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Active repairs','24'],['Payments today','₦186k'],['Low stock','7'],['Engineers','5']].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-2 font-data text-xl font-bold">{value}</p></div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between"><p className="text-sm font-bold">Repair workflow</p><p className="text-xs text-slate-500">Today</p></div>
              <div className="mt-4 space-y-3">{workflow.map((step, i) => <div key={step} className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-300">{i + 1}</span><span className="text-sm text-slate-300">{step}</span><span className="ml-auto h-px flex-1 bg-slate-800" /></div>)}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Engineer accountability</p><p className="mt-2 text-sm font-semibold">Parts issued · returns tracked</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Customer balance</p><p className="mt-2 text-sm font-semibold">Payment · receipt · reminder</p></div></div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8"><p className="text-center font-heading text-2xl font-bold sm:text-3xl">One system. One source of truth for the workshop.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-800 bg-slate-950 p-5"><p className="text-xs font-bold uppercase tracking-wider text-teal-400">Front desk</p><p className="mt-2 text-sm text-slate-400">Customers, devices, intake, tickets, payments and pickup.</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950 p-5"><p className="text-xs font-bold uppercase tracking-wider text-teal-400">Workshop</p><p className="mt-2 text-sm text-slate-400">Engineers, repair ownership, parts, returns, stock and progress.</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950 p-5"><p className="text-xs font-bold uppercase tracking-wider text-teal-400">Management</p><p className="mt-2 text-sm text-slate-400">Revenue, costs, balances, suppliers, reports and operational visibility.</p></div></div></div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-400">Everything connected</p><h2 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">The tools a serious repair business needs.</h2><p className="mt-5 text-lg leading-8 text-slate-400">NOVATECH is designed around how a real workshop operates, from the moment a device arrives until the customer collects it.</p></div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([title,description], i) => <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:-translate-y-0.5 hover:border-slate-700"><div className="mb-5 grid size-9 place-items-center rounded-xl bg-teal-500/10 text-sm font-bold text-teal-300">{String(i + 1).padStart(2,'0')}</div><h3 className="font-heading text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>)}</div>
      </section>

      <section id="how-it-works" className="border-y border-slate-800 bg-slate-900/50"><div className="mx-auto max-w-7xl px-6 py-24 lg:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-400">How it works</p><h2 className="mt-3 font-heading text-4xl font-bold tracking-tight">From intake to pickup, without losing the thread.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3">{[['01','Take it in','Create the customer and device record, capture the fault and start the repair job.'],['02','Work the job','Assign an engineer, track status and issue only the parts that belong to the repair.'],['03','Close it out','Record payment, generate a receipt, update the customer balance and mark the device ready for pickup.']].map(([n,t,d]) => <div key={n} className="rounded-2xl border border-slate-800 bg-slate-950 p-7"><span className="font-data text-sm text-teal-400">{n}</span><h3 className="mt-5 font-heading text-xl font-bold">{t}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{d}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8"><div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-slate-900 px-7 py-14 text-center sm:px-14"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">Ready when your workshop is</p><h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">Build a repair operation you can actually see.</h2><p className="mx-auto mt-5 max-w-2xl text-slate-400">Create your workspace, bring your team in and start replacing scattered records with one organized system.</p><Link href="/login" className="mt-8 inline-flex rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-bold text-slate-950 hover:bg-teal-400">Get started with NOVATECH</Link></div></section>

      <footer className="border-t border-slate-800 px-6 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-bold text-slate-300">NOVATECH Repair Suite</span><span className="ml-2">Repair-shop management software.</span></div><div className="flex gap-5"><Link href="/login" className="hover:text-white">Sign in</Link><Link href="/login" className="hover:text-white">Create account</Link></div></div></footer>
    </main>
  );
}

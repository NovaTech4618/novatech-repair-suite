"use client";

import { useEffect, useState } from "react";
import { Bot, LockKeyhole, Send, Sparkles, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentSession } from "@/lib/supabase";
import { askPremiumAssistant } from "./actions";

type Message = { role: "user" | "assistant"; text: string };
const suggestions = [
  "Give me a complete business summary for today.",
  "Which repairs are delayed and why?",
  "Which stock items are likely to run out soon?",
  "Who owes us the most money?",
  "Compare engineer workload and parts accountability.",
  "What are my biggest business risks right now?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [premium, setPremium] = useState<boolean | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (!session) {
        setPremium(false);
        return;
      }
      setToken(session.access_token);
      setMessages([{ role: "assistant", text: "Welcome to NOVATECH Premium Intelligence. Ask me questions about your workshop in normal language — performance, repairs, stock, customers, engineers, sales, debt, services, trends and business risks." }]);
    });
  }, []);

  async function send(value = input) {
    const text = value.trim();
    if (!text || busy || !token) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    const result = await askPremiumAssistant(token, text);
    setBusy(false);
    setPremium(result.premium);
    setMessages((m) => [...m, { role: "assistant", text: result.text }]);
  }

  if (premium === false && !token) {
    return <AppLayout><div className="mx-auto max-w-4xl"><Card className="overflow-hidden border-slate-200"><CardContent className="p-10 text-center sm:p-16"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-950 text-white"><LockKeyhole className="size-7" /></div><p className="mt-6 font-mono text-xs font-bold uppercase tracking-[.18em] text-teal-700">Premium only</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-950">NOVATECH Premium Intelligence</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">A private AI business copilot that understands your workshop data. Upgrade your company plan to unlock it.</p><div className="mt-8 grid gap-3 text-left sm:grid-cols-2"><Feature text="Natural-language business questions" /><Feature text="Live repairs, inventory, customers and finance context" /><Feature text="Business summaries, comparisons and risk analysis" /><Feature text="Private conversation history inside your company" /></div></CardContent></Card></div></AppLayout>;
  }

  return <AppLayout><main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Bot className="size-6" /></div><div><div className="flex items-center gap-2"><Sparkles className="size-4 text-teal-600" /><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">Premium Intelligence</p></div><h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your workshop has an AI copilot.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Ask difficult questions normally. NOVATECH analyzes the live business data your account can access and explains the answer.</p></div></div><div className="inline-flex items-center gap-2 self-start rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700"><Zap className="size-3.5" /> PREMIUM</div></div></section>

    <Card className="flex min-h-[600px] flex-1 flex-col overflow-hidden"><CardContent className="flex flex-1 flex-col p-0"><div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">{messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-7 ${m.role === "user" ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"}`}><p className="whitespace-pre-wrap">{m.text}</p></div></div>)}{busy && <div className="flex items-center gap-2 text-sm text-slate-400"><Sparkles className="size-4 animate-pulse" />Analyzing your workshop…</div>}</div>
      <div className="border-t border-slate-100 p-4 sm:p-5"><div className="mb-4 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} onClick={() => void send(s)} disabled={busy || !token} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:opacity-50">{s}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2"><Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Premium Intelligence anything about your workshop…" disabled={busy || !token} className="h-12" /><Button type="submit" disabled={busy || !input.trim() || !token} className="h-12 px-5"><Send className="size-4" /></Button></form><p className="mt-2 px-1 text-[11px] text-slate-400">AI answers are based on live NOVATECH data and should be checked before important financial decisions.</p></div>
    </CardContent></Card>
  </main></AppLayout>;
}

function Feature({ text }: { text: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">✓ {text}</div>; }

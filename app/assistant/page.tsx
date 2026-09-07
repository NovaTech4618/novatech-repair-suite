"use client";
import { useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assistantService, type AssistantReply } from "@/services/assistantService";

type Message={role:"user"|"assistant";text:string;items?:AssistantReply["items"]};
const suggestions=["How is the workshop today?","What's low in stock?","Who owes money?","Show active repairs","How are the engineers doing?"];

export default function AssistantPage(){
 const [messages,setMessages]=useState<Message[]>([{role:"assistant",text:"Hi. I'm the NOVATECH Assistant. I can read your live workshop data and help you find repairs, stock, customer balances, engineer accounts, and today's business snapshot."}]);
 const [input,setInput]=useState(""); const [busy,setBusy]=useState(false);
 async function send(value=input){const text=value.trim();if(!text||busy)return;setInput("");setMessages(m=>[...m,{role:"user",text}]);setBusy(true);const {data,error}=await assistantService.ask(text);setBusy(false);setMessages(m=>[...m,{role:"assistant",text:error?"I couldn't complete that request. Please try again.":data.text,items:data.items}]);}
 return <AppLayout><main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col gap-5">
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Bot className="size-6"/></div><div><div className="flex items-center gap-2"><Sparkles className="size-4 text-teal-600"/><p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-teal-700">Novatech Assistant</p></div><h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your workshop, easier to understand.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Ask questions in normal language. The assistant reads only the data your signed-in account can access.</p></div></div></section>
  <Card className="flex flex-1 flex-col overflow-hidden"><CardContent className="flex flex-1 flex-col p-0"><div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">{messages.map((m,i)=><div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role==="user"?"bg-teal-700 text-white":"border border-slate-200 bg-slate-50 text-slate-700"}`}><p>{m.text}</p>{m.items&&<div className="mt-3 space-y-2">{m.items.map((x,j)=>x.href?<Link key={j} href={x.href} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:border-teal-200"><span className="font-medium">{x.label}</span><span className="text-xs text-slate-500">{x.value}</span></Link>:<div key={j} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="font-medium">{x.label}</span><span className="text-xs text-slate-500">{x.value}</span></div>)}</div>}</div></div>)}{busy&&<div className="text-sm text-slate-400">Checking the workshop data…</div>}</div>
   <div className="border-t border-slate-100 p-4"><div className="mb-3 flex flex-wrap gap-2">{suggestions.map(s=><button key={s} onClick={()=>void send(s)} disabled={busy} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-teal-200 hover:text-teal-700">{s}</button>)}</div><form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2"><Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask NOVATECH something…" disabled={busy}/><Button type="submit" disabled={busy||!input.trim()}><Send className="size-4"/></Button></form></div>
  </CardContent></Card>
 </main></AppLayout>;
}

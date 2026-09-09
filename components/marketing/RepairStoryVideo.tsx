"use client";

import { useState } from "react";

const stages = ["Device arrives", "Engineer", "Parts", "Customer update", "Collected"];

export default function RepairStoryVideo() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.7)] sm:aspect-[16/10] lg:aspect-[4/3]">
      {!videoFailed ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          poster="/logo.png"
          onError={() => setVideoFailed(true)}
          aria-label="NOVATECH repair workflow story"
        >
          <source src="/novatech-repair-story.mp4" type="video/mp4" />
        </video>
      ) : (
        <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(20,184,166,0.22),transparent_35%),linear-gradient(135deg,#0f172a,#111827)] p-5 sm:p-8">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex h-full flex-col justify-center">
            <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-7">
              <span>NOVATECH repair story</span>
              <span>Live workflow</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
              {stages.map((stage, index) => (
                <div key={stage} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur transition-transform duration-700 motion-safe:animate-pulse sm:p-4" style={{ animationDelay: `${index * 180}ms` }}>
                  <div className="grid size-8 place-items-center rounded-full bg-teal-400/15 text-xs font-bold text-teal-300">{index + 1}</div>
                  <p className="mt-3 text-[10px] font-semibold leading-4 text-white sm:mt-4 sm:text-[11px]">{stage}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-teal-400" />
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-slate-400">A responsive repair workflow preview. When the MP4 asset is available, it plays automatically here with native controls on every device.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">NOVATECH repair story</p>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-white sm:text-base">From device intake to payment and pickup, the whole job stays visible.</p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200 backdrop-blur sm:inline-flex">8 sec</span>
        </div>
      </div>
    </div>
  );
}

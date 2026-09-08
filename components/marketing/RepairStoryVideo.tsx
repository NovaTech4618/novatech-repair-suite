"use client";

import { useState } from "react";

const stages = ["Device arrives", "Engineer", "Parts", "Customer update", "Collected"];

export default function RepairStoryVideo() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-slate-950">
      {!videoFailed ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/logo.png"
          onError={() => setVideoFailed(true)}
          aria-label="NOVATECH repair workflow story"
        >
          <source src="/novatech-repair-story.mp4" type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">NOVATECH repair story</p>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-white sm:text-base">
              From device intake to payment and pickup, the whole job stays visible.
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200 backdrop-blur sm:inline-flex">
            8 sec
          </span>
        </div>
      </div>

      {videoFailed && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span>Product story preview</span>
              <span>Workflow</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {stages.map((stage, index) => (
                <div key={stage} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="grid size-8 place-items-center rounded-full bg-teal-400/15 text-xs font-bold text-teal-300">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-[11px] font-semibold text-white">{stage}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-teal-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

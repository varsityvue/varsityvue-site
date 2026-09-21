"use client";

import { useId, useState, type ReactNode } from "react";

export default function PickemWeekDisclosure({
  title,
  pickCount,
  children,
}: {
  title: string;
  pickCount: number;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-[10px] text-white/35">
            {pickCount} pick{pickCount === 1 ? "" : "s"} saved
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {expanded ? "Hide picks" : "View picks"}
        </button>
      </div>
      <div id={contentId} hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}

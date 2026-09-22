"use client";

import { useId, useState, type ReactNode } from "react";
import { pickemWeekDisclosureLabel, type PickemWeekSummary } from "@/lib/pickem-week-summary";

export default function PickemWeekDisclosure({
  title,
  summary,
  children,
}: {
  title: string;
  summary: PickemWeekSummary;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{title}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2" aria-label={`${title} scoring summary`}>
            <div>
              <dt className="text-[8px] font-black uppercase tracking-[0.08em] text-white/35">Picks saved</dt>
              <dd className="mt-1 text-sm font-black">{summary.picksSaved}</dd>
            </div>
            <div>
              <dt className="text-[8px] font-black uppercase tracking-[0.08em] text-white/35">Results graded</dt>
              <dd className="mt-1 text-sm font-black">{summary.resultsGraded} of {summary.eligibleGames}</dd>
              {summary.eligibleGames === 0 ? <p className="mt-0.5 text-[8px] text-amber-100/55">Results pending</p> : null}
            </div>
            <div>
              <dt className="text-[8px] font-black uppercase tracking-[0.08em] text-white/35">Points earned</dt>
              <dd className="mt-1 text-sm font-black">{summary.pointsEarned}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {pickemWeekDisclosureLabel(expanded)}
        </button>
      </div>
      <div id={contentId} hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}

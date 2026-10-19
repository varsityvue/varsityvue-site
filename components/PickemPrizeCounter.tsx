"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PickemPrize = { valid_entries: number; prize_dollars: number };

export default function PickemPrizeCounter({ weekId, initialPrize, entryClosed }: {
  weekId: string;
  initialPrize: PickemPrize | null;
  entryClosed: boolean;
}) {
  const [prize, setPrize] = useState(initialPrize);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const refresh = async () => {
      const { data, error } = await supabase.from("pickem_contest_prize")
        .select("valid_entries, prize_dollars").eq("week_id", weekId).abortSignal(AbortSignal.timeout(3000)).maybeSingle().retry(false);
      if (active && !error && data) setPrize(data);
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [weekId]);

  // Grading is not prize finalization. The public prize view exposes no finalization receipt.
  const prizeLabel = entryClosed ? "Provisional prize" : "Current prize";
  if (!prize) return <p role="status" className="mt-2 text-sm text-white/70">Entry count and prize are temporarily unavailable.</p>;
  return <dl aria-label="Contest participation and prize" aria-live="polite" aria-atomic="true" className="mt-2 grid grid-cols-2 gap-3 border-b border-white/10 pb-2">
    <div>
      <dt className="text-xs font-bold text-white/75">Accepted entries</dt>
      <dd className="text-xl font-black leading-6 tabular-nums">{prize.valid_entries}</dd>
    </div>
    <div>
      <dt className="text-xs font-bold text-white/75">{prizeLabel}</dt>
      <dd className="text-xl font-black leading-6 tabular-nums">${prize.prize_dollars}</dd>
    </div>
  </dl>;
}

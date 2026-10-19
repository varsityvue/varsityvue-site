"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PickemPrize = { valid_entries: number; prize_dollars: number };

export default function PickemPrizeCounter({ weekId, initialPrize }: {
  weekId: string;
  initialPrize: PickemPrize | null;
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

  if (!prize) return <p role="status" className="mt-2 text-sm text-white/70">Entry count and prize are temporarily unavailable.</p>;
  return <dl aria-label="Contest participation and prize" aria-live="polite" aria-atomic="true" className="mt-2 grid grid-cols-2 gap-3 text-center border-b border-white/10 pb-2">
    <div>
      <dt className="text-xs font-bold text-white/75">Valid entries</dt>
      <dd className="text-xl font-black leading-6 tabular-nums">{prize.valid_entries}</dd>
    </div>
    <div>
      <dt className="text-xs font-bold text-white/75">Calculated prize</dt>
      <dd className="text-xl font-black leading-6 tabular-nums">${prize.prize_dollars}</dd>
    </div>
  </dl>;
}

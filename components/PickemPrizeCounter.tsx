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
        .select("valid_entries, prize_dollars").eq("week_id", weekId).maybeSingle();
      if (active && !error && data) setPrize(data);
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [weekId]);

  if (!prize) return <p className="mt-3 text-sm text-white/60">Provisional prize details are temporarily unavailable.</p>;
  return <div className="mt-3 rounded-xl border border-white/15 bg-black/25 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5" aria-live="polite">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Accepted completed entries</p>
      <p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{prize.valid_entries}</p>
    </div>
    <div className="mt-3 sm:mt-0 sm:text-right">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Provisional cash prize</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-white sm:text-3xl">${prize.prize_dollars}</p>
    </div>
  </div>;
}

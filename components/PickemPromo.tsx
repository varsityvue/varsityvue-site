import { createClient } from "@/lib/supabase/server";
import { isPickemEntryClosed, isPickemWeekClosed } from "@/lib/pickem-week-state";
import TrackedPickemLink from "@/components/TrackedPickemLink";

export default async function PickemPromo() {
  const supabase = await createClient();
  const { data: week } = await supabase.from("pickem_weeks").select("id, title, season, week, status, closes_at").in("status", ["open", "locked"]).order("season", { ascending: false }).order("week", { ascending: false }).limit(1).maybeSingle();
  if (!week) return null;
  const contestWeek = week.season > 2026 || week.week >= 6;
  const { data: firstGame } = contestWeek
    ? await supabase.from("pickem_games").select("lock_at").eq("week_id", week.id).order("lock_at").limit(1).maybeSingle()
    : { data: null };
  const weekFullyClosed = isPickemWeekClosed(week);
  const closed = weekFullyClosed || Boolean(contestWeek && firstGame && isPickemEntryClosed(new Date(firstGame.lock_at).getTime()));
  return <section className="border-b border-white/10 bg-[var(--vv-bg)] px-4 py-3 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--vv-accent)]/25 bg-[var(--vv-primary)]/15 px-4 py-3 sm:px-5 sm:py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--vv-accent)]">{weekFullyClosed ? "Closed" : closed ? "New Entries Closed" : "Now Open"}</p><p className="mt-1 text-sm font-black sm:text-lg">{week.title}</p><p className="mt-1 text-xs text-white/45">{weekFullyClosed ? "Selections are closed. Follow the results as games are graded." : closed ? "Existing entrants may edit picks until each game locks." : contestWeek ? "Complete your entry before the first included kickoff." : "Make your selections before Friday night kickoff."}</p></div><TrackedPickemLink surface="scoreboard" className="rounded-full bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85">{closed ? "View Pick ’Em →" : "Make My Picks →"}</TrackedPickemLink></div></section>;
}

import type { Metadata } from "next";
import Link from "next/link";

import PickemSlateForm, { type PickemSlateGame } from "@/components/PickemSlateForm";
import { getGameById } from "@/lib/games";
import { memberAccountStatus } from "@/lib/member-access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "VarsityVue Pick ’Em",
  description: "Make weekly Texas high school football picks and follow the VarsityVue season leaderboard.",
  alternates: { canonical: "/pickem" },
};

function kickoffLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return date.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

export default async function PickemPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const isActiveMember = userId
    ? (await memberAccountStatus(supabase, userId)) === "active"
    : false;

  const { data: week } = await supabase
    .from("pickem_weeks")
    .select("id, season, week, title, status, closes_at")
    .in("status", ["open", "locked", "graded"])
    .order("season", { ascending: false })
    .order("week", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: slateRows }, { data: leaderboardRows }] = week
    ? await Promise.all([
        supabase
          .from("pickem_game_cards")
          .select("id, game_id, sort_order, lock_at, away_school_slug, home_school_slug, is_locked")
          .eq("week_id", week.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("pickem_standings")
          .select("user_id, display_name, username, graded_picks, correct_picks, accuracy_pct")
          .eq("season", week.season)
          .order("correct_picks", { ascending: false })
          .order("accuracy_pct", { ascending: false })
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }];

  const { data: pickRows } = week && isActiveMember
    ? await supabase
        .from("pickem_picks")
        .select("pickem_game_id, picked_school_slug")
        .eq("user_id", userId!)
        .in("pickem_game_id", (slateRows ?? []).map((row) => row.id))
    : { data: [] };

  const selections = new Map((pickRows ?? []).map((pick) => [pick.pickem_game_id, pick.picked_school_slug]));
  const games: PickemSlateGame[] = (slateRows ?? []).flatMap((row) => {
    const game = getGameById(row.game_id);
    if (!game || !row.away_school_slug || !row.home_school_slug) return [];
    return [{
      id: row.id,
      gameId: row.game_id,
      awayName: game.awayTeam ?? "Away Team",
      awaySlug: row.away_school_slug,
      homeName: game.homeTeam ?? "Home Team",
      homeSlug: row.home_school_slug,
      kickoffLabel: kickoffLabel(row.lock_at),
      locked: row.is_locked === true,
      selectedSlug: selections.get(row.id),
    }];
  });

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-7 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs">VarsityVue Pick ’Em</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{week?.title ?? "Weekly Pick ’Em"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Pick the winner of each matchup. Every game locks at kickoff, and verified finals grade the slate.</p>
            </div>
            {week ? <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-right"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">Season</p><p className="mt-1 text-lg font-black">{week.season} · Week {week.week}</p></div> : null}
          </div>
        </section>

        {!week || games.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">The next Pick ’Em slate is not open yet.</section>
        ) : isActiveMember ? (
          <PickemSlateForm weekId={week.id} games={games} />
        ) : (
          <section className="mt-5 rounded-[1.5rem] border border-[var(--vv-accent)]/25 bg-white/[0.045] p-5 text-center shadow-xl sm:mt-7 sm:p-7">
            <h2 className="text-xl font-black sm:text-2xl">Sign in to make your picks.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/50">The slate is public. Saving picks, building a season record, and appearing on the leaderboard require a free VarsityVue account.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/login?next=%2Fpickem" className="rounded-full border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/10 hover:text-white">Log In</Link>
              <Link href="/login?mode=signup&next=%2Fpickem" className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white/85">Create Free Account</Link>
            </div>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              {games.map((game, index) => <div key={game.id} className="rounded-xl border border-white/10 bg-black/25 p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">Game {index + 1} · {game.kickoffLabel}</p><p className="mt-2 font-black text-white/80">{game.awayName} at {game.homeName}</p></div>)}
            </div>
          </section>
        )}

        <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Season Standings</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Leaderboard</h2></div><p className="text-[10px] text-white/35">Verified finals only</p></div>
          {(leaderboardRows ?? []).length > 0 ? <div className="mt-4 divide-y divide-white/10">{(leaderboardRows ?? []).map((entry, index) => <div key={entry.user_id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="text-sm font-black text-white/35">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-black">{entry.display_name || entry.username || "VarsityVue Member"}</p><p className="mt-0.5 text-[10px] text-white/35">{entry.graded_picks} graded · {entry.accuracy_pct}% correct</p></div><p className="text-xl font-black">{entry.correct_picks}</p></div>)}</div> : <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">The leaderboard begins after the first verified Week {week?.week ?? "—"} finals.</p>}
        </section>
      </div>
    </main>
  );
}

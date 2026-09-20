import type { Metadata } from "next";
import PickemGuestSlate from "@/components/PickemGuestSlate";
import PickemSlateForm, { type PickemSlateGame } from "@/components/PickemSlateForm";
import { getProgramLogoPath } from "@/components/SchoolBadge";
import { getGameById } from "@/lib/games";
import { memberAccountStatus } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "VarsityVue Pick ’Em",
  description: "Make weekly Texas high school football picks and follow the VarsityVue season leaderboard.",
  alternates: { canonical: "/pickem" },
};

type PageProps = { searchParams: Promise<{ intent?: string }> };

function parsePickIntent(value?: string) {
  const picks = new Map<string, string>();
  for (const entry of (value ?? "").split("|").slice(0, 12)) {
    const [gameId, schoolSlug] = entry.split("~");
    if (/^[a-z0-9-]+$/.test(gameId ?? "") && /^[a-z0-9-]+$/.test(schoolSlug ?? "")) {
      picks.set(gameId, schoolSlug);
    }
  }
  return picks;
}

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

function pickResultLabel(isCorrect: boolean | null) {
  if (isCorrect === true) return "Correct";
  if (isCorrect === false) return "Incorrect";
  return "Pending";
}

export default async function PickemPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const intendedPicks = parsePickIntent(params.intent);
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

  const { data: memberPickRows } = isActiveMember
    ? await supabase
        .from("pickem_picks")
        .select("pickem_game_id, picked_school_slug, is_correct, submitted_at")
        .eq("user_id", userId!)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  const memberGameIds = [...new Set((memberPickRows ?? []).map((pick) => pick.pickem_game_id))];
  const [{ data: memberGameRows }, { data: memberTotal }] = isActiveMember && week
    ? await Promise.all([
        memberGameIds.length > 0
          ? supabase
              .from("pickem_games")
              .select("id, game_id, week_id, result_winner_school_slug, graded_at")
              .in("id", memberGameIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from("pickem_member_totals")
          .select("graded_picks, correct_picks, incorrect_picks")
          .eq("season", week.season)
          .eq("user_id", userId!)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  const memberWeekIds = [...new Set((memberGameRows ?? []).map((game) => game.week_id))];
  const { data: memberWeekRows } = memberWeekIds.length > 0
    ? await supabase
        .from("pickem_weeks")
        .select("id, season, week, title, status")
        .in("id", memberWeekIds)
    : { data: [] };

  const correctPicks = memberTotal?.correct_picks ?? 0;
  const gradedPicks = memberTotal?.graded_picks ?? 0;
  const incorrectPicks = memberTotal?.incorrect_picks ?? 0;
  const { count: higherScoreCount } = isActiveMember && week && gradedPicks > 0
    ? await supabase
        .from("pickem_member_totals")
        .select("user_id", { count: "exact", head: true })
        .eq("season", week.season)
        .gt("correct_picks", correctPicks)
    : { count: null };

  const selections = new Map((memberPickRows ?? []).map((pick) => [pick.pickem_game_id, pick.picked_school_slug]));
  const games: PickemSlateGame[] = (slateRows ?? []).flatMap((row) => {
    const game = getGameById(row.game_id);
    if (!game || !row.away_school_slug || !row.home_school_slug) return [];
    const awaySchool = getSchoolBySlug(row.away_school_slug);
    const homeSchool = getSchoolBySlug(row.home_school_slug);
    return [{
      id: row.id,
      gameId: row.game_id,
      awayName: game.awayTeam ?? "Away Team",
      awaySlug: row.away_school_slug,
      awayMark: awaySchool?.abbreviation ?? game.awayTeam?.slice(0, 3).toUpperCase() ?? "AWY",
      awayColor: awaySchool?.colors.primary ?? "#7a1022",
      awayLogoUrl: awaySchool ? getProgramLogoPath(awaySchool.slug) : undefined,
      homeName: game.homeTeam ?? "Home Team",
      homeSlug: row.home_school_slug,
      homeMark: homeSchool?.abbreviation ?? game.homeTeam?.slice(0, 3).toUpperCase() ?? "HME",
      homeColor: homeSchool?.colors.primary ?? "#7a1022",
      homeLogoUrl: homeSchool ? getProgramLogoPath(homeSchool.slug) : undefined,
      kickoffLabel: kickoffLabel(row.lock_at),
      locked: row.is_locked === true,
      selectedSlug: selections.get(row.id) ?? (
        [row.away_school_slug, row.home_school_slug].includes(intendedPicks.get(row.game_id) ?? "")
          ? intendedPicks.get(row.game_id)
          : undefined
      ),
    }];
  });

  const memberGamesById = new Map((memberGameRows ?? []).map((game) => [game.id, game]));
  const memberWeeksById = new Map((memberWeekRows ?? []).map((pickemWeek) => [pickemWeek.id, pickemWeek]));
  const historyByWeek = new Map<string, {
    id: string;
    season: number;
    week: number;
    title: string;
    picks: Array<{ id: string; matchup: string; pickedTeam: string; isCorrect: boolean | null }>;
  }>();

  for (const pick of memberPickRows ?? []) {
    const pickemGame = memberGamesById.get(pick.pickem_game_id);
    const pickemWeek = pickemGame ? memberWeeksById.get(pickemGame.week_id) : null;
    const canonicalGame = pickemGame ? getGameById(pickemGame.game_id) : null;
    if (!pickemGame || !pickemWeek || !canonicalGame) continue;

    const pickedTeam = pick.picked_school_slug === canonicalGame.awaySchoolSlug
      ? canonicalGame.awayTeam
      : pick.picked_school_slug === canonicalGame.homeSchoolSlug
        ? canonicalGame.homeTeam
        : pick.picked_school_slug;
    const existing: {
      id: string;
      season: number;
      week: number;
      title: string;
      picks: Array<{ id: string; matchup: string; pickedTeam: string; isCorrect: boolean | null }>;
    } = historyByWeek.get(pickemWeek.id) ?? {
      id: pickemWeek.id,
      season: pickemWeek.season,
      week: pickemWeek.week,
      title: pickemWeek.title,
      picks: [],
    };
    existing.picks.push({
      id: pickemGame.id,
      matchup: `${canonicalGame.awayTeam} at ${canonicalGame.homeTeam}`,
      pickedTeam,
      isCorrect: pick.is_correct,
    });
    historyByWeek.set(pickemWeek.id, existing);
  }

  const memberHistory = [...historyByWeek.values()].sort((a, b) => b.season - a.season || b.week - a.week);
  const accuracy = gradedPicks > 0 ? Math.round((correctPicks / gradedPicks) * 1000) / 10 : 0;
  const seasonRank = gradedPicks > 0 && higherScoreCount !== null ? (higherScoreCount ?? 0) + 1 : null;

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-7 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs">VarsityVue Pick ’Em</p>{week ? <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">{week.season} · Week {week.week}</span> : null}</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{week?.title ?? "Weekly Pick ’Em"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Pick every winner. Each correct pick earns one point, games lock individually at kickoff, and verified finals grade the slate.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.11em] text-white/45"><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">1 point per winner</span><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Individual lock times</span><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Season leaderboard</span></div>
        </section>

        {!week || games.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">The next Pick ’Em slate is not open yet.</section>
        ) : isActiveMember ? (
          <>
            {intendedPicks.size > 0 ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">Your pre-registration picks were restored. Select <strong>Save My Picks</strong> below to add them to your account.</div> : null}
            <PickemSlateForm weekId={week.id} games={games} />
          </>
        ) : (
          <PickemGuestSlate games={games} />
        )}

        {isActiveMember ? (
          <section id="my-picks" className="mt-5 scroll-mt-24 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Member Season</p>
                <h2 className="mt-1 text-2xl font-black sm:text-3xl">My Pick ’Em</h2>
              </div>
              <p className="text-[10px] text-white/35">Only you can see your picks</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Correct", String(correctPicks)],
                ["Record", `${correctPicks}-${incorrectPicks}`],
                ["Accuracy", gradedPicks > 0 ? `${accuracy}%` : "—"],
                ["Season Rank", seasonRank ? `#${seasonRank}` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{label}</p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-white/30">Season rank is based on correct picks; tied scores share the same position.</p>

            {memberHistory.length > 0 ? (
              <div className="mt-5 space-y-3">
                {memberHistory.map((historyWeek) => (
                  <details key={historyWeek.id} open={historyWeek.id === week?.id} className="group rounded-2xl border border-white/10 bg-black/20 p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{historyWeek.title}</p>
                        <p className="mt-1 text-[10px] text-white/35">{historyWeek.picks.length} pick{historyWeek.picks.length === 1 ? "" : "s"}</p>
                      </div>
                      <span className="text-xs font-black text-white/40 group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="mt-3 divide-y divide-white/10 border-t border-white/10">
                      {historyWeek.picks.map((pick) => (
                        <div key={pick.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white/60">{pick.matchup}</p>
                            <p className="mt-1 text-sm font-black">Picked {pick.pickedTeam}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${pick.isCorrect === true ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : pick.isCorrect === false ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-white/10 bg-white/[0.04] text-white/40"}`}>
                            {pickResultLabel(pick.isCorrect)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">Save your first slate to start your season history.</p>
            )}
          </section>
        ) : null}

        <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Season Standings</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Leaderboard</h2></div><p className="text-[10px] text-white/35">Verified finals only</p></div>
          {(leaderboardRows ?? []).length > 0 ? <div className="mt-4 divide-y divide-white/10">{(leaderboardRows ?? []).map((entry, index) => <div key={entry.user_id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="text-sm font-black text-white/35">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-black">{entry.display_name || entry.username || "VarsityVue Member"}</p><p className="mt-0.5 text-[10px] text-white/35">{entry.graded_picks} graded · {entry.accuracy_pct}% correct</p></div><p className="text-xl font-black">{entry.correct_picks}</p></div>)}</div> : <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">The leaderboard begins after the first verified Week {week?.week ?? "—"} finals.</p>}
        </section>
      </div>
    </main>
  );
}

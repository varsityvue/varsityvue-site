import type { Metadata } from "next";
import PickemGuestSlate from "@/components/PickemGuestSlate";
import PickemSlateForm, { type PickemSlateGame } from "@/components/PickemSlateForm";
import PickemWeekDisclosure from "@/components/PickemWeekDisclosure";
import { getPickemLogoFilter, getPickemLogoPath } from "@/data/school-logos";
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

function pickResultLabel(isCorrect: boolean | null, editable: boolean) {
  if (isCorrect === true) return "Correct";
  if (isCorrect === false) return "Incorrect";
  return editable ? "Saved · Editable" : "Saved · Locked";
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
      awayLogoUrl: awaySchool ? getPickemLogoPath(awaySchool.slug) : undefined,
      awayLogoFilter: getPickemLogoFilter(row.away_school_slug),
      homeName: game.homeTeam ?? "Home Team",
      homeSlug: row.home_school_slug,
      homeMark: homeSchool?.abbreviation ?? game.homeTeam?.slice(0, 3).toUpperCase() ?? "HME",
      homeColor: homeSchool?.colors.primary ?? "#7a1022",
      homeLogoUrl: homeSchool ? getPickemLogoPath(homeSchool.slug) : undefined,
      homeLogoFilter: getPickemLogoFilter(row.home_school_slug),
      kickoffLabel: kickoffLabel(row.lock_at),
      locked: row.is_locked === true,
      savedSlug: selections.get(row.id),
      selectedSlug: selections.get(row.id) ?? (
        [row.away_school_slug, row.home_school_slug].includes(intendedPicks.get(row.game_id) ?? "")
          ? intendedPicks.get(row.game_id)
          : undefined
      ),
    }];
  });

  const memberGamesById = new Map((memberGameRows ?? []).map((game) => [game.id, game]));
  const memberWeeksById = new Map((memberWeekRows ?? []).map((pickemWeek) => [pickemWeek.id, pickemWeek]));
  const editableGameIds = new Set(games.filter((game) => !game.locked).map((game) => game.id));
  const historyByWeek = new Map<string, {
    id: string;
    season: number;
    week: number;
    title: string;
    picks: Array<{ id: string; matchup: string; pickedTeam: string; isCorrect: boolean | null; editable: boolean }>;
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
      picks: Array<{ id: string; matchup: string; pickedTeam: string; isCorrect: boolean | null; editable: boolean }>;
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
      editable: pick.is_correct === null
        && pickemWeek.status === "open"
        && editableGameIds.has(pickemGame.id),
    });
    historyByWeek.set(pickemWeek.id, existing);
  }

  const memberHistory = [...historyByWeek.values()].sort((a, b) => b.season - a.season || b.week - a.week);
  const accuracy = gradedPicks > 0 ? Math.round((correctPicks / gradedPicks) * 1000) / 10 : 0;
  const seasonRank = gradedPicks > 0 && higherScoreCount !== null ? (higherScoreCount ?? 0) + 1 : null;

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-7 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <p className="pr-28 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:pr-32 sm:text-xs">VarsityVue</p>
          {week ? <span className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 sm:right-8 sm:top-8">{week.season} · Week {week.week}</span> : null}
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Pick ’Em</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Pick every winner. Each correct pick earns one point, and games lock individually at kickoff.</p>
        </section>

        {!week || games.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">The next Pick ’Em slate is not open yet.</section>
        ) : isActiveMember ? (
          <>
            {intendedPicks.size > 0 ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">Your pre-registration picks were restored. Select <strong>Save My Picks</strong> below to add them to your account.</div> : null}
            <PickemSlateForm weekId={week.id} games={games} savedPickCount={(memberPickRows ?? []).filter((pick) => games.some((game) => game.id === pick.pickem_game_id)).length} />
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

            {gradedPicks > 0 ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Correct", String(correctPicks)],
                    ["Record", `${correctPicks}-${incorrectPicks}`],
                    ["Accuracy", `${accuracy}%`],
                    ["Season Rank", seasonRank ? `#${seasonRank}` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{label}</p>
                      <p className="mt-1 text-xl font-black">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/30">Season rank is based on correct picks; tied scores share the same position.</p>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">Season results will appear after the first verified final grades your picks.</p>
            )}

            {memberHistory.length > 0 ? (
              <div className="mt-5 space-y-3">
                {memberHistory.map((historyWeek) => (
                  <PickemWeekDisclosure key={historyWeek.id} title={historyWeek.title} pickCount={historyWeek.picks.length}>
                    <div className="mt-3 divide-y divide-white/10 border-t border-white/10">
                      {historyWeek.picks.map((pick) => (
                        <div key={pick.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white/60">{pick.matchup}</p>
                            <p className="mt-1 text-sm font-black">Picked {pick.pickedTeam}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${pick.isCorrect === true ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : pick.isCorrect === false ? "border-red-300/20 bg-red-300/10 text-red-100" : pick.editable ? "border-sky-300/20 bg-sky-300/10 text-sky-100" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                            {pickResultLabel(pick.isCorrect, pick.editable)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </PickemWeekDisclosure>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">Save your first slate to start your season history.</p>
            )}
          </section>
        ) : null}

        <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Season Standings</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Leaderboard</h2></div><p className="text-[10px] text-white/35">Verified finals only</p></div>
          {(leaderboardRows ?? []).length > 0 ? <div className="mt-4 divide-y divide-white/10">{(leaderboardRows ?? []).map((entry, index) => <div key={entry.user_id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="text-sm font-black text-white/35">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-black">{entry.display_name || entry.username || "VarsityVue Member"}</p><p className="mt-0.5 text-[10px] text-white/35">{entry.graded_picks} graded · {entry.accuracy_pct}% correct</p></div><p className="text-xl font-black">{entry.correct_picks}</p></div>)}</div> : <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">Standings will appear as Week {week?.week ?? "—"} games are graded.</p>}
        </section>
      </div>
    </main>
  );
}

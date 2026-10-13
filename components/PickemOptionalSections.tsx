import type { OwnPickemSummary } from "@/lib/public-read-contracts";
import PickemWeekDisclosure from "@/components/PickemWeekDisclosure";
import ReadRecovery from "@/components/ReadRecovery";
import type { PickemSlateGame } from "@/components/PickemSlateForm";
import { loadPickemHistory, loadPickemStandings, type PickemReadScope, type PickemWeek } from "@/lib/pickem-page-loader";
import { summarizePickemWeeks } from "@/lib/pickem-week-summary";
import { getGameById } from "@/lib/games";
function pickResultLabel(isCorrect: boolean | null, editable: boolean) { return isCorrect === true ? "Correct" : isCorrect === false ? "Incorrect" : editable ? "Saved · Editable" : "Saved · Locked"; }
export async function PickemHistory({ scope, userId, week, games, voidGameIds, weekClosed }: { scope: PickemReadScope; userId: string; week: PickemWeek; games: PickemSlateGame[]; voidGameIds: Set<string>; weekClosed: boolean }) {
  let data;
  try { data = await loadPickemHistory(scope, userId, week.season); }
  catch { return <ReadRecovery message="Your Pick ’Em history is temporarily unavailable. Your current entry remains above." />; }
  const { memberPickRows, rawMemberTotal, memberGameRows, memberWeekRows, memberWeekGameRows } = data;
  const memberTotal = rawMemberTotal as OwnPickemSummary | null;
  const correctPicks = memberTotal?.correct_picks ?? 0;
  const gradedPicks = memberTotal?.graded_picks ?? 0;
  const incorrectPicks = memberTotal?.incorrect_picks ?? 0;
  const memberGamesById = new Map((memberGameRows ?? []).map((game) => [game.id, game]));
  const memberWeeksById = new Map((memberWeekRows ?? []).map((pickemWeek) => [pickemWeek.id, pickemWeek]));
  const weeklySummaries = summarizePickemWeeks({
    userId: userId!,
    games: (memberWeekGameRows ?? []).map((game) => ({
      id: game.id,
      weekId: game.week_id,
      resultWinnerSchoolSlug: game.result_winner_school_slug,
      gradedAt: game.graded_at,
    })),
    picks: (memberPickRows ?? []).map((pick) => ({
      pickemGameId: pick.pickem_game_id,
      userId: userId!,
      isCorrect: pick.is_correct,
    })),
  });
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
      pickedTeam: pickedTeam ?? pick.picked_school_slug,
      isCorrect: pick.is_correct,
      editable: pick.is_correct === null
        && pickemWeek.status === "open" && !weekClosed
        && editableGameIds.has(pickemGame.id),
    });
    historyByWeek.set(pickemWeek.id, existing);
  }

  const memberHistory = [...historyByWeek.values()].sort((a, b) => b.season - a.season || b.week - a.week);
  const accuracy = gradedPicks > 0 ? Math.round((correctPicks / gradedPicks) * 1000) / 10 : 0;
  const seasonRank = memberTotal?.season_rank ?? null;

 return <>
        {true ? (
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
                  <PickemWeekDisclosure
                    key={historyWeek.id}
                    title={historyWeek.title}
                    summary={weeklySummaries.get(historyWeek.id) ?? {
                      picksSaved: historyWeek.picks.length,
                      resultsGraded: 0,
                      eligibleGames: 0,
                      pointsEarned: 0,
                    }}
                  >
                    <div className="mt-3 divide-y divide-white/10 border-t border-white/10">
                      {historyWeek.picks.map((pick) => (
                        <div key={pick.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white/60">{pick.matchup}</p>
                            <p className="mt-1 text-sm font-black">Picked {pick.pickedTeam}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${pick.isCorrect === true ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : pick.isCorrect === false ? "border-red-300/20 bg-red-300/10 text-red-100" : pick.editable ? "border-sky-300/20 bg-sky-300/10 text-sky-100" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                            {voidGameIds.has(pick.id) ? "Void" : pickResultLabel(pick.isCorrect, pick.editable)}
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

 </>;
}
export async function PickemStandings({ scope, week, weekClosed }: { scope: PickemReadScope; week: PickemWeek; weekClosed: boolean }) {
 let data;
 try { data = await loadPickemStandings(scope, week, weekClosed); }
 catch { return <ReadRecovery message="Pick ’Em standings are temporarily unavailable. Contest entry is still available above." />; }
 const { leaderboardRows: rankedLeaderboard, weeklyStandings } = data;
 return <>

        {weekClosed && weeklyStandings && weeklyStandings.length > 0 && <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7"><h2 className="text-2xl font-black">Week {week?.week} standings</h2><p className="mt-1 text-xs text-white/45">{week?.status === "graded" ? "Final weekly results" : "Provisional while results are graded"}{week?.tiebreaker_game_id ? " · Pick ’Em Tiebreaker Game combined points break ties when a verified played final is available." : " · No tiebreaker was collected for this week."}</p><div className="mt-4 divide-y divide-white/10">{weeklyStandings.map((entry) => <div key={entry.ordinal} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="font-black text-white/45">{entry.weekly_rank}</span><div className="min-w-0"><p className="truncate text-sm font-black">{entry.display_name || entry.username || "VarsityVue Member"}</p><p className="text-[10px] text-white/45">{entry.graded_picks} graded{entry.distance !== null ? ` · ${entry.distance} points from total` : ""}</p></div><span className="text-xl font-black">{entry.correct_picks}</span></div>)}</div></section>}

        <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:mt-7 sm:p-7">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Season Standings</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Leaderboard</h2></div><p className="text-[10px] text-white/35">Verified finals only</p></div>
          {rankedLeaderboard.length > 0 ? <div className="mt-4 divide-y divide-white/10">{rankedLeaderboard.map((entry) => <div key={entry.ordinal} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="text-sm font-black text-white/35">{entry.rank}</span><div className="min-w-0"><p className="truncate text-sm font-black">{entry.display_name || entry.username || "VarsityVue Member"}</p><p className="mt-0.5 text-[10px] text-white/35">{entry.graded_picks} graded · {entry.accuracy_pct}% correct</p></div><p className="text-xl font-black">{entry.correct_picks}</p></div>)}</div> : <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">Standings will appear as Week {week?.week ?? "—"} games are graded.</p>}
        </section>
 </>;
}

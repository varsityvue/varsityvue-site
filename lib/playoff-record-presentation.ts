import recordData from "@/data/playoff-records-through-area-2026.json";
import type { Standing } from "@/lib/standings";
import type { Game } from "@/types/platform";
import { verifiedWinner } from "@/lib/playoff-bracket-advancement";

const throughArea = new Map(recordData.records.map(row => [row.schoolSlug, row]));
const postAreaRounds = new Set(["Regional Semifinal", "Regional Final", "State Semifinal", "State Championship"]);

/** Source-backed full-season records fill schedule gaps; only verified later results extend them. */
export function completePostseasonStanding(standing: Standing | undefined, games: Game[], schoolSlug: string, season = 2026) {
  if (!standing) return undefined;
  const postseason = games.filter(g => g.season === season && (!g.sport || g.sport === "football") && g.gameType === "playoff" && (g.homeSchoolSlug === schoolSlug || g.awaySchoolSlug === schoolSlug));
  const baseline = season === recordData.season ? throughArea.get(schoolSlug) : undefined;
  if (baseline) {
    let wins = baseline.wins;
    let losses = baseline.losses;
    const outcomes = new Map<string, Set<boolean>>();
    for (const game of postseason) {
      if (!game.playoff || !postAreaRounds.has(game.playoff.round) || !verifiedWinner(game) || !game.homeSchoolSlug || !game.awaySchoolSlug) continue;
      const home = game.homeScore ?? game.score?.home;
      const away = game.awayScore ?? game.score?.away;
      const winningSlug = game.resultType === "forfeit" ? game.officialWinnerSchoolSlug
        : typeof home === "number" && typeof away === "number" ? (home > away ? game.homeSchoolSlug : game.awaySchoolSlug)
        : null;
      if (!winningSlug) continue;
      const won = winningSlug === schoolSlug;
      const results = outcomes.get(game.id) ?? new Set<boolean>();
      results.add(won);
      outcomes.set(game.id, results);
    }
    for (const results of outcomes.values()) {
      if (results.size !== 1) continue; // Conflicting copies are not a verified outcome.
      if (results.has(true)) wins++;
      else losses++;
    }
    return { ...standing, overallWins: wins, overallLosses: losses, overallRecordKnown: true };
  }
  if (!postseason.length) return standing;
  const verifiedFinals = postseason.filter(g => verifiedWinner(g)).length;
  return standing.overallWins + standing.overallLosses >= 10 + verifiedFinals ? standing : { ...standing, overallRecordKnown: false };
}

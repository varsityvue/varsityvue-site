import type { Standing } from "@/lib/standings";
import type { Game } from "@/types/platform";
import { verifiedWinner } from "@/lib/playoff-bracket-advancement";

/** A postseason result alone must not masquerade as an overall season record. */
export function completePostseasonStanding(standing: Standing | undefined, games: Game[], schoolSlug: string, season = 2026) {
  if (!standing) return undefined;
  const postseason = games.filter(g => g.season === season && g.gameType === "playoff" && (g.homeSchoolSlug === schoolSlug || g.awaySchoolSlug === schoolSlug));
  if (!postseason.length) return standing;
  const verifiedFinals = postseason.filter(g => verifiedWinner(g)).length;
  return standing.overallWins + standing.overallLosses >= 10 + verifiedFinals ? standing : { ...standing, overallRecordKnown: false };
}

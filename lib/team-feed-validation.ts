import { getGameById } from "@/lib/games";
import { getSchoolById } from "@/lib/schools";
import { isTeamFeedEnabled } from "@/lib/team-feed-eligibility";

export function validateFeedRelationships(primary: string, secondary: string | null, gameId: string | null) {
  const school = getSchoolById(primary);
  if (!school || !isTeamFeedEnabled(school.slug)) return false;
  if (secondary) {
    const other = getSchoolById(secondary);
    if (!other || secondary === primary) return false;
  }
  if (!gameId) return true;
  const game = getGameById(gameId);
  if (!game || game.gameType === "bye") return false;
  const teams = new Set([game.homeSchoolId, game.awaySchoolId, game.homeSchoolSlug, game.awaySchoolSlug]);
  return teams.has(primary) && (!secondary || teams.has(secondary));
}

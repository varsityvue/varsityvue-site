import type { Game } from "@/types/platform";

// Account discovery only; reporting and trusted LIVE authority remain server-side.
// Preserve the 2026 / Week 3 historical floor, with no obsolete upper week cap.
export function assignedScorekeeperGames(
  games: Game[],
  assignedSchoolSlugs: ReadonlySet<string>,
  identityReady: (game: Game) => boolean,
): Game[] {
  const rank = (game: Game) => game.status === "live" ? 0 : game.status === "upcoming" ? 1 : 2;
  const kickoffTime = (game: Game) => game.kickoff ? Date.parse(game.kickoff) : NaN;
  return games.filter((game) =>
    game.season === 2026 && game.week !== undefined && game.week >= 3 &&
    game.gameType !== "bye" && game.gameType !== "scrimmage" &&
    ["live", "upcoming", "scheduled"].includes(game.status) &&
    Boolean((game.awaySchoolSlug && assignedSchoolSlugs.has(game.awaySchoolSlug)) ||
      (game.homeSchoolSlug && assignedSchoolSlugs.has(game.homeSchoolSlug))) &&
    identityReady(game),
  ).sort((a, b) => {
    const priority = rank(a) - rank(b);
    if (priority) return priority;
    // Upcoming games: nearest confirmed kickoff first, TBD last. Unresolved
    // past games retain newest-first order. No cap can hide an assigned game.
    const aTime = kickoffTime(a); const bTime = kickoffTime(b);
    if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) {
      return Number.isFinite(aTime) ? -1 : Number.isFinite(bTime) ? 1 : a.id.localeCompare(b.id);
    }
    const kickoff = a.status === "upcoming"
      ? aTime - bTime
      : bTime - aTime;
    return kickoff || a.id.localeCompare(b.id);
  });
}

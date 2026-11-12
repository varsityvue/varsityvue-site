import type { Game, School } from "@/types/platform";

/** A catalog entry alone does not establish tracked public coverage. */
export function getTrackedDirectorySchools(schools: readonly School[], games: readonly Game[]): School[] {
  const trackedSlugs = new Set(games.flatMap((game) => [game.homeSchoolSlug, game.awaySchoolSlug]));
  return schools.filter((school) => school.status === "pilot" || trackedSlugs.has(school.slug));
}

import type { Game, School } from "@/types/platform";

export type FollowGame = Pick<Game, "id" | "status" | "kickoff" | "homeSchoolSlug" | "awaySchoolSlug">;

export function isSchoolFollowed(slug: string | undefined, followed: ReadonlySet<string>) {
  return Boolean(slug && followed.has(slug));
}

export function gamesInvolvingFollowedSchools<T extends FollowGame>(
  games: readonly T[],
  followed: ReadonlySet<string>,
): T[] {
  return games.filter((game) =>
    isSchoolFollowed(game.awaySchoolSlug, followed) ||
    isSchoolFollowed(game.homeSchoolSlug, followed),
  );
}

export function deduplicateGamesById<T extends { id: string }>(games: readonly T[]): T[] {
  const seen = new Set<string>();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

function gameTime(game: Pick<FollowGame, "kickoff">) {
  const time = game.kickoff ? Date.parse(game.kickoff) : NaN;
  return Number.isFinite(time) ? time : null;
}

function gameRank(game: FollowGame, now: number) {
  const time = gameTime(game);
  if (game.status === "live") return 0;
  if (game.status === "upcoming" || (game.status === "scheduled" && time !== null && time > now)) return 1;
  if (game.status === "final") return 2;
  return 3;
}

export function compareFollowedGames<T extends FollowGame>(a: T, b: T, now: number) {
  const rankA = gameRank(a, now);
  const rankB = gameRank(b, now);
  if (rankA !== rankB) return rankA - rankB;
  const timeA = gameTime(a);
  const timeB = gameTime(b);
  if (timeA !== null && timeB !== null && timeA !== timeB) {
    return rankA === 2 ? timeB - timeA : timeA - timeB;
  }
  if (timeA === null && timeB !== null) return 1;
  if (timeA !== null && timeB === null) return -1;
  const matchupA = `${a.awaySchoolSlug ?? ""}:${a.homeSchoolSlug ?? ""}`;
  const matchupB = `${b.awaySchoolSlug ?? ""}:${b.homeSchoolSlug ?? ""}`;
  return matchupA.localeCompare(matchupB) || a.id.localeCompare(b.id);
}

export function orderFollowedGames<T extends FollowGame>(games: readonly T[], now: number): T[] {
  return deduplicateGamesById(games).sort((a, b) => compareFollowedGames(a, b, now));
}

export type FollowedSchoolGame<T extends FollowGame> = {
  school: School;
  game?: T;
};

export function orderFollowedSchoolsForHome<T extends FollowGame>(
  schools: readonly School[],
  games: readonly T[],
  followed: ReadonlySet<string>,
  now: number,
): FollowedSchoolGame<T>[] {
  const bySchool = new Map<string, T[]>();
  for (const game of deduplicateGamesById(games)) {
    for (const slug of new Set([game.awaySchoolSlug, game.homeSchoolSlug])) {
      if (!slug || !followed.has(slug)) continue;
      const entries = bySchool.get(slug) ?? [];
      entries.push(game);
      bySchool.set(slug, entries);
    }
  }
  return schools
    .filter((school) => followed.has(school.slug))
    .map((school) => ({
      school,
      game: orderFollowedGames(bySchool.get(school.slug) ?? [], now)
        .find((game) => gameRank(game, now) < 3),
    }))
    .sort((a, b) => {
      if (a.game && b.game) return compareFollowedGames(a.game, b.game, now) ||
        a.school.name.localeCompare(b.school.name) || a.school.slug.localeCompare(b.school.slug);
      if (a.game) return -1;
      if (b.game) return 1;
      return a.school.name.localeCompare(b.school.name) || a.school.slug.localeCompare(b.school.slug);
    });
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const FOLLOWING_UPCOMING_DAYS = 14;
export const FOLLOWING_FINAL_DAYS = 7;

// Keep the Scores Following window finite while the browse slate remains date-based.
export function relevantFollowedGames<T extends FollowGame>(
  games: readonly T[],
  followed: ReadonlySet<string>,
  now: number,
): T[] {
  const centralToday = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Chicago",
  }).format(new Date(now));
  return orderFollowedGames(gamesInvolvingFollowedSchools(games, followed).filter((game) => {
    if (game.status === "live") return true;
    if (!game.kickoff) return false;
    const dateOnly = !game.kickoff.includes("T");
    const timestamp = Date.parse(dateOnly ? `${game.kickoff}T12:00:00Z` : game.kickoff);
    if (!Number.isFinite(timestamp)) return false;
    if (game.status === "upcoming") {
      if (dateOnly && game.kickoff < centralToday) return false;
      return timestamp <= now + FOLLOWING_UPCOMING_DAYS * DAY_MS &&
        (dateOnly || timestamp >= now);
    }
    return game.status === "final" && timestamp <= now &&
      timestamp >= now - FOLLOWING_FINAL_DAYS * DAY_MS;
  }), now);
}

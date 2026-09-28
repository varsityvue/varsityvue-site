import assert from "node:assert/strict";
import test from "node:test";
import type { School } from "@/types/platform";
import {
  deduplicateGamesById,
  gamesInvolvingFollowedSchools,
  isSchoolFollowed,
  orderFollowedGames,
  orderFollowedSchoolsForHome,
  type FollowGame,
} from "@/lib/follow-personalization";

const now = Date.parse("2026-09-28T18:00:00Z");
const schools = ["alpha", "beta", "gamma", "delta", "empty"].map((slug) => ({
  slug, name: slug.toUpperCase(),
}) as School);
const game = (id: string, status: FollowGame["status"], kickoff: string | undefined, awaySchoolSlug = "alpha", homeSchoolSlug = "beta"): FollowGame =>
  ({ id, status, kickoff, awaySchoolSlug, homeSchoolSlug });

test("empty follows, one follow, and both teams followed yield one game", () => {
  const match = game("a", "live", "2026-09-28T18:00:00Z");
  assert.equal(isSchoolFollowed("alpha", new Set()), false);
  assert.deepEqual(gamesInvolvingFollowedSchools([match], new Set()), []);
  assert.deepEqual(gamesInvolvingFollowedSchools([match], new Set(["alpha"])), [match]);
  assert.deepEqual(gamesInvolvingFollowedSchools([match], new Set(["alpha", "beta"])), [match]);
  assert.deepEqual(deduplicateGamesById([match, match]), [match]);
});

test("followed games order live, nearest upcoming, latest final, then stable fallback", () => {
  const games = [
    game("older-final", "final", "2026-09-20T00:00:00Z"),
    game("late-upcoming", "upcoming", "2026-10-01T00:00:00Z"),
    game("newer-final", "final", "2026-09-27T00:00:00Z"),
    game("live-z", "live", "2026-09-28T18:00:00Z", "gamma", "delta"),
    game("live-a", "live", "2026-09-28T18:00:00Z"),
    game("soon-upcoming", "upcoming", "2026-09-29T00:00:00Z"),
    game("pending", "scheduled", "2026-09-21T00:00:00Z"),
  ];
  assert.deepEqual(orderFollowedGames([...games, games[0]], now).map((entry) => entry.id), [
    "live-a", "live-z", "soon-upcoming", "late-upcoming", "newer-final", "older-final", "pending",
  ]);
});

test("equal kickoff and unknown kickoff have deterministic matchup/id fallback", () => {
  const games = [game("z", "upcoming", undefined), game("b", "upcoming", "2026-09-29T00:00:00Z"), game("a", "upcoming", "2026-09-29T00:00:00Z")];
  assert.deepEqual(orderFollowedGames(games, now).map((entry) => entry.id), ["a", "b", "z"]);
});

test("homepage handles many follows, unknown slug, no game, and state transitions", () => {
  const followed = new Set(["alpha", "beta", "gamma", "delta", "empty", "not-in-catalog"]);
  const games = [
    game("final", "final", "2026-09-27T18:00:00Z", "gamma", "other"),
    game("upcoming", "upcoming", "2026-09-29T18:00:00Z", "beta", "other"),
    game("live", "live", "2026-09-28T18:00:00Z", "alpha", "delta"),
  ];
  const rows = orderFollowedSchoolsForHome(schools, games, followed, now);
  assert.deepEqual(rows.map((row) => row.school.slug), ["alpha", "delta", "beta", "gamma", "empty"]);
  assert.equal(rows.at(-1)?.game, undefined);
  assert.equal(rows.length, 5);
  assert.deepEqual(orderFollowedSchoolsForHome(schools, games, new Set(), now), []);
  const ended = orderFollowedSchoolsForHome(schools, [game("live", "final", "2026-09-28T18:00:00Z", "alpha", "delta"), ...games.slice(0, 2)], followed, now);
  assert.equal(ended[0]?.game?.status, "upcoming");
});

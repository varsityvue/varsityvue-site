import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getGameById, getGames } from "./games";
import { attentionReasons, weekForOperations, type CanonicalScoreState, type PendingScoreReport } from "./scoring-operations";

test("Monday in Central Time selects the coming Friday slate", () => {
  assert.equal(weekForOperations(getGames(), new Date("2026-09-28T22:00:00Z")), 6);
});

test("attention reasons distinguish evidence from elapsed-time guesses", () => {
  const game = getGameById("early-at-de-leon-2026-week-5");
  assert.ok(game);
  const now = new Date("2026-09-26T04:00:00Z");
  const state: CanonicalScoreState = {
    game_id: game.id, status: "live", away_score: 7, home_score: 14, period: "3rd", clock: null,
    updated_at: "2026-09-26T01:00:00Z", score_revision: 2, away_school_slug: "early", home_school_slug: "de-leon", verified: true,
  };
  const reports: PendingScoreReport[] = [
    { id: "a", game_id: game.id, away_score: 7, home_score: 14, game_status: "live", created_at: "2026-09-26T00:30:00Z" },
    { id: "b", game_id: game.id, away_score: 7, home_score: 21, game_status: "live", created_at: "2026-09-26T01:10:00Z" },
  ];
  const reasons = attentionReasons({ ...game, status: "live" }, state, reports, true, now);
  assert.deepEqual(reasons, ["2 pending reports", "Pending reports conflict", "Canonical score changed after a pending report", "Live update older than 90 minutes", "Open missing-score candidate"]);
  assert.ok(!reasons.some((reason) => reason.includes("finished")));
});

test("missing canonical identity is visible even when the repository matchup is known", () => {
  const game = getGameById("early-at-de-leon-2026-week-5");
  assert.ok(game);
  const state: CanonicalScoreState = {
    game_id: game.id, status: "final", away_score: 21, home_score: 51, period: null, clock: null,
    updated_at: "2026-09-26T04:00:00Z", score_revision: 0, away_school_slug: null, home_school_slug: null, verified: true,
  };
  assert.deepEqual(attentionReasons({ ...game, status: "final" }, state, [], false, new Date("2026-09-28T00:00:00Z")), ["Canonical identity missing"]);
});

test("database identity snapshot agrees with every playable repository matchup", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260928223000_friday_scoring_operations_v1.sql", import.meta.url), "utf8");
  const mapped = new Map([...sql.matchAll(/\('([^']+)', '([^']+)', '([^']+)'\)/g)]
    .map((match) => [match[1], [match[2], match[3]]] as const));
  const playable = getGames().filter((game) => game.gameType !== "bye" && game.gameType !== "scrimmage" &&
    game.awaySchoolSlug && game.homeSchoolSlug && game.awaySchoolSlug !== game.homeSchoolSlug &&
    !["bye", "opponent", "special-event"].includes(game.awaySchoolSlug) &&
    !["bye", "opponent", "special-event"].includes(game.homeSchoolSlug));
  assert.equal(mapped.size, playable.length);
  for (const game of playable) assert.deepEqual(mapped.get(game.id), [game.awaySchoolSlug, game.homeSchoolSlug], game.id);
});

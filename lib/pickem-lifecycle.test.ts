import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePickemSubmission, rankPickemStandings } from "./pickem-lifecycle";

const kickoff = Date.parse("2026-09-25T19:00:00-05:00");
const games = [
  { id: "early", awaySchoolSlug: "early", homeSchoolSlug: "de-leon", lockAt: "2026-09-25T19:00:00-05:00" },
  { id: "hawley", awaySchoolSlug: "hawley", homeSchoolSlug: "post", lockAt: "2026-09-25T19:30:00-05:00" },
];

test("submission accepts a canonical pick one second before kickoff", () => {
  const result = evaluatePickemSubmission({
    games,
    selections: new Map([["early", "de-leon"]]),
    userId: "member-a",
    nowMs: kickoff - 1_000,
  });
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.lockedGameIds, []);
});

test("submission rejects exact and post-kickoff picks", () => {
  const atKickoff = evaluatePickemSubmission({
    games,
    selections: new Map([["early", "early"]]),
    userId: "member-a",
    nowMs: kickoff,
  });
  const afterKickoff = evaluatePickemSubmission({
    games,
    selections: new Map([["early", "early"]]),
    userId: "member-a",
    nowMs: kickoff + 1_000,
  });
  assert.deepEqual(atKickoff.lockedGameIds, ["early"]);
  assert.deepEqual(afterKickoff.lockedGameIds, ["early"]);
  assert.equal(atKickoff.rows.length, 0);
});

test("submission compares absolute kickoff instants across Central daylight-saving offsets", () => {
  const standardTimeGame = [{
    id: "november",
    awaySchoolSlug: "away",
    homeSchoolSlug: "home",
    lockAt: "2026-11-06T19:00:00-06:00",
  }];
  const oneSecondBefore = evaluatePickemSubmission({
    games: standardTimeGame,
    selections: new Map([["november", "away"]]),
    userId: "member-a",
    nowMs: Date.parse("2026-11-07T00:59:59Z"),
  });
  const atKickoff = evaluatePickemSubmission({
    games: standardTimeGame,
    selections: new Map([["november", "away"]]),
    userId: "member-a",
    nowMs: Date.parse("2026-11-07T01:00:00Z"),
  });

  assert.equal(oneSecondBefore.rows.length, 1);
  assert.deepEqual(atKickoff.lockedGameIds, ["november"]);
});

test("stale mixed submission reports the locked game instead of silently partially saving", () => {
  const result = evaluatePickemSubmission({
    games,
    selections: new Map([["early", "de-leon"], ["hawley", "post"]]),
    userId: "member-a",
    nowMs: kickoff,
  });
  assert.deepEqual(result.lockedGameIds, ["early"]);
  assert.deepEqual(result.rows.map((row) => row.pickem_game_id), ["hawley"]);
});

test("submission rejects a team outside the canonical matchup", () => {
  const result = evaluatePickemSubmission({
    games,
    selections: new Map([["early", "not-a-team"]]),
    userId: "member-a",
    nowMs: kickoff - 1_000,
  });
  assert.deepEqual(result.invalidGameIds, ["early"]);
  assert.equal(result.rows.length, 0);
});

test("leaderboard shares point ranks and deterministically orders exact ties", () => {
  const ranked = rankPickemStandings([
    { user_id: "member-c", display_name: "C", username: "c", graded_picks: 8, correct_picks: 6, accuracy_pct: 75 },
    { user_id: "member-b", display_name: "B", username: "b", graded_picks: 6, correct_picks: 6, accuracy_pct: 100 },
    { user_id: "member-a", display_name: "A", username: "a", graded_picks: 6, correct_picks: 6, accuracy_pct: 100 },
    { user_id: "member-d", display_name: "D", username: "d", graded_picks: 8, correct_picks: 5, accuracy_pct: 62.5 },
  ]);

  assert.deepEqual(ranked.map(({ user_id, rank }) => [user_id, rank]), [
    ["member-a", 1],
    ["member-b", 1],
    ["member-c", 1],
    ["member-d", 4],
  ]);
});

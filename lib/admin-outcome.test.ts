import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalOutcomeSummary,
  canonicalOutcomeValidation,
  type CanonicalOutcomeGame,
} from "./admin-outcome";

const game: CanonicalOutcomeGame = {
  gameId: "away-at-home",
  matchup: "Away at Home",
  awayName: "Away",
  awaySlug: "away",
  homeName: "Home",
  homeSlug: "home",
  awayScore: 21,
  homeScore: 14,
  status: "final",
  verified: true,
  resultType: "played",
  officialWinnerSlug: null,
  outcomeRevision: 2,
};

test("played accepts unequal scores and rejects ties or missing scores", () => {
  assert.equal(canonicalOutcomeValidation(game, "played", "", "Official correction"), null);
  assert.match(canonicalOutcomeValidation({ ...game, homeScore: 21 }, "played", "", "Reason")!, /unequal/);
  assert.match(canonicalOutcomeValidation({ ...game, homeScore: null }, "played", "", "Reason")!, /both final scores/);
});

test("tie accepts only equal complete scores", () => {
  assert.equal(canonicalOutcomeValidation({ ...game, homeScore: 21 }, "tie", "", "Official tie"), null);
  assert.match(canonicalOutcomeValidation(game, "tie", "", "Reason")!, /equal/);
});

test("forfeit winner is restricted to the participating schools", () => {
  assert.equal(canonicalOutcomeValidation(game, "forfeit", "away", "Official ruling"), null);
  assert.equal(canonicalOutcomeValidation(game, "forfeit", "home", "Official ruling"), null);
  assert.match(canonicalOutcomeValidation(game, "forfeit", "outsider", "Reason")!, /matchup/);
  assert.match(canonicalOutcomeValidation(game, "forfeit", "", "Reason")!, /matchup/);
});

test("reason and verified-final prerequisites are enforced", () => {
  assert.match(canonicalOutcomeValidation(game, "no_contest", "", " ")!, /reason/);
  assert.match(canonicalOutcomeValidation({ ...game, verified: false }, "no_contest", "", "Reason")!, /verified final/);
});

test("confirmation summary states grading effects and selection preservation", () => {
  assert.match(canonicalOutcomeSummary(game, "forfeit", "home"), /Home is the authoritative winner/);
  assert.match(canonicalOutcomeSummary(game, "tie", ""), /VOID/);
  assert.match(canonicalOutcomeSummary(game, "tie", ""), /Saved member selections are preserved/);
});

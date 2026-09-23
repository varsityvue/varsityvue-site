import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalOutcomeSummary,
  canonicalOutcomeValidation,
  scorelessOutcomeSummary,
  scorelessOutcomeValidation,
  type CanonicalOutcomeGame,
  type ScorelessOutcomeGame,
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

const unplayedGame: ScorelessOutcomeGame = {
  gameId: "away-at-home-upcoming",
  matchup: "Away at Home",
  awayName: "Away",
  awaySlug: "away",
  homeName: "Home",
  homeSlug: "home",
  status: "scheduled",
  outcomeRevision: 0,
};

test("scoreless origination requires source, reason, and an unplayed canonical game", () => {
  assert.equal(scorelessOutcomeValidation(unplayedGame, "no_contest", "", "UIL ruling", "Weather cancellation"), null);
  assert.match(scorelessOutcomeValidation(undefined, "no_contest", "", "UIL", "Reason")!, /canonical game/);
  assert.match(scorelessOutcomeValidation({ ...unplayedGame, status: "final" }, "no_contest", "", "UIL", "Reason")!, /final already exists/);
  assert.match(scorelessOutcomeValidation(unplayedGame, "no_contest", "", " ", "Reason")!, /source/);
  assert.match(scorelessOutcomeValidation(unplayedGame, "no_contest", "", "UIL", " ")!, /reason/);
});

test("scoreless forfeit accepts only an explicit participating-school winner", () => {
  assert.equal(scorelessOutcomeValidation(unplayedGame, "forfeit", "away", "District ruling", "Unable to field a team"), null);
  assert.equal(scorelessOutcomeValidation(unplayedGame, "forfeit", "home", "District ruling", "Unable to field a team"), null);
  assert.match(scorelessOutcomeValidation(unplayedGame, "forfeit", "outsider", "District ruling", "Reason")!, /official winner/);
  assert.match(scorelessOutcomeValidation(unplayedGame, "no_contest", "home", "District ruling", "Reason")!, /cannot have/);
});

test("scoreless confirmation explains Pick Em and notification effects", () => {
  assert.match(scorelessOutcomeSummary(unplayedGame, "forfeit", "away"), /Away is the official winner/);
  assert.match(scorelessOutcomeSummary(unplayedGame, "forfeit", "away"), /No numeric final-score alert/);
  assert.match(scorelessOutcomeSummary(unplayedGame, "no_contest", ""), /VOID/);
  assert.match(scorelessOutcomeSummary(unplayedGame, "no_contest", ""), /picks are preserved/i);
});

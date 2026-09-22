import assert from "node:assert/strict";
import test from "node:test";

import { pickemWeekDisclosureLabel, summarizePickemWeeks } from "./pickem-week-summary";

type Outcome = "played" | "forfeit" | "tie" | "no_contest" | "cancelled" | "postponed" | "unclassified";

function game(id: string, weekId: string, outcome: Outcome) {
  const eligible = outcome === "played" || outcome === "forfeit";
  return {
    id,
    weekId,
    resultWinnerSchoolSlug: eligible ? `${id}-winner` : null,
    gradedAt: eligible ? "2026-09-22T00:00:00Z" : null,
  };
}

function summarize(
  games: ReturnType<typeof game>[],
  picks: Array<{ pickemGameId: string; userId?: string; isCorrect: boolean | null }>,
) {
  return summarizePickemWeeks({
    userId: "member-a",
    games,
    picks: picks.map((pick) => ({ userId: "member-a", ...pick })),
  });
}

test("fully pending week has saved picks but no eligible denominator or phantom losses", () => {
  const result = summarize(
    [game("postponed", "week-1", "postponed"), game("unclassified", "week-1", "unclassified")],
    [{ pickemGameId: "postponed", isCorrect: null }],
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 1, resultsGraded: 0, eligibleGames: 0, pointsEarned: 0 });
});

test("partially graded week reports graded picks over eligible games", () => {
  const result = summarize(
    [game("played-a", "week-1", "played"), game("played-b", "week-1", "played"), game("pending", "week-1", "postponed")],
    [{ pickemGameId: "played-a", isCorrect: true }, { pickemGameId: "pending", isCorrect: null }],
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 2, resultsGraded: 1, eligibleGames: 2, pointsEarned: 1 });
});

test("fully graded week counts correct picks as points", () => {
  const result = summarize(
    [game("a", "week-1", "played"), game("b", "week-1", "forfeit"), game("c", "week-1", "played")],
    [
      { pickemGameId: "a", isCorrect: true },
      { pickemGameId: "b", isCorrect: false },
      { pickemGameId: "c", isCorrect: true },
    ],
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 3, resultsGraded: 3, eligibleGames: 3, pointsEarned: 2 });
});

test("missing picks receive no point and remain visible in the eligible denominator", () => {
  const result = summarize(
    [game("picked", "week-1", "played"), game("missed", "week-1", "played")],
    [{ pickemGameId: "picked", isCorrect: true }],
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 1, resultsGraded: 1, eligibleGames: 2, pointsEarned: 1 });
});

test("played and explicit-winner forfeit results are eligible", () => {
  const result = summarize(
    [game("played", "week-1", "played"), game("forfeit", "week-1", "forfeit")],
    [{ pickemGameId: "played", isCorrect: true }, { pickemGameId: "forfeit", isCorrect: true }],
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 2, resultsGraded: 2, eligibleGames: 2, pointsEarned: 2 });
});

test("tie, no-contest, cancellation, postponed, and unclassified results are excluded", () => {
  const outcomes: Outcome[] = ["tie", "no_contest", "cancelled", "postponed", "unclassified"];
  const result = summarize(
    outcomes.map((outcome) => game(outcome, "week-1", outcome)),
    outcomes.map((outcome) => ({ pickemGameId: outcome, isCorrect: null })),
  ).get("week-1");
  assert.deepEqual(result, { picksSaved: 5, resultsGraded: 0, eligibleGames: 0, pointsEarned: 0 });
});

test("a corrected grade replaces points instead of duplicating them", () => {
  const games = [game("played", "week-1", "played")];
  const before = summarize(games, [{ pickemGameId: "played", isCorrect: false }]).get("week-1");
  const after = summarize(games, [{ pickemGameId: "played", isCorrect: true }]).get("week-1");
  const repeated = summarize(games, [{ pickemGameId: "played", isCorrect: true }]).get("week-1");
  assert.equal(before?.pointsEarned, 0);
  assert.equal(after?.pointsEarned, 1);
  assert.deepEqual(repeated, after);
});

test("no picks produce no graded results, points, or phantom totals", () => {
  const result = summarize([game("played", "week-1", "played")], []).get("week-1");
  assert.deepEqual(result, { picksSaved: 0, resultsGraded: 0, eligibleGames: 1, pointsEarned: 0 });
});

test("weeks remain isolated", () => {
  const result = summarize(
    [game("a", "week-1", "played"), game("b", "week-2", "played")],
    [{ pickemGameId: "a", isCorrect: true }, { pickemGameId: "b", isCorrect: false }],
  );
  assert.deepEqual(result.get("week-1"), { picksSaved: 1, resultsGraded: 1, eligibleGames: 1, pointsEarned: 1 });
  assert.deepEqual(result.get("week-2"), { picksSaved: 1, resultsGraded: 1, eligibleGames: 1, pointsEarned: 0 });
});

test("another member's picks are ignored", () => {
  const result = summarizePickemWeeks({
    userId: "member-a",
    games: [game("played", "week-1", "played")],
    picks: [
      { pickemGameId: "played", userId: "member-a", isCorrect: false },
      { pickemGameId: "played", userId: "member-b", isCorrect: true },
    ],
  }).get("week-1");
  assert.deepEqual(result, { picksSaved: 1, resultsGraded: 1, eligibleGames: 1, pointsEarned: 0 });
});

test("collapsed disclosure labels preserve View picks and Hide picks behavior", () => {
  assert.equal(pickemWeekDisclosureLabel(false), "View picks");
  assert.equal(pickemWeekDisclosureLabel(true), "Hide picks");
});

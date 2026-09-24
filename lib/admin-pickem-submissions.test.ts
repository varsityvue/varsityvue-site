import assert from "node:assert/strict";
import test from "node:test";

import {
  adminPickemGradeLabel,
  adminPickemSelectionLabel,
  groupAdminPickemSubmissions,
  type AdminPickemSubmissionRow,
} from "./admin-pickem-submissions";

function row(overrides: Partial<AdminPickemSubmissionRow> = {}): AdminPickemSubmissionRow {
  return {
    week_id: "week-5",
    season: 2026,
    week: 5,
    week_title: "Week 5 Pick ’Em",
    week_status: "open",
    entrant_user_id: "member-a",
    entrant_display_name: "Member A",
    entrant_username: null,
    entrant_saved_picks: 2,
    week_game_count: 3,
    entrant_complete: false,
    entrant_last_submitted_at: "2026-09-24T01:00:00Z",
    entrant_graded_picks: 1,
    entrant_points: 0,
    pickem_game_id: "pickem-game-1",
    game_id: "game-1",
    sort_order: 1,
    lock_at: "2026-09-26T00:00:00Z",
    is_locked: false,
    away_school_slug: "away",
    home_school_slug: "home",
    picked_school_slug: null,
    pick_submitted_at: "2026-09-24T01:00:00Z",
    game_status: "upcoming",
    result_type: null,
    result_winner_school_slug: null,
    graded_at: null,
    is_correct: null,
    ...overrides,
  };
}

test("keeps an open-game selection concealed", () => {
  const open = row({ picked_school_slug: "away" });
  assert.equal(adminPickemSelectionLabel(open), "Concealed until lock");
  assert.equal(adminPickemGradeLabel(open), "Open");
});

test("shows post-lock grades, including a numeric zero-point result", () => {
  const incorrect = row({
    is_locked: true,
    picked_school_slug: "away",
    result_winner_school_slug: "home",
    graded_at: "2026-09-26T02:00:00Z",
    is_correct: false,
  });
  assert.equal(adminPickemSelectionLabel(incorrect), "Selection available");
  assert.equal(adminPickemGradeLabel(incorrect), "Incorrect");
  assert.equal(incorrect.entrant_points, 0);
  assert.equal(incorrect.entrant_graded_picks, 1);
});

test("labels voids and incomplete entries without manufacturing grades", () => {
  assert.equal(adminPickemGradeLabel(row({ is_locked: true, result_type: "no_contest" })), "Void");
  assert.equal(adminPickemGradeLabel(row({ is_locked: true, game_status: "cancelled" })), "Void");
  assert.equal(adminPickemGradeLabel(row({ is_locked: true, picked_school_slug: null })), "No pick");
});

test("groups games by entrant and preserves completeness and game order", () => {
  const grouped = groupAdminPickemSubmissions([
    row({ pickem_game_id: "game-2", sort_order: 2 }),
    row({ pickem_game_id: "game-1", sort_order: 1 }),
    row({
      entrant_user_id: "member-b",
      entrant_display_name: null,
      entrant_username: "member_b",
      entrant_saved_picks: 3,
      entrant_complete: true,
      pickem_game_id: "game-3",
      sort_order: 1,
    }),
  ]);

  assert.equal(grouped.length, 2);
  assert.deepEqual(grouped[0].games.map((game) => game.pickem_game_id), ["game-1", "game-2"]);
  assert.equal(grouped[0].complete, false);
  assert.equal(grouped[1].displayName, "member_b");
  assert.equal(grouped[1].complete, true);
});

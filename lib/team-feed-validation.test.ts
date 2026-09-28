import assert from "node:assert/strict";
import { test } from "node:test";
import { validateFeedRelationships } from "./team-feed-validation";

test("featured schools and canonical matchup validate without requiring a game", () => {
  assert.equal(validateFeedRelationships("cisco", null, null), true);
  assert.equal(validateFeedRelationships("cisco", "jacksboro", "jacksboro-at-cisco-2026-week-5"), true);
  assert.equal(validateFeedRelationships("cisco", null, "jacksboro-at-cisco-2026-week-5"), true);
});

test("forged school and unrelated game combinations are rejected", () => {
  assert.equal(validateFeedRelationships("missing-school", null, null), false);
  assert.equal(validateFeedRelationships("cisco", "cisco", null), false);
  assert.equal(validateFeedRelationships("cisco", null, "missing-game"), false);
  assert.equal(validateFeedRelationships("cisco", "de-leon", "jacksboro-at-cisco-2026-week-5"), false);
  assert.equal(validateFeedRelationships("abilene-texas-leadership", null, null), false);
});

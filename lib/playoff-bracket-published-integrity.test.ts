import assert from "node:assert/strict";
import test from "node:test";
import { getGames } from "./games";
import { auditPublishedPlayoffGames } from "./playoff-bracket-schedule-audit";

test("all published 2026 bi-district games agree with statewide bracket fields", () => {
  const conflicts = auditPublishedPlayoffGames(getGames());
  assert.deepEqual(conflicts, []);
});

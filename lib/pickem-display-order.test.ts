import assert from "node:assert/strict";
import test from "node:test";

import { orderPickemSlateRows } from "./pickem-display-order";
import { createPickemClientState, isPickSelected } from "./pickem-client-state";

const ids = ["cross-plains", "de-leon", "eastland", "hamilton", "hamlin", "hawley", "rio-vista", "santo", "stephenville-jarrell", "crawford"];
const rows = ids.map((id, index) => Object.freeze({ id, sort_order: index + 1, lock_at: "2026-10-24T00:00:00Z" }));
Object.freeze(rows);

test("Week 9 saved tiebreaker is Game 1; every other game retains its relative order", () => {
  const reordered = orderPickemSlateRows(rows, "stephenville-jarrell");
  assert.deepEqual(reordered.map(row => row.id), [ids[8], ...ids.slice(0, 8), ids[9]]);
  assert.deepEqual(rows.map(row => row.id), ids);
  assert.deepEqual(rows.map(row => row.sort_order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const row of reordered) assert.strictEqual(row, rows.find(original => original.id === row.id));
});

test("the presentation rule has no season/week restriction and is idempotent", () => {
  for (const tiebreaker of [ids[0], ids[3], ids[9]]) {
    const ordered = orderPickemSlateRows(rows, tiebreaker);
    assert.equal(ordered[0].id, tiebreaker);
    assert.deepEqual(ordered.slice(1).map(row => row.id), ids.filter(id => id !== tiebreaker));
    assert.strictEqual(orderPickemSlateRows(ordered, tiebreaker), ordered);
  }
});

test("missing or invalid saved tiebreaker preserves the existing order", () => {
  for (const invalid of [null, "", "not-in-this-slate"]) {
    assert.strictEqual(orderPickemSlateRows(rows, invalid), rows);
  }
  const empty: Array<{ id: string }> = [];
  assert.strictEqual(orderPickemSlateRows(empty, "missing"), empty);
});

test("saved member selections remain attached to receipt game IDs after reordering", () => {
  const selections = Object.fromEntries(ids.map(id => [id, `${id}-away`]));
  const state = createPickemClientState(selections, selections);
  const games = orderPickemSlateRows(rows, ids[8]);
  for (const game of games) assert.ok(isPickSelected(state.selections, game.id, `${game.id}-away`));
  assert.deepEqual(state.selections, selections);
});

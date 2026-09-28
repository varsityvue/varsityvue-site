import assert from "node:assert/strict";
import test from "node:test";

import { orderPickemSlateRows } from "./pickem-display-order";
import { createPickemClientState, isPickSelected } from "./pickem-client-state";

const ids = ["cross-plains", "stamford", "goldthwaite", "santo", "hubbard", "mart"];
const rows = ids.map((id, index) => ({ id, sort_order: index + 1 }));

test("Week 6 displays the same canonical tiebreaker first and retains other relative order", () => {
  const reordered = orderPickemSlateRows(rows, 2026, 6, "goldthwaite");
  assert.deepEqual(reordered.map((row) => row.id), ["goldthwaite", "cross-plains", "stamford", "santo", "hubbard", "mart"]);
  assert.deepEqual(rows.map((row) => row.sort_order), [1, 2, 3, 4, 5, 6]);
  assert.strictEqual(reordered[0], rows[2]);
  assert.strictEqual(orderPickemSlateRows(rows, 2026, 7, "goldthwaite"), rows);
});

test("a saved selection stays attached to its game ID after display reordering", () => {
  const state = createPickemClientState({ cross_plains_game_id: "cross-plains", goldthwaite_game_id: "miles" }, { cross_plains_game_id: "cross-plains", goldthwaite_game_id: "miles" });
  const games = orderPickemSlateRows([{ id: "cross_plains_game_id" }, { id: "goldthwaite_game_id" }], 2026, 6, "goldthwaite_game_id");
  assert.equal(games[0].id, "goldthwaite_game_id");
  assert.ok(isPickSelected(state.selections, games[0].id, "miles"));
  assert.ok(isPickSelected(state.selections, games[1].id, "cross-plains"));
});

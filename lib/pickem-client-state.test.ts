import assert from "node:assert/strict";
import test from "node:test";

import {
  canSubmitPickem,
  createPickemClientState,
  derivePickemClientState,
  isPickSelected,
  pickemClientReducer,
  shouldShowMobileSaveBar,
  shouldWarnBeforeUnload,
} from "./pickem-client-state";

const games = [
  { id: "game-1", locked: false },
  { id: "game-2", locked: false },
  { id: "game-3", locked: true },
];

test("selected indicator follows the current selection", () => {
  const state = createPickemClientState({ "game-1": "cisco" }, {});
  assert.equal(isPickSelected(state.selections, "game-1", "cisco"), true);
  assert.equal(isPickSelected(state.selections, "game-1", "jacksboro"), false);
});

test("dirty count tracks multiple changes", () => {
  const state = createPickemClientState(
    { "game-1": "cisco", "game-2": "tolar" },
    { "game-1": "jacksboro", "game-2": "comanche" },
  );
  assert.equal(derivePickemClientState(games, state).pendingChangeCount, 2);
});

test("reverting a selection removes that matchup from the dirty count", () => {
  let state = createPickemClientState({ "game-1": "jacksboro" }, { "game-1": "jacksboro" });
  state = pickemClientReducer(state, { type: "select", gameId: "game-1", schoolSlug: "cisco", locked: false });
  assert.equal(derivePickemClientState(games, state).pendingChangeCount, 1);
  state = pickemClientReducer(state, { type: "select", gameId: "game-1", schoolSlug: "jacksboro", locked: false });
  assert.equal(derivePickemClientState(games, state).pendingChangeCount, 0);
});

test("mobile save bar appears only while dirty", () => {
  assert.equal(shouldShowMobileSaveBar(false), false);
  assert.equal(shouldShowMobileSaveBar(true), true);
});

test("successful save resets dirty state", () => {
  let state = createPickemClientState({ "game-1": "cisco" }, { "game-1": "jacksboro" });
  state = pickemClientReducer(state, { type: "save-start" });
  state = pickemClientReducer(state, { type: "save-success", message: "Saved" });
  assert.equal(derivePickemClientState(games, state).hasUnsavedChanges, false);
  assert.equal(state.saveStatus, "success");
});

test("failed save preserves selections and exposes retry", () => {
  let state = createPickemClientState({ "game-1": "cisco" }, { "game-1": "jacksboro" });
  state = pickemClientReducer(state, { type: "save-start" });
  state = pickemClientReducer(state, { type: "save-error", message: "Try again" });
  assert.equal(state.selections["game-1"], "cisco");
  assert.equal(state.savedSelections["game-1"], "jacksboro");
  assert.equal(canSubmitPickem(state, derivePickemClientState(games, state).hasUnsavedChanges), true);
});

test("duplicate submission is prevented while pending", () => {
  let state = createPickemClientState({ "game-1": "cisco" }, { "game-1": "jacksboro" });
  state = pickemClientReducer(state, { type: "save-start" });
  assert.equal(canSubmitPickem(state, true), false);
  assert.equal(pickemClientReducer(state, { type: "save-start" }), state);
});

test("progress count updates with current selections", () => {
  let state = createPickemClientState({ "game-1": "cisco" }, {});
  assert.equal(derivePickemClientState(games, state).selectedCount, 1);
  state = pickemClientReducer(state, { type: "select", gameId: "game-2", schoolSlug: "tolar", locked: false });
  assert.equal(derivePickemClientState(games, state).selectedCount, 2);
});

test("locked games cannot be changed", () => {
  const state = createPickemClientState({ "game-3": "post" }, { "game-3": "post" });
  const next = pickemClientReducer(state, { type: "select", gameId: "game-3", schoolSlug: "hawley", locked: true });
  assert.equal(next, state);
});

test("locked selected picks remain visibly selected", () => {
  const state = createPickemClientState({ "game-3": "post" }, { "game-3": "post" });
  assert.equal(isPickSelected(state.selections, "game-3", "post"), true);
});

test("beforeunload protection follows dirty state", () => {
  assert.equal(shouldWarnBeforeUnload(false), false);
  assert.equal(shouldWarnBeforeUnload(true), true);
});

test("guest selection behavior remains local and respects locks", () => {
  let state = createPickemClientState({}, {});
  state = pickemClientReducer(state, { type: "select", gameId: "game-1", schoolSlug: "cisco", locked: false });
  state = pickemClientReducer(state, { type: "select", gameId: "game-3", schoolSlug: "post", locked: true });
  assert.deepEqual(state.selections, { "game-1": "cisco" });
  assert.deepEqual(state.savedSelections, {});
});

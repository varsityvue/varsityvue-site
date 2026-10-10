import assert from "node:assert/strict";
import test from "node:test";
import { isBusinessConflict } from "./business-conflict";

test("business conflict contracts accept PT409 and exact legacy messages", () => {
  assert.equal(isBusinessConflict({ code: "PT409" }), true);
  assert.equal(isBusinessConflict({ code: "40001", message: "Stale schedule revision. Refresh and try again." }), true);
});
test("genuine engine serialization failures are not business conflicts", () => {
  assert.equal(isBusinessConflict({ code: "40001", message: "could not serialize access due to concurrent update" }), false);
  assert.equal(isBusinessConflict({ code: "40001" }), false);
  assert.equal(isBusinessConflict({ code: "42501", message: "Stale schedule revision. Refresh and try again." }), false);
});

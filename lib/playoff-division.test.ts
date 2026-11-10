import assert from "node:assert/strict";
import test from "node:test";
import { normalizePlayoffDivision } from "./playoff-division";
test("normalizes published UIL division names and compact bracket IDs", () => {
  for (const [label, expected] of [
    ["2A Division I", "2AD1"], ["2A Division II", "2AD2"],
    ["3A D1", "3AD1"], ["3A-D2", "3AD2"],
    ["4A Division I", "4AD1"], ["4A Division II", "4AD2"],
  ]) assert.equal(normalizePlayoffDivision(label), expected);
});
test("unknown division cannot match", () => {
  assert.equal(normalizePlayoffDivision(undefined), null);
  assert.equal(normalizePlayoffDivision("unknown"), null);
});

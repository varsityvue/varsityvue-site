import assert from "node:assert/strict";
import test from "node:test";
import { statewideDivisions, statewideCoverage, stateSemifinalRegionPairs, validateRegionalField } from "./statewide-playoff-brackets";

test("six UIL divisions each reserve four regions without invented games", () => {
  assert.equal(statewideDivisions.length, 6);
  assert.ok(statewideDivisions.every((division) => division.regions.length === 4));
  assert.deepEqual(statewideCoverage().map((row) => row.verifiedRegions), [4, 4, 4, 4, 3, 0]);
});
test("verified regional fields contain exactly sixteen unique teams", () => {
  for (const division of statewideDivisions) {
    for (const field of division.regions) {
      if (field) assert.deepEqual(validateRegionalField(field), []);
    }
  }
  assert.ok(validateRegionalField([["A","B"],["A","C"]]).length > 0);
  assert.deepEqual(validateRegionalField(null), ["regional field not verified"]);
});
test("state semifinals pair Region I with II and Region III with IV", () => {
  assert.deepEqual(stateSemifinalRegionPairs, [[0,1],[2,3]]);
});

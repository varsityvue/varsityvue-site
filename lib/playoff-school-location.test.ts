import assert from "node:assert/strict";
import test from "node:test";
import { findSchoolBracketLocation } from "./playoff-school-location";

test("featured school selection resolves to the same statewide field as the explorer", () => {
  for (const school of ["De Leon", "Cisco", "Stephenville", "Goldthwaite", "Santo", "Albany", "Anson", "Hawley"]) {
    const location = findSchoolBracketLocation(school);
    assert.ok(location, school);
    assert.ok(location.field[location.firstIndex].includes(school), school);
  }
  assert.equal(findSchoolBracketLocation("Unknown School"), null);
});

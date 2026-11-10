import assert from "node:assert/strict";
import test from "node:test";
import { bracketSlotMatchesSchool, getBracketSchoolSlots } from "./playoff-publishing-school-search";

test("all 96 area slots retain four original bi-district entrants", () => {
  const slots = getBracketSchoolSlots();
  assert.equal(slots.length, 96);
  assert.ok(slots.every((slot) => slot.schools.length === 4));
});

test("school search works before verified first-round winners exist", () => {
  const slots = getBracketSchoolSlots();
  const anson = slots.filter((slot) => bracketSlotMatchesSchool(slot.region, slot.slot, " anson ", slots));
  assert.equal(anson.length, 1);
  assert.ok(anson[0].schools.includes("Anson"));
  assert.equal(bracketSlotMatchesSchool(anson[0].region, anson[0].slot, "ANSON", slots), true);
  assert.equal(bracketSlotMatchesSchool(anson[0].region, anson[0].slot, "not-a-school", slots), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { LIVE_PERIODS, normalizeLivePeriod, liveGameContext, livePeriodClock } from "./live-period";

test("halftime is selectable and normalizes typed casing", () => {
  assert.ok(LIVE_PERIODS.includes("Halftime"));
  for (const value of ["Halftime", "halftime", " HALFTIME "]) assert.equal(normalizeLivePeriod(value), "Halftime");
  assert.equal(normalizeLivePeriod("half"), null);
});
test("halftime hides a stale clock; quarters and overtime retain their clock", () => {
  assert.equal(livePeriodClock("Halftime", "04:00"), null);
  assert.equal(liveGameContext("Halftime", "04:00"), "Halftime");
  assert.equal(liveGameContext("3rd", "12:00"), "3rd · 12:00");
  assert.equal(liveGameContext("OT20", null), "OT20");
});

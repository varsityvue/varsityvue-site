import assert from "node:assert/strict";
import test from "node:test";
import { centralContestDeadline } from "./pickem-contest-display";

test("frozen UTC instants display their exact Central clock time across DST", () => {
  assert.match(centralContestDeadline("2026-10-02T22:00:00Z"), /Friday, October 2, 2026 at 5:00 PM CDT/);
  assert.match(centralContestDeadline("2026-11-06T23:00:00Z"), /Friday, November 6, 2026 at 5:00 PM CST/);
});

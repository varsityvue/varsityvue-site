import assert from "node:assert/strict";
import test from "node:test";

import { sumVerifiedStats } from "@/lib/stat-values";

test("sumVerifiedStats preserves exact totals when every component is known", () => {
  assert.deepEqual(sumVerifiedStats([15, 4, 0]), { value: 19, complete: true });
});

test("sumVerifiedStats returns a verified lower bound when a component is unknown", () => {
  assert.deepEqual(sumVerifiedStats([23, undefined, undefined]), { value: 23, complete: false });
});

test("sumVerifiedStats does not invent a total when every component is unknown", () => {
  assert.deepEqual(sumVerifiedStats([undefined, undefined, undefined]), { value: undefined, complete: false });
});

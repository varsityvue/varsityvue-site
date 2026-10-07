import assert from "node:assert/strict";
import test from "node:test";
import { finalizePickemWithCutoffResolution } from "./pickem-finalization";

const cutoff = "2026-10-13T00:00:00-05:00";
const cutoffMs = Date.parse(cutoff);

for (const [name, nowMs, expected] of [
  ["Monday 11:59:59.999 CDT remains in the result window", cutoffMs - 1, ["finalize"]],
  ["exact Tuesday midnight resolves missing results first", cutoffMs, ["resolve", "finalize"]],
  ["after the cutoff resolves missing results first", cutoffMs + 1, ["resolve", "finalize"]],
] as const) {
  test(name, async () => {
    const calls: string[] = [];
    const result = await finalizePickemWithCutoffResolution({
      outcomeResolutionAt: cutoff, nowMs,
      resolve: async () => { calls.push("resolve"); return { error: null }; },
      finalize: async () => { calls.push("finalize"); return { error: null }; },
    });
    assert.equal(result.error, null);
    assert.deepEqual(calls, expected);
  });
}

test("resolution failure prevents finalization and preserves its error", async () => {
  const error = { message: "Administrator access required" };
  let finalized = false;
  const result = await finalizePickemWithCutoffResolution({
    outcomeResolutionAt: cutoff, nowMs: cutoffMs,
    resolve: async () => ({ error }),
    finalize: async () => { finalized = true; return { error: null }; },
  });
  assert.equal(result.error, error);
  assert.equal(finalized, false);
});

test("finalization retains database rejection after successful resolution", async () => {
  const error = { message: "No valid contest entrant" };
  const result = await finalizePickemWithCutoffResolution({
    outcomeResolutionAt: cutoff, nowMs: cutoffMs,
    resolve: async () => ({ error: null }),
    finalize: async () => ({ error }),
  });
  assert.equal(result.error, error);
});

test("missing or malformed cutoff fails closed without calling either RPC", async () => {
  for (const value of [null, "bad-date"]) {
    const unexpected = async () => { assert.fail("RPC called with invalid cutoff"); };
    const result = await finalizePickemWithCutoffResolution({
      outcomeResolutionAt: value, nowMs: cutoffMs, resolve: unexpected, finalize: unexpected,
    });
    assert.ok(result.error);
  }
});

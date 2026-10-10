import assert from "node:assert/strict";
import test from "node:test";
import { isScoreConflict } from "./score-conflict";
import { createClient } from "@supabase/supabase-js";

test("recognizes HTTP conflict, transitional hotfix, and legacy failures", () => {
  assert.equal(isScoreConflict({ code: "PT409" }), true);
  assert.equal(isScoreConflict({ code: "40001" }), true);
  assert.equal(isScoreConflict({ code: "P0001", message: "Game changed — review the current score." }), true);
});

test("score RPC conflict reaches the caller after one HTTP execution", async () => {
  let executions = 0;
  const client = createClient("https://example.supabase.co", "test-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => {
      executions++;
      return new Response(JSON.stringify({ code: "PT409", message: "Game changed — review the current score." }), {
        status: 409, headers: { "content-type": "application/json" },
      });
    } },
  });
  const { error } = await client.rpc("submit_trusted_score_update", {}).retry(false);
  assert.equal(executions, 1);
  assert.equal(isScoreConflict(error!), true);
});
test("terminal-state and unrelated application errors are not stale-score conflicts", () => {
  assert.equal(isScoreConflict({ code: "P0001", message: "Approval blocked: this game already has a verified terminal state." }), false);
  assert.equal(isScoreConflict({ code: "42501" }), false);
  assert.equal(isScoreConflict({ message: "Game changed — review the current score." }), false);
});

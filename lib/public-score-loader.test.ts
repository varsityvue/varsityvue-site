import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPublicScoreStatesResult } from "@/lib/public-score-loader";

function client(primary: { data: unknown; error: unknown }, fallback: { data: unknown; error: unknown }) {
  return {
    rpc: async () => primary,
    from: () => ({
      select: () => ({
        eq: async () => fallback,
      }),
    }),
  } as unknown as SupabaseClient;
}

const row = {
  game_id: "a-at-b-2026-week-6",
  status: "live",
  home_score: 0,
  away_score: 0,
  period: "1Q",
  clock: "12:00",
  verified: true,
  kickoff_override: null,
  result_type: null,
  official_winner_school_slug: null,
  attribution_type: "publisher",
  attribution_username: "scorekeeper",
};

test("primary public score contract reports primary success", async () => {
  const result = await loadPublicScoreStatesResult(client({ data: [row], error: null }, { data: [], error: null }));
  assert.equal(result.status, "primary");
  assert.equal(result.states.length, 1);
  assert.equal(result.states[0].home_score, 0);
});

test("verified fallback remains distinguishable from primary success", async () => {
  const result = await loadPublicScoreStatesResult(client({ data: null, error: { message: "rpc unavailable" } }, { data: [row], error: null }));
  assert.equal(result.status, "fallback");
  assert.equal(result.states.length, 1);
  assert.equal(result.states[0].attribution_type, "none");
});

test("failure of both public score reads is explicit", async () => {
  const result = await loadPublicScoreStatesResult(client(
    { data: null, error: { message: "rpc unavailable" } },
    { data: null, error: { message: "fallback unavailable" } },
  ));
  assert.equal(result.status, "failed");
  assert.deepEqual(result.states, []);
});

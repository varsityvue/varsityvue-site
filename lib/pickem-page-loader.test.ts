import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { publicReadFetch } from "./public-read";
import { createPickemReadScope, loadPickemCore, loadPickemWeek, loadPickemHistory } from "./pickem-page-loader";
import { savedIntentMatches, isUncertainWriteError } from "./pickem-write-recovery";

test("real HTTP core groups overlap, exclude history, bound concurrency and stop on a required failure", async () => {
  let active = 0, peak = 0, failure = "", calls: string[] = [];
  const week = { id: "week", season: 2026, week: 8, status: "open", title: "Week 8",
    tiebreaker_game_id: "card", closes_at: "2026-10-17T00:00:00Z", entry_deadline_at: "2026-10-17T00:00:00Z", presenting_sponsor_name: "Sponsor" };
  const server = createServer((req, res) => {
    const url = new URL(req.url!, "http://localhost"), path = url.pathname.split("/").at(-1)!;
    calls.push(path); active++; peak = Math.max(peak, active);
    setTimeout(() => {
      active--;
      if (path === failure) { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ code: "PGRST003", message: "private" })); return; }
      const data = path === "pickem_weeks" ? week : path === "pickem_game_cards" ? [
        { id: "card", game_id: "game", lock_at: "2026-10-17T00:00:00Z", away_school_slug: "a", home_school_slug: "b", is_locked: false },
      ] : path === "pickem_contest_entries" ? null : path === "pickem_week_tiebreakers" ? null :
        path === "get_pickem_contest_draft_prediction" ? 0 : path === "own_pickem_season_summary" ? null : [];
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(data));
    }, 35);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const client = createClient(`http://127.0.0.1:${(server.address() as { port: number }).port}`, "synthetic", {
    auth: { persistSession: false }, global: { fetch: publicReadFetch() },
  });
  try {
    const scope = createPickemReadScope(client);
    const loadedWeek = await loadPickemWeek(scope); assert.deepEqual(loadedWeek, week);
    const core = await loadPickemCore(scope, loadedWeek!, "owner");
    assert.equal(core.memberEntry, null); assert.equal(core.draftPrediction, 0);
    assert.ok(peak >= 2 && peak <= 4);
    assert.ok(!calls.includes("own_pickem_season_summary"));
    await loadPickemHistory(scope, "owner", 2026);
    assert.ok(calls.includes("own_pickem_season_summary"));
    calls = []; failure = "pickem_contest_entries";
    await assert.rejects(loadPickemCore(scope, week, "owner"), /temporarily unavailable/);
    assert.equal(calls.filter(path => path === failure).length, 1, "no transient read retry");
    assert.ok(!calls.includes("get_pickem_contest_draft"), "failed entry lookup cannot become missing entry");
    failure = "pickem_game_cards"; calls = [];
    await assert.rejects(loadPickemCore(scope, week), /temporarily unavailable/);
    assert.equal(calls.filter(path => path === failure).length, 1);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("shared read scope enforces concurrency across optional and required requests", async () => {
  let active = 0, peak = 0;
  const client = createClient("http://127.0.0.1:1", "synthetic", { auth: { persistSession: false } });
  const scope = createPickemReadScope(client, 2);
  const query = () => ({ retry: () => ({
    then: (resolve: (value: { data: number; error: null }) => void) => {
      active++; peak = Math.max(peak, active);
      setTimeout(() => { active--; resolve({ data: 1, error: null }); }, 10);
    },
  }) }) as unknown as Parameters<typeof scope.read>[0];
  await Promise.all(Array.from({ length: 15 }, () => scope.read(query())));
  assert.equal(peak, 2);
});

test("uncertain responses never confirm unsaved/mismatched entry, zero prediction is respected", () => {
  const intent = { weekId: "w", kind: "entry" as const, selections: { g: "a" }, prediction: 0 };
  const saved = { selections: { g: "a" }, prediction: 0, entryExists: true, contest: true };
  assert.equal(savedIntentMatches(intent, saved), true);
  assert.equal(savedIntentMatches(intent, { ...saved, entryExists: false }), false);
  assert.equal(savedIntentMatches(intent, { ...saved, prediction: 1 }), false);
  assert.equal(savedIntentMatches(intent, { ...saved, selections: { g: "b" } }), false);
  assert.equal(savedIntentMatches({ ...intent, selections: {}, prediction: null }, saved), false);
  assert.equal(savedIntentMatches({ ...intent, kind: "draft", prediction: null }, saved), false);
  assert.equal(savedIntentMatches({ ...intent, kind: "draft", prediction: null }, { ...saved, prediction: null }), true);
  assert.equal(isUncertainWriteError({ code: "" }, 0), true);
  assert.equal(isUncertainWriteError({ code: "PGRST003" }, 504), true);
  assert.equal(isUncertainWriteError({ code: "PT409" }, 409), false);
});

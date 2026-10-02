import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import ScoreAttribution from "../components/ScoreAttribution";
import { getScoreAttribution, projectPublicScoreState, scoreAttributionText, type PublicScoreState } from "./public-score-state";
import { loadPublicScoreStates } from "./public-score-loader";
import type { SupabaseClient } from "@supabase/supabase-js";

const state: PublicScoreState = { game_id: "test-game", status: "live", home_score: 0,
  away_score: 7, period: "1st", clock: "08:00", verified: true, kickoff_override: null,
  result_type: null, official_winner_school_slug: null,
  attribution_type: "publisher", attribution_username: "zachbowles" };
const game = { status: state.status, scoreAttribution: getScoreAttribution(state) };

test("LIVE public publisher and fallback copy; unsafe usernames never become handles", () => {
  assert.match(renderToStaticMarkup(<ScoreAttribution game={game} />), /Updated by @zachbowles/);
  for (const username of [null, "a@example.com", "official", "<script>", "x".repeat(31)]) {
    const attribution = getScoreAttribution({ ...state, attribution_username: username });
    assert.equal(scoreAttributionText({ ...game, scoreAttribution: attribution }), "Updated by VarsityVue contributor");
  }
  assert.equal(getScoreAttribution({ ...state, verified: false }), undefined);
  assert.equal(getScoreAttribution({ ...state, home_score: null }), undefined);
  assert.equal(getScoreAttribution({ ...state, attribution_type: "none" }), undefined);
});

test("FINAL compact cards omit all bylines; detail only allows neutral lines", () => {
  for (const type of ["publisher", "correction", "verified", "outcome"] as const) {
    const final = { status: "final" as const, scoreAttribution: { type, username: "zachbowles" } };
    assert.equal(renderToStaticMarkup(<ScoreAttribution game={final} />), "");
    if (type === "publisher") assert.equal(renderToStaticMarkup(<ScoreAttribution game={final} detail />), "");
  }
  assert.equal(scoreAttributionText({ status: "live", scoreAttribution: { type: "correction" } }), "Corrected by VarsityVue");
  assert.equal(scoreAttributionText({ status: "final", scoreAttribution: { type: "outcome" } }, true), "Outcome confirmed by VarsityVue");
  assert.equal(scoreAttributionText({ status: "final", scoreAttribution: { type: "verified" } }, true), "Verified by VarsityVue");
});

test("30 character handle remains complete, readable and wraps without live-region announcements", () => {
  const html = renderToStaticMarkup(<ScoreAttribution game={{ ...game, scoreAttribution: { type: "publisher", username: "a".repeat(30) } }} />);
  assert.match(html, new RegExp(`Updated by @${"a".repeat(30)}`));
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /text-xs font-normal/);
  assert.doesNotMatch(html, /aria-live|truncate|text-ellipsis|<a |role=|uuid/);
});

test("explicit public projection strips all private payload fields", () => {
  const projected = projectPublicScoreState({ ...state, updated_by: "private-id", source_submission_id: "private-source",
    email: "private@example.invalid", phone: "2545550100", role: "admin", review_note: "secret" } as PublicScoreState);
  assert.deepEqual(Object.keys(projected).sort(), Object.keys(state).sort());
  assert.doesNotMatch(JSON.stringify(projected), /private|email|phone|review_note|updated_by|source_submission_id/);
});

test("loader keeps score and attribution in one RPC; unavailable RPC preserves score without a byline", async () => {
  let reads = 0;
  const client = { rpc: async () => ({ data: [state], error: null }), from: () => { reads++; throw Error("Separate score read"); } };
  assert.deepEqual(await loadPublicScoreStates(client as unknown as SupabaseClient), [state]);
  assert.equal(reads, 0);
  const fallback = { rpc: async () => ({ data: null, error: { code: "PGRST202" } }), from: () => ({ select: () => ({ eq: async () => ({ data: [state] }) }) }) };
  const [row] = await loadPublicScoreStates(fallback as unknown as SupabaseClient);
  assert.equal(row.away_score, 7);
  assert.equal(getScoreAttribution(row), undefined);
});

test("only approved full surfaces mount attribution; excluded compact surfaces stay unchanged", () => {
  const scoreboard = readFileSync("app/scoreboard/page.tsx", "utf8");
  assert.equal((scoreboard.match(/<ScoreAttribution game={game}/g) ?? []).length, 2);
  const center = readFileSync("app/games/[gameId]/page.tsx", "utf8");
  assert.equal((center.match(/<ScoreAttribution game={game} detail/g) ?? []).length, 2);
  const pulse = readFileSync("components/SchoolSeasonPulse.tsx", "utf8");
  assert.equal((pulse.match(/<ScoreAttribution game={featuredGame}/g) ?? []).length, 1);
  for (const path of ["app/page.tsx", "components/ScoreStrip.tsx", "components/YourTeams.tsx"]) {
    try { assert.doesNotMatch(readFileSync(path, "utf8"), /ScoreAttribution|Updated by @/); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
});

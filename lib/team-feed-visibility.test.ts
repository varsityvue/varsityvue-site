import assert from "node:assert/strict";
import test from "node:test";
import { parseFeedVisibility, teamFeedSchoolFilter } from "./team-feed-visibility";

test("visibility requires an explicit valid choice; association is independent", () => {
  assert.equal(parseFeedVisibility("primary"), false);
  assert.equal(parseFeedVisibility("both"), true);
  for (const invalid of ["", "true", "winner", "PRIMARY"]) assert.equal(parseFeedVisibility(invalid), null);
});

test("school filter restricts only secondary placement and rejects filter injection", () => {
  assert.equal(teamFeedSchoolFilter("de-leon"), "primary_school_id.eq.de-leon,and(secondary_school_id.eq.de-leon,show_on_secondary_school.eq.true)");
  assert.throws(() => teamFeedSchoolFilter("de-leon,status.eq.draft"));
});

test("PostgREST keeps visibility and cursor filters as independent AND groups", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  let requested: URL | undefined;
  const client = createClient("https://example.invalid", "fixture-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      requested = new URL(String(input));
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    } },
  });
  const cursor = "published_at.lt.2026-10-17T00:00:00Z,and(published_at.eq.2026-10-17T00:00:00Z,id.lt.00000000-0000-4000-8000-000000000010)";
  const { error } = await client.from("team_feed_posts").select("id")
    .eq("status", "published").or(teamFeedSchoolFilter("hico"))
    .order("published_at", { ascending: false }).order("id", { ascending: false }).limit(9)
    .or(cursor);
  assert.equal(error, null);
  assert.deepEqual(requested?.searchParams.getAll("or"), [`(${teamFeedSchoolFilter("hico")})`, `(${cursor})`]);
  assert.equal(requested?.searchParams.get("limit"), "9");
});

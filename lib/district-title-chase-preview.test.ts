import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { districtChampionshipChaseWeek9_2026 as draft } from "../data/district-championship-chase-week9-2026";
import { getArticleBySlug, getArticles, getArticlesForDistrict, getArticlesForSchool, getEditorialPreviewBySlug } from "./articles";

test("district chase draft remains excluded from every public article collection", () => {
  assert.equal(draft.humanReviewed, false);
  assert.equal(getArticleBySlug(draft.slug), undefined);
  assert.ok(!getArticles().some((article) => article.slug === draft.slug));
  for (const school of draft.schoolIds ?? []) assert.ok(!getArticlesForSchool(school).includes(draft));
  for (const district of draft.districtIds ?? []) assert.ok(!getArticlesForDistrict(district).includes(draft));
});

test("direct review route is available only in the Preview environment", () => {
  const original = process.env.VERCEL_ENV;
  try {
    for (const environment of [undefined, "production", "development"]) {
      if (environment === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = environment;
      assert.equal(getEditorialPreviewBySlug(draft.slug), undefined);
    }
    process.env.VERCEL_ENV = "preview";
    assert.equal(getEditorialPreviewBySlug(draft.slug), draft);
    assert.equal(getEditorialPreviewBySlug("unknown"), undefined);
  } finally {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
  }
});

test("rendered article wording preserves the complete owner-approved source", () => {
  const source = readFileSync("docs/editorial-drafts/district-championship-chase-week-9-2026.md", "utf8").trim();
  assert.equal(`# ${draft.title}\n\n${draft.subtitle}\n\n${draft.body}`, source);
  assert.equal(draft.body.match(/^## /gm)?.length, 6);
  assert.ok(draft.body.endsWith("The next two Fridays will determine who enters the postseason as district champions and who will have to settle for chasing a title in November."));
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { stephenvilleJarrellWeek9Gotw2026 as draft } from "../data/stephenville-jarrell-week9-gotw-2026";
import { getArticleBySlug, getArticles, getArticlesForSchool, getEditorialPreviewBySlug, getPublishedGamePreview } from "./articles";

test("Week 9 draft preserves the approved narrative and fails closed outside preview", () => {
  const approved = readFileSync("docs/editorial-drafts/week9-stephenville-at-jarrell-2026.md", "utf8")
    .split("\n---\n\n")[1].split("\n\n").slice(1).join("\n\n").trim();
  assert.equal(draft.body, approved);
  const original = process.env.VERCEL_ENV;
  try {
    for (const environment of ["production", "development", ""]) {
      process.env.VERCEL_ENV = environment;
      assert.equal(getEditorialPreviewBySlug(draft.slug), undefined);
    }
    process.env.VERCEL_ENV = "preview";
    assert.equal(getEditorialPreviewBySlug(draft.slug), draft);
    assert.equal(getEditorialPreviewBySlug("unknown"), undefined);
    assert.equal(getArticleBySlug(draft.slug), undefined);
    assert.equal(getPublishedGamePreview(draft.gameId!), undefined);
    assert.ok(!getArticles().some((article) => article.slug === draft.slug));
    for (const school of draft.schoolIds!) {
      assert.ok(!getArticlesForSchool(school).some((article) => article.slug === draft.slug));
    }
  } finally {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
  }
});

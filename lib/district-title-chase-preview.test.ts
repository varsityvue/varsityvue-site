import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { districtChampionshipChaseWeek9_2026 as article } from "../data/district-championship-chase-week9-2026";
import { getArticleBySlug, getArticles } from "./articles";
test("published district chase preserves approved copy and resolves publicly", () => {
 assert.equal(article.humanReviewed, true);
 assert.equal(getArticleBySlug(article.slug), article);
 assert.ok(getArticles().includes(article));
 assert.equal(`# ${article.title}\n\n${article.subtitle}\n\n${article.body}`, readFileSync("docs/editorial-drafts/district-championship-chase-week-9-2026.md", "utf8").trim());
});

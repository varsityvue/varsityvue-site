import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { stephenvilleJarrellWeek9Gotw2026 as article } from "../data/stephenville-jarrell-week9-gotw-2026";
import { getArticleBySlug, getArticles, getArticlesForSchool, getPublishedGamePreview } from "./articles";

test("published Week 9 article preserves approved narrative and resolves all associations", () => {
 const approved = readFileSync("docs/editorial-drafts/week9-stephenville-at-jarrell-2026.md", "utf8").split("\n---\n\n")[1].split("\n\n").slice(1).join("\n\n").trim();
 assert.equal(article.body, approved);
 assert.equal(getArticleBySlug(article.slug), article);
 assert.equal(getArticles()[0], article);
 assert.equal(getPublishedGamePreview("stephenville-at-jarrell-2026-week-9"), article);
 for (const school of ["stephenville", "jarrell"]) assert.ok(getArticlesForSchool(school).includes(article));
 assert.ok(!article.title.includes("Game of the Week"));
 assert.ok(article.body.includes("## Through the Air"));
});

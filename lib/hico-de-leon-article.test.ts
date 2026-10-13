import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hicoDeLeonWeek8Gotw2026 as draft } from "@/data/hico-de-leon-week8-gotw-2026";
import { albanyStamfordWeek7Gotw2026 as previous } from "@/data/albany-stamford-week7-gotw-2026";
import { getArticles, getArticleBySlug, getLatestArticles, getArticlesForSchool, getArticlesForDistrict, getPublishedGamePreview } from "@/lib/articles";
import { getGames } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";

test("Week 8 draft stays absent from every public article selector", () => {
  assert.equal(draft.humanReviewed, false);
  assert.equal(draft.publishedAt, "");
  assert.equal(getArticleBySlug(draft.slug), undefined);
  assert.equal(getPublishedGamePreview(draft.gameId!), undefined);
  for (const list of [getArticles(), getLatestArticles(100), ...draft.schoolIds!.map(getArticlesForSchool), ...draft.districtIds!.map(getArticlesForDistrict)]) assert.ok(list.every(a => a.id !== draft.id));
  assert.equal(getArticleBySlug(previous.slug)?.id, previous.id);
});

test("Week 8 article targets canonical schools, district and Friday matchup", () => {
  for (const slug of draft.schoolIds!) assert.ok(getSchoolBySlug(slug));
  assert.ok(getDistrictById(draft.districtIds![0]));
  const game = getGames().find(g => g.id === draft.gameId)!;
  assert.ok(game);
  assert.equal(game.awaySchoolSlug, "hico");
  assert.equal(game.homeSchoolSlug, "de-leon");
  assert.equal(game.week, 8);
  assert.equal(game.season, 2026);
  assert.match(game.kickoff!, /^2026-10-16T/);
  assert.equal(draft.slug, "hico-at-de-leon-week-8-2026");
  assert.ok(draft.seo.title && draft.seo.description && draft.subtitle && draft.author);
  assert.match(draft.body, /De Leon's path to 5-1/);
  assert.match(draft.body, /before opening district play/);
  assert.match(draft.body, /51-21 victory.*Early/);
});

test("original composite PNG and credited featured/social paths are intact", () => {
  assert.equal(draft.featuredImageUrl, "/images/coverage/hico-de-leon-week-8-2026.png");
  assert.equal(draft.featuredImageSocialUrl, draft.featuredImageUrl);
  assert.equal(draft.featuredImageCaption, "Photos: Dixie Watson (Hico) / Tedra Zmeskal (De Leon)");
  assert.match(draft.featuredImageAlt!, /Hico Tigers and De Leon Bearcats/);
  const image = readFileSync(`public${draft.featuredImageUrl}`);
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(image.readUInt32BE(16), 1600);
  assert.equal(image.readUInt32BE(20), 900);
  assert.equal(createHash("sha256").update(image).digest("hex"), "2eb22362af6d208b394e40d373f2c6c7a255074e5f680b9feed056605074c022");
});

import assert from "node:assert/strict";
import test from "node:test";
import { getPublishedGamePreview } from "@/lib/articles";
import { hicoDeLeonWeek8Gotw2026 } from "@/data/hico-de-leon-week8-gotw-2026";

test("Game Centers select the matching published Week 8 and Week 7 previews", () => {
  assert.equal(getPublishedGamePreview("hico-at-de-leon-2026-week-8")?.slug,
    "hico-at-de-leon-week-8-2026");
  assert.equal(getPublishedGamePreview("albany-at-stamford-2026-week-7")?.slug,
    "albany-stamford-century-old-rivalry-week-7-2026");
});

test("unmatched games and games with only recaps or features have no preview", () => {
  for (const id of ["unknown-game", "de-leon-at-stamford-2026-week-2", "de-leon-at-goldthwaite-2026-week-4"])
    assert.equal(getPublishedGamePreview(id), undefined);
});

test("an unreviewed preview cannot be exposed by the selector", () => {
  const reviewed = hicoDeLeonWeek8Gotw2026.humanReviewed;
  try {
    hicoDeLeonWeek8Gotw2026.humanReviewed = false;
    assert.equal(getPublishedGamePreview(hicoDeLeonWeek8Gotw2026.gameId!), undefined);
  } finally {
    hicoDeLeonWeek8Gotw2026.humanReviewed = reviewed;
  }
});

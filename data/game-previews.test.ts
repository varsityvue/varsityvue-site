import assert from "node:assert/strict";
import test from "node:test";

import { gamePreviews, getGamePreview } from "@/data/game-previews";
import { getArticleBySlug } from "@/lib/articles";

test("Jacksboro at Cisco has a concise preview linked to the published article", () => {
  const preview = getGamePreview("jacksboro-at-cisco-2026-week-5");
  assert.ok(preview);
  assert.match(preview.excerpt, /No\. 4 Jacksboro.*Cisco \(2–2\)/);
  assert.deepEqual(preview.paragraphs, []);
  assert.equal(preview.excerpt, gamePreviews.find((entry) => entry.gameId === preview.gameId)?.excerpt);
  assert.equal(preview.coverageLabel, "Read Game Preview →");
  assert.equal(
    getArticleBySlug(preview.coverageHref!.split("/").at(-1)!)?.gameId,
    preview.gameId,
  );
});

test("existing coverage and games without articles retain their behavior", () => {
  assert.equal(
    getGamePreview("de-leon-at-goldthwaite-2026-week-4")?.coverageHref,
    "/coverage/de-leon-goldthwaite-week-4-seven-meets-47",
  );
  assert.equal(getGamePreview("tolar-at-comanche-2026-week-5"), undefined);
});

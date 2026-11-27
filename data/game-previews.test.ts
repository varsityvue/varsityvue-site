import assert from "node:assert/strict";
import test from "node:test";

import { gamePreviews, getGamePreview, getVisibleGamePreview } from "@/data/game-previews";
import { getGameById } from "@/lib/games";
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

test("Mason–De Leon shows the corrected preview before kickoff and yields to game status afterward", () => {
  const game = getGameById("2026-regional-semifinal-2a-d1-ii-2");
  assert.ok(game);
  const pregame = new Date("2026-11-27T18:59:00-06:00");
  const preview = getVisibleGamePreview(game, pregame);
  assert.ok(preview);
  assert.match(preview.excerpt, /Bryce Burkeen gained 88 yards and scored twice on just five carries/);
  assert.equal(getVisibleGamePreview(game, new Date("2026-11-27T19:00:00-06:00")), undefined);
  for (const status of ["live", "final", "postponed", "cancelled"] as const) {
    assert.equal(getVisibleGamePreview({ ...game, status, publicScoreVerified: true }, pregame), undefined);
  }
});

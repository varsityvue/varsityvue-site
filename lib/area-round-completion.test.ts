import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import baseline from "../docs/area-round-completion-20261116/baseline.json";
import before from "../docs/area-round-completion-20261116/before.json";
import { getGames, getGamesForSchool } from "./games";
import { getAreaRoundReadiness } from "./area-round-readiness";
import { buildBracketLayout } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
const games = getGames().filter(g => g.gameType === "playoff");
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const changed = new Set(before.map(g => g.id));
const withoutVenue = (game: Record<string, unknown>) => Object.fromEntries(Object.entries(game).filter(([key]) => !["venue", "sourceLabel"].includes(key)));

test("Area completion preserves every first-round final and every unrelated playoff record", () => {
  const first = games.filter(g => g.playoff?.round === "Bi-District");
  assert.equal(first.length, 192);
  assert.ok(first.every(g => verifiedWinner(g)));
  assert.equal(hash(first), baseline.firstRoundHash);
  assert.equal(hash(games.filter(g => !changed.has(g.id))), baseline.unchangedPlayoffHash);
  assert.equal(new Set(games.map(g => g.id)).size, 288);
  for (const old of before) {
    const current = games.find(g => g.id === old.id)!;
    assert.deepEqual(withoutVenue({...current}), withoutVenue({...old}));
    assert.ok(current.sourceLabel?.includes("https://"));
  }
});

test("all 96 Area matchups remain unscored and connected to both school schedules", () => {
  const area = games.filter(g => g.playoff?.round === "Area");
  assert.equal(area.length, 96);
  for (const game of area) {
    assert.equal(game.homeScore, undefined, game.id);
    assert.equal(game.awayScore, undefined, game.id);
    assert.notEqual(game.publicScoreVerified, true, game.id);
    assert.equal(game.designatedSidesConfirmed, false, game.id);
    for (const slug of [game.homeSchoolSlug, game.awaySchoolSlug]) {
      assert.ok(slug, game.id);
      assert.equal(getGamesForSchool(slug!).filter(g => g.id === game.id).length, 1, game.id);
    }
  }
  const queue = getAreaRoundReadiness(games);
  assert.equal(queue.filter(x => x.status === "scheduled").length, 95);
  assert.deepEqual(queue.filter(x => x.status !== "scheduled").map(x => x.gameId), ["2026-area-2a-d2-iv-4"]);
  for (const division of ["2A-D1", "2A-D2", "3A-D1", "3A-D2", "4A-D1", "4A-D2"]) {
    const {nodes} = buildBracketLayout(division, games);
    assert.equal(nodes.filter(n => n.round === 1 && n.game).length, 16);
    assert.ok(nodes.filter(n => n.round > 1).every(n => n.teams.every(t => t === null)));
  }
});

test("venue refinements identify the actual cities without inferring new kickoff details", () => {
  const expected = new Map([
    ["2026-area-2a-d1-i-2", "J. M. King Memorial Stadium, Midland, TX"],
    ["2026-area-2a-d1-iii-2", "Pine Tree Pirate Stadium, Longview, TX"],
    ["2026-area-3a-d1-iii-4", "Mustang Stadium (Magnolia West HS), Magnolia, TX"],
  ]);
  for (const [id, venue] of expected) assert.equal(games.find(g => g.id === id)?.venue, venue);
  const pending = games.find(g => g.id === "2026-area-2a-d2-iv-4")!;
  assert.equal(pending.kickoff, undefined);
  assert.equal(pending.venue, undefined);
});

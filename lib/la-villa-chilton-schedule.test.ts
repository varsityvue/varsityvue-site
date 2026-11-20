import type { Game } from "../types/platform";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import orientationBefore from "../docs/de-leon-axtell-orientation-20261117/before.json";
import before from "../docs/la-villa-chilton-schedule-20261116/before.json";
import baseline from "../docs/la-villa-chilton-schedule-20261116/baseline.json";
import { getGames, getGamesForSchool } from "./games";
import { getAreaRoundReadiness } from "./area-round-readiness";
import { buildBracketLayout } from "./playoff-bracket-layout";
// Evaluate the full preservation snapshot at its original release date.
const games = getGames(new Date("2026-11-16T08:30:43-06:00"));
const historicalGames = games.map(g => g.id === orientationBefore.id ? orientationBefore as Game : g);
const game = games.find(g => g.id === before.id)!;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const unchanged = (value: object) => Object.fromEntries(Object.entries(value).filter(([key]) => !["kickoff", "venue", "sourceLabel"].includes(key)));

test("La Villa–Chilton adds only the corroborated kickoff, stadium/city and accurate attribution", () => {
  assert.equal(game.kickoff, "2026-11-20T19:00:00-06:00");
  assert.equal(game.venue, "Bulldog Stadium, Somerset, TX");
  assert.deepEqual(unchanged(game), unchanged(before));
  assert.equal(game.homeSchoolSlug, "la-villa");
  assert.equal(game.awaySchoolSlug, "chilton");
  assert.equal(game.isNeutralSite, null);
  assert.equal(game.designatedSidesConfirmed, false);
  assert.match(game.sourceLabel!, /Dave Campbell/);
  assert.match(game.sourceLabel!, /South Texas Gridiron Grooves \(owner-provided screenshot\)/);
  assert.match(game.sourceLabel!, /not official school confirmation/);
  assert.match(game.sourceLabel!, /https:\/\/www\.davecampbells\.com\//);
});

test("all other records, 192 verified finals and 96 Area identities are unchanged", () => {
  const first = games.filter(g => g.playoff?.round === "Bi-District");
  assert.equal(first.length, 192);
  assert.equal(hash(first), baseline.firstRoundHash);
  assert.equal(hash(historicalGames.filter(g => g.id !== game.id)), baseline.unrelatedGamesHash);
  const area = games.filter(g => g.playoff?.round === "Area");
  assert.equal(area.length, 96);
  assert.equal(hash(historicalGames.filter(g => g.playoff?.round === "Area").map(({id,season,week,gameType,playoff,homeSchoolSlug,awaySchoolSlug,isNeutralSite,designatedSidesConfirmed,status,homeScore,awayScore,publicScoreVerified})=>({id,season,week,gameType,playoff,homeSchoolSlug,awaySchoolSlug,isNeutralSite,designatedSidesConfirmed,status,homeScore,awayScore,publicScoreVerified}))),baseline.areaIdentityHash);
  assert.ok(area.every(g => g.homeScore === undefined && g.awayScore === undefined && !g.publicScoreVerified));
  assert.ok(getAreaRoundReadiness(games).every(row => row.status === "scheduled"));
});

test("both schedules and Playoff Central share the same unique scheduled Area record", () => {
  for (const slug of ["chilton", "la-villa"]) {
    const matches = getGamesForSchool(slug).filter(g => g.id === game.id);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].kickoff, game.kickoff);
    assert.equal(matches[0].venue, game.venue);
  }
  const node = buildBracketLayout("2A-D2", games).nodes.find(n => n.region === 3 && n.round === 1 && n.index === 3)!;
  assert.equal(node.game?.id, game.id);
  assert.equal(node.game?.kickoff, game.kickoff);
  assert.deepEqual(node.teams, ["La Villa", "Chilton"]);
  const deLeon = games.find(g => g.id === "2026-area-2a-d1-ii-4")!;
  assert.equal(deLeon.kickoff, "2026-11-19T19:00:00-06:00");
  assert.equal(deLeon.venue, "Bob and Norma Cervetto Stadium, Dublin, TX");
});

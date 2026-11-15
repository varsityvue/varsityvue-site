import test from "node:test";
import assert from "node:assert/strict";
import { getGames, getGamesForSchool } from "./games";
import { buildBracketLayout, schoolRoute } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { applyGameState } from "./resolve-game-score-state";
import { resolveBracketSchool } from "./playoff-school-catalog";
import { template2AD22026 } from "../data/playoff-template-2ad2-2026";
import { validateTemplate, seedLabel } from "./playoff-qualification";
import { playoffD2FirstRound, playoffD2Area } from "../data/playoff-d2-completion-20261114";

const games = getGames();
const { nodes } = buildBracketLayout("2A-D2", games);

test("DII has 32 unique first-round Game Centers, 32 confirmed finals", () => {
  const first = nodes.filter(n => n.round === 0);
  assert.equal(first.length, 32);
  assert.equal(new Set(first.map(n => n.game?.id)).size, 32);
  assert.ok(first.every(n => n.game));
  assert.equal(first.filter(n => verifiedWinner(n.game)).length, 32);
  for (const node of first) {
    for (const name of node.teams) {
      const school = resolveBracketSchool(name!, "2A-D2", ["I", "II", "III", "IV"][node.region]);
      assert.ok(school);
      assert.ok(getGamesForSchool(school.slug).some(g => g.id === node.game!.id));
    }
  }
});

test("DII Area participants follow verified topology, including owner-confirmed Chilton", () => {
  const area = nodes.filter(n => n.round === 1);
  assert.equal(area.length, 16);
  assert.equal(area.filter(n => n.game).length, 16);
  assert.deepEqual(area.find(n => n.region === 3 && n.index === 3)?.teams, ["La Villa", "Chilton"]);
  for (const node of area) {
    assert.deepEqual(node.teams, node.sources.map(id => verifiedWinner(nodes.find(n => n.id === id)?.game)));
    assert.equal(verifiedWinner(node.game), null);
  }
  assert.equal(schoolRoute(nodes, "Stamford").size, 6);
  assert.equal(schoolRoute(nodes, "Albany").size, 1);
  assert.equal(nodes.filter(n => n.round > 1).flatMap(n => n.teams).filter(Boolean).length, 0);
});

test("reviewed DII score conflicts and live correction precedence are explicit", () => {
  const expected: Record<string, [number, number]> = {
    "2026-bi-district-2a-d2-i-5": [52, 14],
    "albany-vs-crawford-2026-bi-district": [21, 27],
    "2026-bi-district-2a-d2-ii-6": [62, 12],
    "2026-bi-district-2a-d2-iii-4": [42, 20],
    "2026-bi-district-2a-d2-iii-7": [38, 21],
  };
  for (const [id, score] of Object.entries(expected)) {
    const game = games.find(g => g.id === id)!;
    assert.deepEqual([game.homeScore, game.awayScore], score);
    assert.deepEqual(applyGameState(game), game);
    const corrected = applyGameState(game, { game_id: id, status: "final", verified: true, home_score: score[0] + 1, away_score: score[1], period: null, clock: null, kickoff_override: null, result_type: "played", official_winner_school_slug: null });
    assert.equal(corrected.homeScore, score[0] + 1);
  }
});

test("reviewed DII seeds are complete and cannot become inferred record rankings", () => {
  assert.deepEqual(validateTemplate(template2AD22026), []);
  assert.equal(template2AD22026.slots.length, 64);
  const seeds = (region: number, index: number) => template2AD22026.slots.filter(s => s.region === region && s.firstRoundGame === index).map(seedLabel);
  assert.deepEqual(seeds(0, 0), ["W1", "F2"]);
  assert.deepEqual(seeds(1, 3), ["R7", "T8"]);
  assert.deepEqual(seeds(3, 7), ["R13", "T14"]);
});

test("DII adds no duplicate same-round games and no future scores", () => {
  const all = games.filter(g => g.playoff?.division === "2A Division II");
  const keys = all.map(g => `${g.season}|${g.playoff?.round}|${[g.homeSchoolSlug, g.awaySchoolSlug].sort().join("|")}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(playoffD2FirstRound.length, 32);
  assert.equal(playoffD2Area.length, 16);
  assert.ok(playoffD2Area.every(g => !g.publicScoreVerified && g.homeScore === undefined && g.awayScore === undefined));
});

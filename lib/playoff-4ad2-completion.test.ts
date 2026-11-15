import test from "node:test";
import assert from "node:assert/strict";
import baseline from "../docs/playoff-4ad2-completion-20261115/baseline.json";
import { getGames, getGamesForSchool } from "./games";
import { buildBracketLayout, schoolRoute } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { resolveBracketSchool } from "./playoff-school-catalog";
import { template4AD22026 } from "../data/playoff-template-4ad2-2026";
import { validateTemplate, seedLabel } from "./playoff-qualification";
import { playoff4AD2FirstRound, playoff4AD2Area } from "../data/playoff-4ad2-completion-20261115";

const games = getGames();
const { nodes } = buildBracketLayout("4A-D2", games);

test("4A DII has 64 canonical participants and 32 unique verified first-round finals", () => {
 const first = nodes.filter(n => n.round === 0);
 assert.equal(first.length, 32);
 assert.equal(new Set(first.map(n => n.game?.id)).size, 32);
 assert.equal(first.filter(n => verifiedWinner(n.game)).length, 32);
 const schools = new Set<string>();
 for (const n of first) for (const name of n.teams) {
  const school = resolveBracketSchool(name!, "4A-D2", ["I", "II", "III", "IV"][n.region]);
  assert.ok(school, `${n.region}|${name}`);
  schools.add(school.slug);
  assert.ok(getGamesForSchool(school.slug).some(g => g.id === n.game!.id));
 }
 assert.equal(schools.size, 64);
 assert.equal(resolveBracketSchool("Liberty", "4A-D2", "I")?.slug, "lubbock-cooper-liberty");
 assert.equal(resolveBracketSchool("Bowie", "4A-D2", "I")?.slug, "el-paso-bowie");
});

test("all sixteen Area games match verified source edges and remain unscored", () => {
 const area = nodes.filter(n => n.round === 1);
 assert.equal(area.filter(n => n.game).length, 16);
 for (const n of area) {
  assert.deepEqual(n.teams, n.sources.map(id => verifiedWinner(nodes.find(x => x.id === id)?.game)));
  assert.equal(verifiedWinner(n.game), null);
  for (const slug of [n.game!.homeSchoolSlug, n.game!.awaySchoolSlug])
   assert.ok(getGamesForSchool(slug!).some(g => g.id === n.game!.id));
 }
 assert.equal(schoolRoute(nodes, "Glen Rose").size, 6);
 assert.equal(schoolRoute(nodes, "Ponder").size, 1);
 assert.ok(nodes.filter(n => n.round > 1).every(n => n.teams.every(t => t === null)));
 assert.ok(playoff4AD2Area.every(g => !g.publicScoreVerified && g.homeScore === undefined && g.awayScore === undefined && g.kickoff && g.venue));
});

test("reviewed 4A DII seed template preserves official district positions including G28", () => {
 assert.deepEqual(validateTemplate(template4AD22026), []);
 assert.equal(template4AD22026.slots.length, 64);
 const slots = template4AD22026.slots.filter(s => s.region === 3 && s.firstRoundGame === 3).sort((a,b) => a.side-b.side);
 assert.deepEqual(slots.map(seedLabel), ["R15", "T16"]);
 assert.deepEqual(nodes.find(n => n.region === 3 && n.round === 0 && n.index === 3)?.teams, ["Bandera", "King"]);
});

test("existing canonical sides, schedules and verified repository results stay unchanged", () => {
 for (const old of baseline) {
  const game = games.find(g => g.id === old.id)!;
  assert.ok(game, old.id);
  for (const key of ["homeTeam", "awayTeam", "homeSchoolSlug", "awaySchoolSlug", "kickoff", "venue", "isNeutralSite", "designatedSidesConfirmed"] as const)
   assert.equal(game[key], (old as Record<string, unknown>)[key], `${old.id}: ${key}`);
  if ("publicScoreVerified" in old && old.publicScoreVerified) {
   assert.equal(game.homeScore, old.homeScore);
   assert.equal(game.awayScore, old.awayScore);
  }
 }
 for (const [id, home, away] of [["2026-bi-district-4a-d2-i-4",71,49],["2026-bi-district-4a-d2-i-5",42,0],["2026-bi-district-4a-d2-i-7",63,0]] as const) {
  const game = games.find(g => g.id === id)!;
  assert.equal(game.homeScore, home); assert.equal(game.awayScore, away);
 }
 assert.equal(playoff4AD2FirstRound.length, 32);
 assert.equal(playoff4AD2Area.length, 16);
});

test("all completed divisions retain coverage with no duplicate canonical playoff pairs", () => {
 for (const division of ["2A-D1", "2A-D2", "3A-D1", "3A-D2", "4A-D1", "4A-D2"]) {
  const layout = buildBracketLayout(division, games);
  assert.equal(layout.nodes.filter(n => n.round === 0 && verifiedWinner(n.game)).length, 32);
  const matches = layout.nodes.flatMap(n => n.game ? [n.game] : []);
  const keys = matches.map(g => `${g.season}|${g.playoff?.round}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
  assert.equal(new Set(keys).size, keys.length, division);
 }
});

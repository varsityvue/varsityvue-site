import test from "node:test";
import assert from "node:assert/strict";
import { getGames } from "./games";
import { getRegionalRoundReadiness } from "./regional-round-readiness";
import { buildBracketLayout } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
const baseline = getGames();
const completed = baseline.map(game => game.playoff?.round === "Area" ? {...game, status: "final" as const, publicScoreVerified: true, homeScore: 28, awayScore: 14} : game);
test("all six divisions progress from 96 Area finals to exactly 48 confirmed Regional slots", () => {
  assert.equal(getRegionalRoundReadiness(baseline).length, 48);
  assert.ok(getRegionalRoundReadiness(baseline).every(row => row.status === "awaiting-results" && row.teams.every(team => team === null)));
  const rows = getRegionalRoundReadiness(completed);
  assert.equal(rows.length, 48);
  assert.ok(rows.every(row => row.status === "needs-schedule" && row.teams.every(Boolean)));
  for (const division of new Set(rows.map(row => row.division))) {
    assert.equal(rows.filter(row => row.division === division).length, 8);
    const {nodes} = buildBracketLayout(division, completed);
    for (const node of nodes.filter(node => node.round === 2)) assert.deepEqual(node.teams, node.sources.map(id => verifiedWinner(nodes.find(source => source.id === id)?.game)));
  }
  assert.equal(baseline.filter(game => game.playoff?.round === "Regional Semifinal").length, 0);
});
test("pending, tied, partial and unverified Area results never confirm advancement", () => {
  const area = completed.find(game => game.playoff?.round === "Area")!;
  for (const override of [{status: "live" as const}, {homeScore:14}, {homeScore:undefined, score:undefined}, {publicScoreVerified:false}, {resultType:"no_contest" as const}]) {
    const games = completed.map(game => game.id === area.id ? {...game,...override} : game);
    assert.equal(getRegionalRoundReadiness(games).filter(row => row.status === "awaiting-results").length, 1);
  }
});
test("canonical Regional schedules activate once; corrections and duplicates fail closed", () => {
  const row = getRegionalRoundReadiness(completed)[0];
  const source = completed.find(game => game.playoff?.round === "Area")!;
  const regional = {...source, id:"regional-test", status:"upcoming" as const, publicScoreVerified:false, homeScore:undefined, awayScore:undefined,
    homeTeam:row.teams[0]!,awayTeam:row.teams[1]!,playoff:{round:"Regional Semifinal" as const,division:source.playoff!.division,region:row.region},kickoff:undefined,venue:undefined};
  assert.equal(getRegionalRoundReadiness([...completed,regional])[0].status,"needs-details");
  assert.equal(getRegionalRoundReadiness([...completed,regional,{...regional,id:"duplicate"}])[0].status,"duplicate-schedule");
  const corrected = completed.map(game => game.id === source.id ? {...game,homeScore:7,awayScore:21} : game);
  assert.equal(getRegionalRoundReadiness([...corrected,regional])[0].status,"needs-schedule");
  assert.equal(getRegionalRoundReadiness([...corrected,regional])[0].gameId,undefined);
});

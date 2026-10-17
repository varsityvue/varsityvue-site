import assert from "node:assert/strict";
import test from "node:test";
import { ownerWeek8GameStats, ownerWeek8DetailedStats } from "@/data/owner-week8-game-stats";
import { getGameStatAvailability } from "@/data/stat-availability";
import { gameStats } from "@/lib/all-game-stats";
import { getGames } from "@/lib/games";
import { validateGameStats } from "@/lib/game-stats-validation";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerId } from "@/lib/player-identity";
import { getPassingLeaders, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/data/schools";

test("Week 8 integrates six games once and only six supplied offenses", () => {
  assert.equal(ownerWeek8GameStats.length,6);
  assert.equal(ownerWeek8DetailedStats.length,5);
  assert.equal(ownerWeek8GameStats.reduce((n,g)=>n+g.passing.length+g.rushing.length+g.receiving.length,0),65);
  const supplied = new Set(["stephenville","de-leon","stamford","comanche","goldthwaite","albany"]);
  for (const g of ownerWeek8GameStats) {
    assert.equal(gameStats.filter(s=>s.gameId===g.gameId).length,1);
    assert.equal(getGames().find(s=>s.id===g.gameId)?.week,8);
    assert.deepEqual(validateGameStats(g).filter(i=>i.level==="error"),[]);
    assert.ok([...g.passing,...g.rushing,...g.receiving,...g.teamStats].every(s=>supplied.has(s.schoolSlug)));
    for(const q of g.quarterScores) assert.equal(q.quarters.reduce((a,b)=>a+b,0),q.total);
  }
  assert.equal(ownerWeek8GameStats.filter(g=>g.quarterScores.length===2).length,4);
});

test("coach discrepancies and unknown touchdowns remain unchanged", () => {
  const [steph,deLeon,stamford,comanche]=ownerWeek8GameStats;
  assert.equal(steph.passing.reduce((n,l)=>n+l.completions,0),22);
  assert.equal(steph.receiving.reduce((n,l)=>n+l.receptions,0),21);
  assert.equal(deLeon.passing[0].completions,15);
  assert.equal(deLeon.receiving.reduce((n,l)=>n+l.receptions,0),16);
  assert.equal(comanche.passing[0].yards,82);
  assert.equal(comanche.receiving.reduce((n,l)=>n+l.yards,0),93);
  assert.ok([...stamford.rushing,...stamford.receiving].every(l=>l.touchdowns===undefined));
  assert.equal(stamford.passing[0].touchdowns,4);
  assert.equal(stamford.passing[0].interceptions,undefined);
  assert.equal(steph.passing[0].touchdowns,undefined);
  assert.equal(steph.passing[0].interceptions,0);
});

test("team, district and area leaderboards share updated identities and one Week 8 log", async () => {
  for (const [school,name,kind,yards,weekYards] of [
    ["stephenville","Trot Jordan","passing",1926,390],
    ["de-leon","Lane Couch","rushing",1440,108],
    ["stamford","Slayden Young","receiving",704,157],
    ["comanche","Nicolas Anaya","rushing",undefined,139],
  ] as const) {
    const id=getPlayerId(school,name,2026);
    const leaders=kind==="passing"?getPassingLeaders:kind==="rushing"?getRushingLeaders:getReceivingLeaders;
    for(const scope of [{},{schoolSlug:school},{districtId:getSchoolBySlug(school)!.districtId}]) {
      const entries=leaders(scope).filter(p=>p.playerId===id);
      assert.equal(entries.length,1);
      const entry=entries[0];
      const actual="passing" in entry?entry.passing.yards:"rushing" in entry?entry.rushing.yards:entry.receiving.yards;
      if(yards!==undefined) assert.equal(actual,yards);
      else assert.ok(actual>=weekYards);
    }
    const log=(await getPlayerGameLog(id,2026,getGames())).filter(g=>ownerWeek8GameStats.some(s=>s.gameId===g.gameId));
    assert.equal(log.length,1);
    assert.equal(log[0][kind]?.yards,weekYards);
  }
});

test("pending Cisco reporting is visible without invented lines", () => {
  for(const id of ["cisco-at-hawley-2026-week-8"]) {
    assert.equal(getGameStatAvailability(id)?.status,"pending");
    const g=ownerWeek8GameStats.find(g=>g.gameId===id)!;
    assert.deepEqual([g.passing,g.rushing,g.receiving,g.teamStats],[[],[],[],[]]);
  }
  assert.match(getGameStatAvailability("cisco-at-hawley-2026-week-8")!.note!,/Cisco/);
  assert.equal(getGameStatAvailability("goldthwaite-at-albany-2026-week-8")!.status,"partial");
});

test("detailed game tables preserve source metrics beyond leaderboard columns", () => {
  const steph=ownerWeek8DetailedStats.find(g=>g.gameId.startsWith("china-spring"))!;
  assert.deepEqual(steph.tables[0].rows.find(r=>r.player==="Trot Jordan")!.values,[17,"—",19,23,390,".826","20.5",4,0,57,162.6]);
  const deLeon=ownerWeek8DetailedStats.find(g=>g.gameId.startsWith("hico"))!;
  assert.deepEqual(deLeon.tables[1].rows.find(r=>r.player==="Lane Couch")!.values,[1,"Jr",13,108,"8.3","—",1,2]);
  const stamford=ownerWeek8DetailedStats.find(g=>g.gameId.startsWith("stamford"))!;
  assert.deepEqual(stamford.tables[2].rows.find(r=>r.player==="Slayden Young")!.values,[11,"Jr",6,157,"26.2",86,"—"]);
  const comanche=ownerWeek8DetailedStats.find(g=>g.gameId.startsWith("comanche"))!;
  assert.equal(comanche.teamMetrics[2].away,"8/93/11.6/—/1");
});

test("Goldthwaite and Albany offense reconcile with owner-approved corrections", async () => {
  const id="goldthwaite-at-albany-2026-week-8";
  const g=ownerWeek8GameStats.find(g=>g.gameId===id)!;
  for(const school of ["goldthwaite","albany"]) {
    const team=g.teamStats.find(t=>t.schoolSlug===school)!;
    const pass=g.passing.filter(r=>r.schoolSlug===school),rush=g.rushing.filter(r=>r.schoolSlug===school),rec=g.receiving.filter(r=>r.schoolSlug===school);
    assert.equal(pass.reduce((n,r)=>n+r.attempts,0),team.passAttempts);
    assert.equal(pass.reduce((n,r)=>n+r.completions,0),rec.reduce((n,r)=>n+r.receptions,0));
    assert.equal(pass.reduce((n,r)=>n+r.yards,0),team.passingYards);
    assert.equal(rec.reduce((n,r)=>n+r.yards,0),team.passingYards);
    assert.equal(rush.reduce((n,r)=>n+r.yards,0),team.rushingYards);
    assert.equal(rush.reduce((n,r)=>n+r.attempts,0),team.rushingAttempts);
  }
  assert.equal(g.teamStats[0].passAttempts,17);
  assert.equal(g.teamStats[1].rushingYards,-16);
  assert.equal(g.teamStats[1].totalYards,70);
  assert.equal(g.scoringPlays.length,8);
  assert.match(g.scoringPlays[3].description,/61-yard touchdown pass.*28–0/);
  const detail=ownerWeek8DetailedStats.find(s=>s.gameId===id)!;
  assert.ok(!detail.teamMetrics.some(m=>/possession/i.test(m.label)));
  assert.deepEqual(detail.tables.find(t=>t.title==="Kicking")!.rows[0].values,[8,8]);
  for(const [school,name,category,weekYards,total] of [
    ["goldthwaite","Landry Sanderson","rushing",232,1155],
    ["albany","Clay Chapman","passing",86,1208],
  ] as const) {
    const playerId=getPlayerId(school,name,2026);
    const leaders=category==="rushing"?getRushingLeaders:getPassingLeaders;
    for(const scope of [{},{schoolSlug:school},{districtId:getSchoolBySlug(school)!.districtId}]) {
      const rows=leaders(scope).filter(p=>p.playerId===playerId);
      assert.equal(rows.length,1);
      assert.equal("rushing" in rows[0]?rows[0].rushing.yards:rows[0].passing.yards,total);
    }
    const log=(await getPlayerGameLog(playerId,2026,getGames())).filter(l=>l.gameId===id);
    assert.equal(log.length,1);assert.equal(log[0][category]?.yards,weekYards);
  }
});

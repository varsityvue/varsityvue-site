import assert from "node:assert/strict";
import test from "node:test";
import { playoffScheduleAdditions, playoffSiteReconciliations } from "../data/playoff-schedule-additions-20261112";
import { games as historicalGames } from "../data/games";
import { getGames } from "./games";
import { getBiDistrictReadiness } from "./bidistrict-readiness";
import { auditPublishedPlayoffGames } from "./playoff-bracket-schedule-audit";
import { gameSiteLabel, gameOpponentPrefix } from "./game-site-presentation";
import { getSchoolBySlug } from "./schools";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { findSchoolBracketLocation } from "./playoff-school-location";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import TeamPlayoffPath from "../components/TeamPlayoffPath";

test("61 exact proposed games are distinct, correctly paired, source-backed and outcome-free",()=>{
 assert.equal(playoffScheduleAdditions.length,61);
 const ids=new Set(historicalGames.map(g=>g.id));
 for(const g of playoffScheduleAdditions){
  assert.ok(!ids.has(g.id));ids.add(g.id);
  assert.equal(g.isNeutralSite,null);assert.equal(g.status,'upcoming');
  assert.equal(g.homeScore,undefined);assert.equal(g.awayScore,undefined);assert.equal(verifiedWinner(g),null);
  assert.ok(getSchoolBySlug(g.homeSchoolSlug!));assert.ok(getSchoolBySlug(g.awaySchoolSlug!));
  assert.match(g.kickoff!,/^2026-11-1[23]T\d\d:\d\d:00-06:00$/);
 }
 assert.deepEqual(auditPublishedPlayoffGames(getGames()),[]);
 const region=getBiDistrictReadiness(getGames()).filter(r=>r.division.startsWith('2A')&&r.region==='Region II');
 assert.equal(region.length,16);assert.ok(region.every(r=>r.status==='scheduled'));
});
test("nullable neutrality never manufactures a Neutral label or home designation",()=>{
 for(const isNeutralSite of [true,false,null]){
  const g={isNeutralSite,designatedSidesConfirmed:false};
  assert.equal(gameSiteLabel(g,true),isNeutralSite===true?'Neutral site':'Matchup');
  assert.equal(gameOpponentPrefix(g),'vs.');
 }
 assert.equal(gameSiteLabel({isNeutralSite:false,designatedSidesConfirmed:true},true),'Home');
 assert.equal(gameSiteLabel({isNeutralSite:null,designatedSidesConfirmed:true},false),'Designated away');
});
test("all bracket schools selectable, Austin identities resolve independently",()=>{
 const html=renderToStaticMarkup(createElement(TeamPlayoffPath,{games:[],selectedSchool:'4A-D1|2|Austin'}));
 assert.equal((html.match(/<option /g)||[]).length,384);
 assert.equal(findSchoolBracketLocation('4A-D1|2|Austin')?.regionIndex,2);
 assert.equal(findSchoolBracketLocation('4A-D1|0|Austin')?.regionIndex,0);
 assert.match(html,/4A Division I · Region III/);
});

test("seven explicit site reconciliations preserve all other existing game facts",()=>{
 assert.equal(playoffSiteReconciliations.length,7);
 for(const correction of playoffSiteReconciliations){
   const before=historicalGames.find(g=>g.id===correction.id)!;
   const after=getGames().find(g=>g.id===correction.id)!;
   assert.ok(before);assert.equal(after.isNeutralSite,null);assert.equal(after.designatedSidesConfirmed,false);
   for(const key of ['kickoff','venue','homeSchoolSlug','awaySchoolSlug','homeTeam','awayTeam','homeScore','awayScore','officialWinnerSchoolSlug'] as const) assert.deepEqual(after[key],before[key]);
 }
});

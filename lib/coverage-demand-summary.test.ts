import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getGames } from "./games";
import { buildSearchSummary,validSummary,SUMMARY_FIELDS } from "./coverage-demand-summary";
import { LOCATION_CATALOG_VERSION,SCHEDULE_CATALOG_VERSION } from "./coverage-catalog-versions";
import { fixtureGames,fixtureSummary } from "./coverage-demand-test-fixture";

test("allowlist rejects every extra field, identity, query text, aliases and selected identity",()=>{
 assert.ok(validSummary(fixtureSummary)); assert.equal(Object.keys(fixtureSummary).length,SUMMARY_FIELDS.length);
 for(const field of ['latitude','longitude','lat','lon','lng','accuracy','coords','position','gps','user_id','member_uuid','profile_id','account_id','email','phone','username','display_name','token','access_token','session_id','anonymous_id','device_id','ip','query','selected_game_id','selected_school_id','referrer','url']) assert.equal(validSummary({...fixtureSummary,[field]:'x'}),false,field);
 for(const field of SUMMARY_FIELDS) { const s:Record<string,unknown>={...fixtureSummary};delete s[field];assert.equal(validSummary(s),false,field); }
 assert.equal(validSummary(null),false); assert.equal(validSummary([]),false);
});
test("invalid ranges, impossible stage counts, versions and enums are rejected",()=>{
 assert.equal(validSummary({...fixtureSummary,schedule_catalog_version:'schedule-1692cf167930'}),false,'previous schedule fingerprint is rejected for new summaries');
 for(const patch of [{final_radius_miles:20},{radius_expansion_steps:5},{radius_expansion_steps:-1},{radius_expanded:true},{week:12},{week:2.5},{season:2027},{grid_version:'bad'},{coarse_bucket_id:'bad'},{location_catalog_version:'bad'},{schedule_catalog_version:'bad'},{returned_game_count:-1},{returned_game_count:513},{in_radius_real_game_count:100},{week_located_game_count:1},{returned_game_count:0},{center_source:'home'},{filter_scope:'unknown'},{zero_result_reason:'coverage_gap'},{query_present:'true'}]) assert.equal(validSummary({...fixtureSummary,...patch}),false,JSON.stringify(patch));
});
test("honest stage counts distinguish no nearby games, status and query filters; disabled weeks emit nothing",()=>{
 const point={latitude:32.123456789,longitude:-98.543210987};
 const query=buildSearchSummary(fixtureGames,point,'school_center',7,50,'unmatchable-private-text','all')!;
 assert.ok(validSummary(query));assert.equal(query.query_present,true);assert.equal(query.zero_result_reason,'query_filter_excluded');assert.equal(query.center_source,'school_center');assert.ok(!JSON.stringify(query).includes('unmatchable'));
 const status=buildSearchSummary(fixtureGames,point,'browser_location',7,50,'','final')!;assert.equal(status.zero_result_reason,'status_filter_excluded');assert.ok(validSummary(status));
 const empty=buildSearchSummary(fixtureGames,{latitude:26,longitude:-106},'browser_location',7,10,'','all')!;assert.equal(empty.zero_result_reason,'no_games_in_radius');assert.ok(validSummary(empty));
 for(const week of [10,11]) assert.equal(buildSearchSummary(fixtureGames,point,'browser_location',week,50,'','all'),null);
 const text=JSON.stringify(fixtureSummary);for(const value of ['32.123456789','-98.543210987',fixtureGames[0].gameId])assert.ok(!text.includes(value));
});
test("catalog fingerprints cover public venue sources and canonical merged schedule geometry, without score state",()=>{
 const location=createHash('sha256').update(Buffer.concat(['data/venues.ts','data/school-football-venues.ts','data/game-venue-overrides.ts'].map(p=>readFileSync(p)))).digest('hex').slice(0,12);
 const schedule=getGames().map(g=>({id:g.id,season:g.season,week:g.week,kickoff:g.kickoff,gameType:g.gameType,homeSchoolSlug:g.homeSchoolSlug,awaySchoolSlug:g.awaySchoolSlug,districtGame:g.districtGame})).sort((a,b)=>a.id.localeCompare(b.id));
 assert.equal(LOCATION_CATALOG_VERSION,'locations-'+location);assert.equal(SCHEDULE_CATALOG_VERSION,'schedule-'+createHash('sha256').update(JSON.stringify(schedule)).digest('hex').slice(0,12));
});
test("confirmed LIVE and schedule-inferred kickoff windows are counted separately",()=>{
 const point={latitude:32.123456789,longitude:-98.543210987};
 const rows=fixtureGames.map(g=>g.season===2026&&g.week===7?{...g,status:'live' as const,livePresentation:'kickoff_inferred' as const}:g);
 const inferred=buildSearchSummary(rows,point,'browser_location',7,150,'','live')!;
 assert.equal(inferred.returned_game_count,0);assert.equal(inferred.live_game_count,0);assert.equal(inferred.kickoff_window_game_count,0);assert.ok(validSummary(inferred));
 const confirmed=buildSearchSummary(rows.map(g=>({...g,livePresentation:'score_available' as const})),point,'browser_location',7,150,'','live')!;
 assert.equal(confirmed.kickoff_window_game_count,0);assert.equal(confirmed.live_game_count,confirmed.returned_game_count);assert.ok(validSummary(confirmed));
});

test("unified summaries count actual all/strict LIVE/completed rows and bounded filter modifiers", async()=>{
 const {buildWeeklySearchSummary}=await import('./coverage-demand-summary');
 const {parseWeeklyParams,selectWeeklyGames}=await import('./unified-games');
 const {getGamePresentation}=await import('./game-presentation');
 const point={latitude:32.123456789,longitude:-98.543210987};
 const games=getGames().map(g=>({...g,classification:'2A',searchText:`${g.homeTeam} ${g.awayTeam}`.toLowerCase(),locationInfo:fixtureGames.find(f=>f.gameId===g.id)!.location}));
 const now=new Date('2026-10-09T23:30:00Z');
 for(const filter of ['all','live','upcoming','completed']) {
  const p=parseWeeklyParams({season:'2026',week:'7',mode:'nearby',radius:'150',filter},games,now);
  const rows=selectWeeklyGames(games,p,new Set(),now,point).map(r=>r.game);
  const s=buildWeeklySearchSummary(games,point,'browser_location',p,new Set(),now,rows)!;
  assert.ok(validSummary(s),JSON.stringify(s));assert.equal(s.returned_game_count,rows.length);assert.equal(s.in_radius_default_eligible_count,s.in_radius_real_game_count);
  assert.equal(s.live_game_count,rows.filter(g=>getGamePresentation(g,now).kind==='verified_live').length);
 }
 const p=parseWeeklyParams({season:'2026',week:'7',mode:'nearby',following:'1',classification:'2A',district:'1'},games,now);
 const s=buildWeeklySearchSummary(games,point,'school_center',p,new Set(),now,[])!;
 assert.ok(validSummary(s));assert.equal(s.additional_filters_present,true);assert.equal(s.district_only,true);assert.equal(s.zero_result_reason,'other_bounded_case');
 assert.ok(!JSON.stringify(s).includes('2A'));assert.equal(s.filter_scope,'all');
 assert.equal(validSummary({...fixtureSummary,schema_version:1}),false);
 for(const k of ['district_only','additional_filters_present','current_only','verified_only','held_results'])assert.equal(validSummary({...fixtureSummary,[k]:'true'}),false);
 assert.equal(validSummary({...fixtureSummary,other_game_count:1}),false);
});

test("held rows preserve honest presentation counts while strict status rules apply to unheld results",()=>{
 const held={...fixtureSummary,filter_scope:'live' as const,held_results:true,upcoming_game_count:0,final_game_count:fixtureSummary.returned_game_count};
 assert.ok(validSummary(held));assert.equal(validSummary({...held,held_results:false}),false);
});

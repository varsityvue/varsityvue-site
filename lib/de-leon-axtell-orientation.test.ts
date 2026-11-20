import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import before from '../docs/de-leon-axtell-orientation-20261117/before.json';
import baseline from '../docs/de-leon-axtell-orientation-20261117/baseline.json';
import {getGames,getGamesForSchool} from './games';
import {buildBracketLayout} from './playoff-bracket-layout';
import {verifiedWinner} from './playoff-bracket-advancement';
import {applyGameState} from './resolve-game-score-state';
import {getRegionalRoundReadiness} from './regional-round-readiness';
import {gameSiteLabel} from './game-site-presentation';
// Use the release-time clock for the historical preservation baseline.
const baselineTime = new Date("2026-11-16T21:35:23-06:00");
const games=getGames(baselineTime),game=games.find(g=>g.id===before.id)!;
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sql=readFileSync(new URL('../docs/release-sql/2026-de-leon-axtell-home-away.sql',import.meta.url),'utf8');
test('owner-confirmed De Leon home / Axtell away changes only orientation and provenance',()=>{
 assert.equal(game.homeSchoolSlug,'de-leon');assert.equal(game.homeTeam,'De Leon');assert.equal(game.awaySchoolSlug,'axtell');assert.equal(game.awayTeam,'Axtell');assert.equal(game.designatedSidesConfirmed,true);
 const omit=(g:object)=>Object.fromEntries(Object.entries(g).filter(([k])=>!['homeSchoolSlug','awaySchoolSlug','homeTeam','awayTeam','designatedSidesConfirmed','sourceLabel','mediaLinks'].includes(k)));
 assert.deepEqual(omit(game),omit(before));
 assert.ok(before.mediaLinks.every(link=>game.mediaLinks?.some(current=>current.url===link.url&&current.type===link.type))); // Existing radio survives; the pre-existing home-only Hudl rule now applies.
assert.equal(game.kickoff,'2026-11-19T19:00:00-06:00');assert.equal(game.venue,'Bob and Norma Cervetto Stadium, Dublin, TX');assert.equal(game.isNeutralSite,null);assert.match(game.sourceLabel!,/owner-confirmed/);
 assert.equal(gameSiteLabel(game,true),'Designated home');assert.equal(gameSiteLabel(game,false),'Designated away');
});
test('every unrelated game, all 192 finals and the bracket positions remain unchanged',()=>{
 assert.equal(hash(games.filter(g=>g.id!==game.id)),baseline.otherGamesHash);
 const first=games.filter(g=>g.playoff?.round==='Bi-District');assert.equal(first.length,192);assert.equal(hash(first),baseline.firstRoundHash);
 const area=games.filter(g=>g.playoff?.round==='Area');assert.equal(area.length,96);assert.ok(area.every(g=>g.homeScore===undefined&&g.awayScore===undefined&&!g.publicScoreVerified));
 const bracket=buildBracketLayout('2A-D1',games).nodes.map(n=>({id:n.id,round:n.round,region:n.region,index:n.index,teams:n.teams,gameId:n.game?.id}));assert.equal(hash(bracket),baseline.bracketHash);
});
test('both school schedules use the corrected slots, and isolated winners reach the same Regional destination',()=>{
 for(const slug of ['de-leon','axtell']){const matches=getGamesForSchool(slug).filter(g=>g.id===game.id);assert.equal(matches.length,1);assert.equal(matches[0].homeSchoolSlug,'de-leon');assert.equal(matches[0].awaySchoolSlug,'axtell');}
 for(const [home,away,winner] of [[28,14,'De Leon'],[14,28,'Axtell']] as const){
  const final=applyGameState(game,{game_id:game.id,status:'final',home_score:home,away_score:away,verified:true,period:null,clock:null,kickoff_override:null,result_type:'played',official_winner_school_slug:null,attribution_type:'verified'});
  assert.equal(verifiedWinner(final),winner);assert.equal(final.homeScore,home);assert.equal(final.awayScore,away);
  const readiness=getRegionalRoundReadiness(games.map(g=>g.id===game.id?final:g)).find(r=>r.division==='2A-D1'&&r.region==='II'&&r.slot===2)!;assert.equal(readiness.teams[1],winner);
 }
});
async function fixture(){const db=new PGlite();await db.exec(`create schema private;create table private.canonical_game_identity(game_id text primary key,away_school_slug text not null,home_school_slug text not null);create table public.game_state(game_id text);create table public.score_submissions(game_id text);create table public.missing_score_intelligence(id text,game_id text);create table public.missing_score_evidence(intelligence_id text);insert into private.canonical_game_identity values ('${before.id}','de-leon','axtell'),('untouched','chilton','la-villa');`);return db;}
test('guarded identity SQL updates exactly the existing row and is idempotent while scoreless',async()=>{const db=await fixture();try{await db.exec(sql);await db.exec(sql);assert.deepEqual((await db.query('select * from private.canonical_game_identity order by game_id')).rows,[{game_id:game.id,away_school_slug:'axtell',home_school_slug:'de-leon'},{game_id:'untouched',away_school_slug:'chilton',home_school_slug:'la-villa'}]);}finally{await db.close();}});
test('SQL aborts without an identity or with any conflicting orientation',async()=>{for(const setup of [`delete from private.canonical_game_identity where game_id='${before.id}'`,`update private.canonical_game_identity set away_school_slug='conflicting-school' where game_id='${before.id}'`]){const db=await fixture();try{await db.exec(setup);const snapshot=(await db.query('select * from private.canonical_game_identity order by game_id')).rows;await assert.rejects(db.exec(sql),/missing|conflicts/);await db.exec('rollback');assert.deepEqual((await db.query('select * from private.canonical_game_identity order by game_id')).rows,snapshot);}finally{await db.close();}}});
test('SQL refuses existing score states, submissions or missing-score candidates, without changing any identity',async()=>{for(const table of ['game_state','score_submissions','missing_score_intelligence']){const db=await fixture();try{await db.exec(`insert into public.${table}(game_id) values ('${before.id}')`);await assert.rejects(db.exec(sql),/score state, submission\/report or candidate evidence/);await db.exec('rollback');assert.equal((await db.query<{away_school_slug:string}>(`select away_school_slug from private.canonical_game_identity where game_id='${before.id}'`)).rows[0].away_school_slug,'de-leon');}finally{await db.close();}}});

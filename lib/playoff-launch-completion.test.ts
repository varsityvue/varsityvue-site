import test from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../tests/fixtures/2adi-published-finals-20261114.json';
import {getGames,getGamesForSchool,getGameById} from './games';
import {getBiDistrictReadiness} from './bidistrict-readiness';
import {buildBracketLayout} from './playoff-bracket-layout';
import {playoffLaunchGames} from '../data/playoff-launch-games-20261114';
import {getPlayoffSchedule} from './playoffs';
import {resolveBracketSchool} from './playoff-school-catalog';
import {verifiedWinner} from './playoff-bracket-advancement';
const withBaseline=()=>getGames().map(game=>{
 const row=baseline.find(r=>r.game_id===game.id);
 return row?{...game,status:'final' as const,homeScore:row.home_score,awayScore:row.away_score,publicScoreVerified:row.verified}:game;
});
test('all 32 first-round slots have unique canonical Game Centers and reconciled verified finals',()=>{
 const games=withBaseline();const rows=getBiDistrictReadiness(games).filter(r=>r.division==='2A Division I');
 assert.equal(rows.length,32);assert.equal(new Set(rows.map(r=>r.gameId)).size,32);assert.ok(rows.every(r=>r.status==='verified-final'));
 for(const row of rows){const game=games.find(g=>g.id===row.gameId)!;assert.ok(verifiedWinner(game));assert.ok(resolveBracketSchool(game.homeTeam!,'2A-D1',row.region));assert.ok(resolveBracketSchool(game.awayTeam!,'2A-D1',row.region));}
});
test('all 16 Area Game Centers match verified source winners without invented results',()=>{
 const {nodes}=buildBracketLayout('2A-D1',withBaseline());const area=nodes.filter(n=>n.round===1);
 assert.equal(area.length,16);assert.ok(area.every(n=>n.game && n.teams.every(Boolean)));
 assert.ok(area.every(n=>!verifiedWinner(n.game)));
 const deLeon=area.find(n=>n.teams.includes('De Leon'))!;
 assert.deepEqual(deLeon.teams,['Axtell','De Leon']);assert.equal(deLeon.game?.kickoff,undefined);assert.equal(deLeon.game?.venue,undefined);
});
test('every new game is shared by Game Center, Playoff Central and both school schedules',()=>{
 const schedule=getPlayoffSchedule(getGames()).map(r=>r.game.id);
 for(const game of playoffLaunchGames){assert.ok(getGameById(game.id));assert.ok(schedule.includes(game.id));for(const slug of [game.homeSchoolSlug!,game.awaySchoolSlug!])assert.ok(getGamesForSchool(slug).some(g=>g.id===game.id));}
});
test('unknown historical metadata and future scores remain unknown',()=>{
 const missing=playoffLaunchGames.filter(g=>g.gameType==='playoff'&&g.playoff?.division==='2A Division I'&&g.playoff.round==='Bi-District');
 assert.equal(missing.length,13);assert.ok(missing.every(g=>!g.kickoff&&!g.venue));
 assert.ok(playoffLaunchGames.filter(g=>g.playoff?.round==='Area').every(g=>g.homeScore===undefined&&g.awayScore===undefined&&!g.publicScoreVerified));
});

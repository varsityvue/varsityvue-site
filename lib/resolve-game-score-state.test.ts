import test from 'node:test';
import assert from 'node:assert/strict';
import {getGameById,getGames} from './games';
import {applyGameState} from './resolve-game-score-state';
import {getGamePresentation} from './game-presentation';
import {buildBracketLayout} from './playoff-bracket-layout';
import type {PublicScoreState} from './public-score-state';
const game=getGameById('de-leon-vs-alvord-2026-bi-district')!;
const state=(patch:Partial<PublicScoreState>={}):PublicScoreState=>({game_id:game.id,status:'final',home_score:40,away_score:24,period:null,clock:null,verified:true,kickoff_override:null,result_type:'played',official_winner_school_slug:null,...patch});
test('all 32 reviewed first-round finals survive absent production score state',()=>{
 const nodes=buildBracketLayout('2A-D1',getGames()).nodes.filter(n=>n.round===0);
 assert.equal(nodes.length,32);assert.ok(nodes.every(n=>getGamePresentation(n.game!).kind==='verified_final'));
 assert.ok(nodes.every(n=>applyGameState(n.game!).publicScoreVerified));
});
test('missing, unverified and incomplete score states cannot erase or splice a reviewed final',()=>{
 for(const value of [undefined,state({verified:false,home_score:0,away_score:0,status:'live'}),state({home_score:41,away_score:null}),state({home_score:null,away_score:null,status:'live'}),state({game_id:'wrong'}),state({status:'scheduled',home_score:null,away_score:null}),state({status:'upcoming',home_score:0,away_score:0})])assert.deepEqual(applyGameState(game,value),game);
 assert.equal(game.homeScore,40);assert.equal(game.awayScore,24);
});
test('complete authoritative corrections and explicit outcomes preserve precedence',()=>{
 const corrected=applyGameState(game,state({home_score:42,away_score:24,attribution_type:'correction'}));
 assert.equal(corrected.homeScore,42);assert.equal(corrected.scoreAttribution?.type,'correction');
 assert.equal(applyGameState(game,state({status:'cancelled',home_score:null,away_score:null})).status,'cancelled');
 assert.equal(applyGameState(game,state({home_score:null,away_score:null,result_type:'no_contest'})).resultType,'no_contest');
});

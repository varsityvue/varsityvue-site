import test from 'node:test';import assert from 'node:assert/strict';
import {completePostseasonStanding} from './playoff-record-presentation';
import {getStandingForSchoolFromGames} from './standings';import {getGames} from './games';import {formatOverallRecord} from './school-record-presentation';
test('a newly covered postseason school has unknown overall record, not 1-0',()=>{
 const games=getGames();const original=getStandingForSchoolFromGames('panhandle',games)!;
 assert.equal(formatOverallRecord(completePostseasonStanding(original,games,'panhandle')),'—');
 assert.equal(original.overallWins,1);
 assert.equal(formatOverallRecord(completePostseasonStanding({...original,overallWins:7,overallLosses:4},games,'panhandle')),'7-4');
});

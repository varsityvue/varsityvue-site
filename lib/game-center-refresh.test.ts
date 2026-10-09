import assert from "node:assert/strict";
import test from "node:test";
import { shouldPollGameCenter } from "./game-center-refresh";
const kickoff="2026-10-09T19:00:00-05:00";
const at=(time:string)=>Date.parse(`2026-10-09T${time}-05:00`);
test("scheduled pages start checking near kickoff, without calling timing LIVE",()=>{
 assert.equal(shouldPollGameCenter({status:"scheduled",kickoff},at("10:00:00")),false);
 assert.equal(shouldPollGameCenter({status:"scheduled",kickoff},at("18:30:00")),true);
 assert.equal(shouldPollGameCenter({status:"scheduled",kickoff},Date.parse(kickoff)+6*3600000),true);
 assert.equal(shouldPollGameCenter({status:"scheduled",kickoff},Date.parse(kickoff)+6*3600000+1),false);
});
test("LIVE keeps refreshing; final, exceptional and unknown kickoffs do not auto-poll",()=>{
 assert.equal(shouldPollGameCenter({status:"live",kickoff},Date.parse(kickoff)+24*3600000),true);
 for(const status of ["final","cancelled","postponed"] as const)assert.equal(shouldPollGameCenter({status,kickoff},at("19:30:00")),false);
 for(const value of [undefined,"2026-10-09","invalidTdate"])assert.equal(shouldPollGameCenter({status:"scheduled",kickoff:value},at("19:30:00")),false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { gameShare } from "./game-share";
import type { WeeklyGame } from "./unified-games";

const now = new Date("2026-10-03T18:00:00Z");
const base: WeeklyGame = {
  id: "test-at-home-2026-week-7", season: 2026, week: 7, districtGame: false,
  gameType: "regular", status: "scheduled", awayTeam: "Test", homeTeam: "Home",
  kickoff: "2026-10-09T19:00:00-05:00", venue: "Long Stadium Name",
  classification: "2A Division I", searchText: "", locationInfo: {locationQuality: "unavailable", reason: "missing_venue"},
};
test("upcoming shares canonical game, Central kickoff and available venue", () => {
  const share = gameShare(base, now);
  assert.equal(share.url, "https://varsityvue.com/games/test-at-home-2026-week-7");
  assert.match(share.text, /Test at Home · Week 7/);
  assert.match(share.text, /Friday, Oct 9.*7:00 PM CDT/);
  assert.match(share.text, /Long Stadium Name/);
  assert.match(gameShare({...base, venue:undefined, locationInfo:{locationQuality:"verified",locationSource:"home_venue",venueName:"Verified Field",city:"Hamilton",latitude:31.7,longitude:-98.1}},now).text,/Verified Field · Hamilton/);
});
test("only authoritative scores and live context enter share text, including zero", () => {
  const live = {...base, status:"live" as const, publicScoreVerified:true, awayScore:0,homeScore:14,score:{away:0,home:14,period:"3rd",clock:"2:05"}};
  assert.match(gameShare(live,now).text, /LIVE.*Test 0, Home 14/);
  assert.match(gameShare(live,now).text, /3rd · 2:05/);
  assert.doesNotMatch(gameShare({...live,publicScoreVerified:false},now).text, /Test 0|3rd|Follow the live/);
});
test("ties and exceptional outcomes do not invent a winner or a played score", () => {
  assert.match(gameShare({...base,status:"final",resultType:"tie",awayScore:14,homeScore:14},now).text,/Test 14, Home 14/);
  const forfeited = gameShare({...base,status:"final",resultType:"forfeit",winnerName:"Home",awayScore:0,homeScore:99},now).text;
  assert.match(forfeited,/Forfeit · Winner: Home/); assert.doesNotMatch(forfeited,/Home 99/);
  assert.match(gameShare({...base,status:"final",resultType:"no_contest"},now).text,/No contest/);
  for (const status of ["postponed","cancelled"] as const) {
    const text = gameShare({...base,status,awayScore:99,homeScore:100},now).text;
    assert.match(text,new RegExp(status,"i")); assert.doesNotMatch(text,/Test 99|Home 100/);
  }
});
test("date-only and unknown kickoffs are not fabricated and IDs are encoded", () => {
  assert.match(gameShare({...base,kickoff:"2026-10-09"},now).text,/Time TBD/);
  assert.match(gameShare({...base,kickoff:undefined},now).text,/Date\/time TBD|awaiting verification/);
  assert.equal(gameShare({...base,id:"a/b ?"},now).url,"https://varsityvue.com/games/a%2Fb%20%3F");
});

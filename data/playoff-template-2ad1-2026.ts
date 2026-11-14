import type { BracketTemplate } from "@/lib/playoff-qualification";
// Each mapping reviewed against UIL's linked 2A DI bracket, November 14, 2026.
// Source contains a conflicting premature Area score for Axtell–De Leon. No scores imported.
export const template2AD12026: BracketTemplate = {
 schemaVersion:1,version:1,season:2026,division:"2A-D1",
 evidence:{source:"https://www.uiltexas.org/football/playoff-brackets/2AD1",reviewedBy:"VarsityVue development source review",reviewedAt:"2026-11-14T16:00:00Z"},
 slots:[0,1,2,3].flatMap(region=>[
  [[1,1],[2,4]],[[4,2],[3,3]],[[2,1],[1,4]],[[3,2],[4,3]],
  [[3,1],[4,4]],[[2,2],[1,3]],[[4,1],[3,4]],[[1,2],[2,3]],
 ].flatMap((pair,firstRoundGame)=>pair.map(([district,finish],side)=>({id:`2A-D1-${region}-${firstRoundGame}-${side}`,region,district:region*4+district,finish:finish as 1|2|3|4,firstRoundGame,side:side as 0|1})))),
};

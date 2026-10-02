import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { rankPickemStandings } from "./pickem-lifecycle";
const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
test("public page consumes database ranks and contextual ordinals without member IDs", () => {
 const page = read("app/pickem/page.tsx");
 assert.match(page, /public_pickem_season_standings/);
 assert.match(page, /public_pickem_week_standings/);
 assert.match(page, /own_pickem_season_summary/);
 assert.doesNotMatch(page, /from\("pickem_(standings|week_standings|member_totals)"\)/);
 assert.doesNotMatch(page, /entry\.user_id/);
 assert.match(page, /key=\{entry.ordinal\}/);
});
test("point rank and accuracy tie ordering match the preserved legacy rule", () => {
 const rows=[{user_id:"b",display_name:"B",username:null,graded_picks:8,correct_picks:6,accuracy_pct:75},
 {user_id:"a",display_name:"A",username:null,graded_picks:6,correct_picks:6,accuracy_pct:100},
 {user_id:"c",display_name:"C",username:null,graded_picks:8,correct_picks:5,accuracy_pct:62.5}];
 assert.deepEqual(rankPickemStandings(rows).map(x=>[x.display_name,x.rank]),[["A",1],["B",1],["C",3]]);
 const sql=read("supabase/migrations/20261002200220_public_uuid_safe_contracts.sql");
 assert.match(sql,/rank\(\) over\(order by correct_picks desc\)/);
 assert.match(sql,/order by correct_picks desc,accuracy_pct desc,user_id/);
});
test("report status and reviewer reads use distinct contracts", () => {
 assert.match(read("app/report-score/page.tsx"),/own_score_report_status/);
 assert.match(read("app/report-score/actions.ts"),/own_score_report_status/);
 for(const name of ["app/internal/score-review/page.tsx","app/internal/score-review/history/page.tsx","app/internal/scoring/page.tsx"])
 assert.match(read(name),/internal_score_submissions/);
 assert.match(read("app/internal/pickem/submissions/page.tsx"),/internal_pickem_week_standings/);
});
test("public score fallback remains explicit and attribution is not fetched separately", () => {
 const loader=read("lib/public-score-loader.ts");
 assert.match(loader,/rpc\("public_score_states"\)/);
 assert.match(loader,/from\("public_game_state"\)/);
 assert.doesNotMatch(loader,/updated_by|source_submission_id|from\("profiles"\)/);
});
test("public feed and roster readers do not require creator identity", () => {
 assert.doesNotMatch(read("lib/team-feed.ts"),/created_by/);
 assert.doesNotMatch(read("app/manage-roster/page.tsx"),/created_by/);
});

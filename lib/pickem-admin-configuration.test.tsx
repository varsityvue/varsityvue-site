import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { getGames } from "./games";
import { eligiblePickemGames, parsePickemDraft, PICKEM_ADMIN_WEEKS } from "./pickem-admin-configuration";
import { PickemWeekSetup, type ConfiguredPickemWeek } from "../app/internal/pickem/PickemWeekSetup";
import { logoForPickemWeek } from "../data/pickem-sponsor-logos";

function form(week = 7) {
  const data = new FormData();
  const games = eligiblePickemGames(getGames(), week).slice(0,2);
  for (const [key,value] of Object.entries({ season: "2026", week: String(week), configuration_revision: "-1", title: `Week ${week}` })) data.set(key,value);
  for (const game of games) { data.append("game_id",game.id); data.set(`schedule_revision:${game.id}`,"0"); }
  data.set("tiebreaker_game_id",games[0].id);
  return {data,games};
}

for (const week of [7,8,9,10,11]) test(`Week ${week} has canonical draft inputs and approved logo`,() => {
  const {data,games}=form(week);
  assert.equal(parsePickemDraft(data,getGames()).p_week,week);
  assert.equal(logoForPickemWeek(2026,week,"Gilder Storage"),"/sponsors/gilder-storage-approved.png");
  assert.equal(logoForPickemWeek(2026,week,"Other sponsor"),null);
  assert.equal(games.length,2);
});

test("exactly one selected-slate tiebreaker is required",() => {
  const {data,games}=form();
  data.delete("tiebreaker_game_id"); assert.throws(()=>parsePickemDraft(data,getGames()),/exactly one/);
  data.append("tiebreaker_game_id",games[0].id);data.append("tiebreaker_game_id",games[1].id);
  assert.throws(()=>parsePickemDraft(data,getGames()),/exactly one/);
  data.set("tiebreaker_game_id","foreign");assert.throws(()=>parsePickemDraft(data,getGames()),/exactly one/);
});

test("invalid slate IDs, duplicates, missing revisions and out-of-scope weeks are rejected",() => {
  const {data,games}=form();
  data.append("game_id",games[0].id);assert.throws(()=>parsePickemDraft(data,getGames()),/unique/);
  data.delete("game_id");data.append("game_id",games[0].id);data.append("game_id","foreign");assert.throws(()=>parsePickemDraft(data,getGames()),/outside/);
  data.delete("game_id");data.append("game_id",games[0].id);data.delete(`schedule_revision:${games[0].id}`);assert.throws(()=>parsePickemDraft(data,getGames()),/revision/);
  data.set("week","12");assert.throws(()=>parsePickemDraft(data,getGames()),/supported/);
  assert.deepEqual(PICKEM_ADMIN_WEEKS,[5,6,7,8,9,10,11]);
});

test("editorial flags cannot infer or change the explicit contest designation",() => {
  const {data}=form();const games=getGames();const expected=parsePickemDraft(data,games);
  const modified=games.map((game)=>({...game,specialEvent:"Game of the Week",featured:true}));
  assert.deepEqual(parsePickemDraft(data,modified),expected);
});

test("database catalog exactly matches the approved eligible application IDs, weeks, times and schools",() => {
  const sql=readFileSync("supabase/migrations/20260930202339_pickem_future_week_administration.sql","utf8");
  const rows=[...sql.matchAll(/\('([^']+)', (\d+), '([^']+)'::timestamptz, '([^']+)', '([^']+)'\)/g)]
    .map((m)=>[m[1],Number(m[2]),m[3],m[4],m[5]]);
  const expected=PICKEM_ADMIN_WEEKS.flatMap((week)=>eligiblePickemGames(getGames(),week)).map((g)=>[g.id,g.week,g.kickoff,g.awaySchoolSlug,g.homeSchoolSlug]);
  assert.deepEqual(rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),expected.sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));assert.ok(existsSync("public/sponsors/gilder-storage-approved.png"));
});

const noop=async ()=>{};
function draft():ConfiguredPickemWeek {
  const {games}=form();return { id:"00000000-0000-4000-8000-000000009999",week:7,title:"Saved Week 7",status:"draft",configuration_revision:4,tiebreaker_game_id:"fixture-game-1",opens_at:null,closes_at:null,entry_deadline_at:null,outcome_resolution_at:null,official_rules_version:"2026-pickem-cash-v1",official_rules_published_at:"2026-09-27T05:08:44.209029Z",presenting_sponsor_name:"Gilder Storage",pickem_games:games.map((game,i)=>({id:`fixture-game-${i+1}`,game_id:game.id,sort_order:i+1,lock_at:game.kickoff!,graded_at:null})) };
}

test("rendered reopened draft retains selected games, tiebreaker, revision and separate opening confirmation",() => {
  const {games}=form();const configured=draft();
  const html=renderToStaticMarkup(<PickemWeekSetup now={Date.parse("2026-09-30T20:00:00Z")} week={7} games={games} configured={configured} revisions={{[games[0].id]:3}} unavailable={false} saveAction={noop} openAction={noop}/>);
  assert.match(html,/Saved Week 7/);assert.equal((html.match(/checked=""/g)??[]).length,2);
  assert.match(html,new RegExp(`value="${games[0].id}" selected=""`));
  assert.match(html,/name="configuration_revision" value="4"/);assert.match(html,/schedule_revision:[^"]+" value="3"/);
  assert.equal((html.match(/<form /g)??[]).length,2);assert.match(html,/name="confirm_open"/);
  assert.match(html,/later published week becomes the public/);
});

test("published, locked, graded and unavailable setup render no mutation forms",() => {
  const {games}=form();
  for(const status of ["open","locked","graded"]){
    const html=renderToStaticMarkup(<PickemWeekSetup now={Date.parse("2026-09-30T20:00:00Z")} week={7} games={games} configured={{...draft(),status}} revisions={{}} unavailable={false} saveAction={noop} openAction={noop}/>);
    assert.doesNotMatch(html,/<form|type="submit"/);assert.match(html,/Read-only/);
  }
  const unavailable=renderToStaticMarkup(<PickemWeekSetup now={Date.parse("2026-09-30T20:00:00Z")} week={7} games={games} revisions={{}} unavailable={true} saveAction={noop} openAction={noop}/>);
  assert.doesNotMatch(unavailable,/<form/);
});

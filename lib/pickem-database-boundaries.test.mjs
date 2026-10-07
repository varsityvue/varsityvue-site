import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Execute repository PL/pgSQL unchanged in an isolated PostgreSQL engine.
// This focused fixture is not a substitute for full Supabase RLS/concurrency tests.
const cashMigration = readFileSync(new URL("../supabase/migrations/20260926051734_pickem_week6_cash_entry.sql", import.meta.url), "utf8");
function functionSql(name) {
  const escaped = name.replaceAll(".", "\\.");
  const match = cashMigration.match(new RegExp(`create (?:or replace )?function ${escaped}\\([\\s\\S]*?\\$\\$;`, "i"));
  assert.ok(match, `Missing authoritative function ${name}`);
  return match[0];
}
const week = "00000000-0000-4000-8000-000000000007";
const entrant = "00000000-0000-4000-8000-000000000101";
const other = "00000000-0000-4000-8000-000000000102";
const admin = "00000000-0000-4000-8000-000000000107";
const games = [
  ["albany", "stamford"], ["anson", "cisco"], ["comanche", "millsap"],
  ["crawford", "hubbard"], ["de-leon", "hawley"], ["eastland", "clifton"],
  ["lampasas", "stephenville"], ["merkel", "jacksboro"], ["miles", "winters"], ["rio-vista", "tolar"],
].map(([away, home], i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  gameId: `${away}-at-${home}-2026-week-7`, away, home,
}));

async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create schema private; create schema auth;
    create type public.pickem_week_status as enum ('draft','open','closed');
    create type public.user_role as enum ('admin','moderator','member');
    create table public.profiles (id uuid primary key,display_name text,username text);
    insert into public.profiles (id) values ('${entrant}'),('${other}'),('${admin}');
    create table public.user_roles (user_id uuid,role public.user_role);
    insert into public.user_roles values ('${admin}','admin');
    create function auth.uid() returns uuid language sql as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function private.is_active_member(id uuid) returns boolean language sql as $$
      select exists(select 1 from public.profiles where profiles.id=$1) $$;
    create function private.has_role(wanted public.user_role) returns boolean language sql as $$
      select exists(select 1 from public.user_roles where user_id=auth.uid() and role=$1) $$;
    create table public.pickem_weeks (
      id uuid primary key,season integer,week integer,status public.pickem_week_status,
      opens_at timestamptz,closes_at timestamptz,entry_deadline_at timestamptz,
      outcome_resolution_at timestamptz,tiebreaker_game_id uuid,official_rules_version text,
      official_rules_published_at timestamptz,presenting_sponsor_name text);
    create table public.pickem_games (id uuid primary key,week_id uuid,game_id text,
      lock_at timestamptz,away_school_slug text,home_school_slug text,
      result_winner_school_slug text,graded_at timestamptz);
    create table public.pickem_picks (pickem_game_id uuid,user_id uuid,picked_school_slug text,
      is_correct boolean,updated_at timestamptz default now(),primary key(pickem_game_id,user_id));
    create table public.pickem_week_tiebreakers (week_id uuid,user_id uuid,predicted_total integer,
      submitted_at timestamptz,primary key(week_id,user_id));
    create table public.pickem_contest_entries (week_id uuid,user_id uuid,status text default 'valid',
      completed_at timestamptz default clock_timestamp(),attestation_text text,
      attestation_rules_version text,entry_order bigint generated always as identity,primary key(week_id,user_id));
    create table private.pickem_contest_game_resolution (pickem_game_id uuid primary key,
      disposition text,reason text,decided_at timestamptz default clock_timestamp());
    create table private.pickem_entrant_phones (user_id uuid primary key,phone_e164 text unique);
    create table private.pickem_draft_picks (week_id uuid,user_id uuid);
    create table private.pickem_draft_predictions (week_id uuid,user_id uuid);
    create table public.game_state (game_id text primary key,status text,verified boolean,
      result_type text,away_score integer,home_score integer,official_winner_school_slug text);
  `);
  for (const name of ["private.freeze_pickem_contest_deadlines", "private.enforce_pickem_pick_lock",
    "private.enforce_week_tiebreaker_lock", "public.submit_pickem_contest_entry",
    "private.grade_pickem_from_verified_final", "public.admin_resolve_pickem_contest_week"]) {
    await db.exec(functionSql(name));
  }
  await db.exec(readFileSync(new URL("../supabase/migrations/20260927001250_exclude_pickem_operator_account.sql", import.meta.url), "utf8"));
  const reconciliation = readFileSync(new URL("../supabase/migrations/20260926193000_pickem_correction_claim_reconciliation.sql", import.meta.url), "utf8");
  const standings = reconciliation.match(/create or replace view public\.pickem_week_standings as[\s\S]*?;/);
  assert.ok(standings);
  await db.exec(standings[0]);
  await db.exec(`
    create trigger freeze_pickem_contest_deadlines before insert or update on public.pickem_weeks
      for each row execute function private.freeze_pickem_contest_deadlines();
    create trigger pickem_pick_lock_guard before insert or update on public.pickem_picks
      for each row execute function private.enforce_pickem_pick_lock();
    create trigger pickem_week_tiebreaker_lock before insert or update on public.pickem_week_tiebreakers
      for each row execute function private.enforce_week_tiebreaker_lock();
    create trigger verified_final_grades_pickem after insert or update on public.game_state
      for each row execute function private.grade_pickem_from_verified_final();
    insert into public.pickem_weeks values ('${week}',2099,7,'draft',now()-interval '1 hour',
      '2099-10-10T00:00:01Z',null,null,'${games[0].id}','isolated-test',now(),'Gilder Storage');
  `);
  for (const game of games) await db.query(`insert into public.pickem_games
    (id,week_id,game_id,lock_at,away_school_slug,home_school_slug) values ($1,$2,$3,'2099-10-10T00:00:00Z',$4,$5)`,
    [game.id,week,game.gameId,game.away,game.home]);
  await db.exec(`update public.pickem_weeks set status='open' where id='${week}'`);
  // Only disposable fixture times are compressed; the actual function bodies stay unchanged.
  await db.exec("alter table public.pickem_weeks disable trigger freeze_pickem_contest_deadlines");
  return db;
}
async function enter(db, user = entrant) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  return (await db.query("select public.submit_pickem_contest_entry($1,$2,58,$3::jsonb,true) as completed",
    [week,user === entrant ? "2545550101" : "2545550102",JSON.stringify(Object.fromEntries(games.map(g=>[g.id,g.away])))] )).rows[0].completed;
}

test("database freezes earliest entry deadline and includes the whole Monday minute", async () => {
  const db = await fixture();
  try {
    const result = await db.query(`select
      entry_deadline_at=(select min(lock_at) from public.pickem_games) as frozen,
      ('2026-10-12T23:59:59.999999-05:00'::timestamptz <
        ((date_trunc('week','2026-10-09T19:00:00-05:00'::timestamptz at time zone 'America/Chicago')+interval '8 days') at time zone 'America/Chicago')) as monday_included,
      ((date_trunc('week','2026-10-09T19:00:00-05:00'::timestamptz at time zone 'America/Chicago')+interval '8 days') at time zone 'America/Chicago')='2026-10-13T05:00:00Z'::timestamptz as cutoff_correct
      from public.pickem_weeks`);
    assert.deepEqual(result.rows[0], {frozen:true,monday_included:true,cutoff_correct:true});
  } finally { await db.close(); }
});

test("late new entries fail; existing entrants edit only unlocked games without changing entry time", async () => {
  const db = await fixture();
  try {
    const completed = await enter(db);
    await db.exec(`update public.pickem_weeks set entry_deadline_at=clock_timestamp()-interval '1 second';
      update public.pickem_games set lock_at=clock_timestamp()-interval '1 second' where id='${games[0].id}'`);
    await assert.rejects(enter(db,other), /New entries closed/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [entrant]);
    const submit = (prediction,picks) => db.query("select public.submit_pickem_contest_entry($1,null,$2,$3::jsonb,false) as completed",
      [week,prediction,JSON.stringify(picks)]);
    const edited = await submit(58,{[games[1].id]:games[1].home});
    assert.equal(edited.rows[0].completed.getTime(), completed.getTime());
    await assert.rejects(submit(59,{[games[1].id]:games[1].away}), /prediction is locked/);
    await assert.rejects(submit(58,{[games[0].id]:games[0].home}), /game is locked/);
    const picks = await db.query("select picked_school_slug from public.pickem_picks where pickem_game_id=$1", [games[1].id]);
    assert.equal(picks.rows[0].picked_school_slug,games[1].home);
    assert.equal((await db.query("select count(*)::int as n from public.pickem_contest_entries")).rows[0].n,1);
  } finally { await db.close(); }
});

test("only verified played/forfeit winners grade; missing, tied and cancelled results VOID without deleting entries", async () => {
  const db = await fixture();
  try {
    await enter(db);
    const original = (await db.query("select * from public.pickem_contest_entries")).rows;
    const final = (i,status,verified,resultType,awayScore,homeScore,winner=null) => db.query(`insert into public.game_state
      values ($1,$2,$3,$4,$5,$6,$7) on conflict (game_id) do update set status=excluded.status,
      verified=excluded.verified,result_type=excluded.result_type,away_score=excluded.away_score,
      home_score=excluded.home_score,official_winner_school_slug=excluded.official_winner_school_slug`,
      [games[i].gameId,status,verified,resultType,awayScore,homeScore,winner]);
    await final(0,"final",true,"played",49,42);
    await final(1,"final",true,"forfeit",null,null,games[1].away);
    await final(2,"final",false,null,21,7);
    await final(3,"final",true,"tie",14,14);
    await final(4,"cancelled",true,null,null,null);
    await final(5,"final",true,"no_contest",null,null);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
    await assert.rejects(db.query("select public.admin_resolve_pickem_contest_week($1)",[week]), /window remains open/);
    await db.exec("update public.pickem_weeks set outcome_resolution_at=clock_timestamp()-interval '1 second'");
    assert.equal((await db.query("select public.admin_resolve_pickem_contest_week($1) as n",[week])).rows[0].n,5);
    assert.equal((await db.query("select public.admin_resolve_pickem_contest_week($1) as n",[week])).rows[0].n,0);
    await final(2,"final",true,"played",21,7); // A late final cannot revive a deadline VOID.
    await final(0,"final",true,"played",42,49); // Timely final remains correctable.
    const grades = (await db.query("select is_correct from public.pickem_picks order by pickem_game_id")).rows.map(r=>r.is_correct);
    assert.deepEqual(grades,[false,true,null,null,null,null,null,null,null,null]);
    assert.deepEqual((await db.query("select * from public.pickem_contest_entries")).rows,original);
    assert.equal((await db.query("select count(*)::int as n from public.pickem_picks")).rows[0].n,10);
    assert.equal((await db.query("select away_score from public.game_state where game_id=$1",[games[2].gameId])).rows[0].away_score,21);
  } finally { await db.close(); }
});

test("VOID Albany–Stamford skips points distance and retains original entry order", async () => {
  const db = await fixture();
  try {
    await enter(db);
    await enter(db,other);
    await db.query("insert into public.game_state values ($1,'final',true,'played',21,7,null)",[games[1].gameId]);
    await db.exec(`update public.pickem_weeks set outcome_resolution_at=clock_timestamp()-interval '1 second',
      closes_at=clock_timestamp()-interval '1 second';
      update public.pickem_games set lock_at=clock_timestamp()-interval '1 second'`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
    await db.query("select public.admin_resolve_pickem_contest_week($1)",[week]);
    const standings = (await db.query("select user_id,correct_picks,graded_picks,actual_total,distance,weekly_rank from public.pickem_week_standings order by weekly_rank")).rows;
    assert.deepEqual(standings.map(r=>[r.user_id,r.correct_picks,r.graded_picks,r.actual_total,r.distance,Number(r.weekly_rank)]),
      [[entrant,1,1,null,null,1],[other,1,1,null,null,2]]);
  } finally { await db.close(); }
});

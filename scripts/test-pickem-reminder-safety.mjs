import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Minimal isolated PostgreSQL fixture. Repository migration SQL executes unchanged.
// Auth/config/digest dependencies are fixture stubs; this does not prove Supabase RLS or inbox delivery.
export const fixtureSql = `
create role anon; create role authenticated;
create schema private; create schema auth; create schema extensions;
create function extensions.digest(text,text) returns bytea language sql immutable as $$select convert_to($1,'UTF8')$$;
create function private.product_email_worker_authorized(text) returns boolean language sql as $$select $1='synthetic-secret'$$;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create table public.member_account_status(user_id uuid primary key,status text);
create table public.member_notification_preferences(user_id uuid primary key,pickem_reminder_email boolean);
create table public.user_roles(user_id uuid,role text);
create table public.pickem_weeks(id uuid primary key,season integer,week integer,title text,status text,
 opens_at timestamptz,closes_at timestamptz,entry_deadline_at timestamptz,tiebreaker_game_id uuid);
create table public.pickem_games(id uuid primary key,week_id uuid,lock_at timestamptz,away_school_slug text,home_school_slug text);
create table public.pickem_picks(pickem_game_id uuid,user_id uuid,picked_school_slug text);
create table private.pickem_draft_picks(week_id uuid,pickem_game_id uuid,user_id uuid,picked_school_slug text);
create table private.pickem_draft_predictions(week_id uuid,user_id uuid,predicted_total integer);
create table private.pickem_entrant_phones(user_id uuid,phone_e164 text);
create table public.pickem_contest_entries(week_id uuid,user_id uuid,status text);
create table private.pickem_contest_game_resolution(pickem_game_id uuid,disposition text);
create table private.product_email_worker_config(singleton boolean,max_provider_acceptances_per_24h integer);
insert into private.product_email_worker_config values(true,100);
create table private.product_email_deliveries(provider_accepted_at timestamptz);
create table private.product_email_suppressions(email_sha256 text);
create table private.pickem_reminder_deliveries(
 id uuid primary key default gen_random_uuid(),week_id uuid,recipient_user_id uuid,recipient_email text,
 status text default 'pending',attempt_count integer default 0,next_attempt_at timestamptz default now(),
 first_attempt_at timestamptz,claimed_at timestamptz,claim_token uuid,provider_message_id text,provider_accepted_at timestamptz,
 cancelled_at timestamptz,last_error text,created_at timestamptz default now(),updated_at timestamptz default now(),
 unique(week_id,recipient_user_id));
`;
const week = '10000000-0000-4000-8000-000000000001';
const user = '20000000-0000-4000-8000-000000000001';
const game1 = '30000000-0000-4000-8000-000000000001';
const game2 = '30000000-0000-4000-8000-000000000002';
const sql = readFileSync(new URL('../supabase/migrations/20261018184856_pickem_reminder_entry_safety.sql', import.meta.url),'utf8');
assert.ok(sql.length > 100,'Repair migration must exist');
const deliverySql = readFileSync(new URL('../supabase/migrations/20260920160025_pickem_email_reminder_delivery.sql',import.meta.url),'utf8');
const failAccept = deliverySql.slice(0,deliverySql.indexOf('create or replace function public.unsubscribe_member_product_email'));
if (process.argv.includes('--remote-sql')) {
  // Namespace substitution avoids touching existing isolated-project objects.
  const namespaced = value => value.replaceAll('public.', 'vv_reminder_test_public.').replaceAll('private.', 'vv_reminder_test_private.').replaceAll('auth.', 'vv_reminder_test_auth.').replaceAll('extensions.', 'vv_reminder_test_extensions.');
  const setup = fixtureSql.replace('create role anon; create role authenticated;', '').replace('create schema private; create schema auth; create schema extensions;', 'create schema vv_reminder_test_public; create schema vv_reminder_test_private; create schema vv_reminder_test_auth; create schema vv_reminder_test_extensions;');
  const migration = sql.replace(/^begin;/, '').replace(/commit;\s*$/, '');
  const scenarios = `
insert into auth.users values('${user}','synthetic@example.invalid',now());
insert into public.member_account_status values('${user}','active');
insert into public.member_notification_preferences values('${user}',true);
insert into public.pickem_weeks values('${week}',2026,9,'Synthetic Week','open',now()-interval '1 day',now()+interval '3 days',now()+interval '4 hours','${game1}');
insert into public.pickem_games values('${game1}','${week}',now()+interval '4 hours','away1','home1'),('${game2}','${week}',now()+interval '1 day','away2','home2');
do $$declare n integer; s text; c record; begin
 select entry_state into s from private.pickem_reminder_progress('${week}','${user}'); if s<>'none' then raise exception 'none state'; end if;
 insert into private.pickem_draft_picks values('${week}','${game1}','${user}','away1');
 select entry_state into s from private.pickem_reminder_progress('${week}','${user}'); if s<>'partial' then raise exception 'partial state'; end if;
 insert into private.pickem_reminder_deliveries(week_id,recipient_user_id,recipient_email) values('${week}','${user}','synthetic@example.invalid');
 select * into c from public.claim_pickem_email_reminder('synthetic-secret'); if c.picked_count<>1 or c.game_count<>2 then raise exception 'partial claim'; end if;
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>0 then raise exception 'duplicate claim'; end if;
 if not public.authorize_pickem_email_reminder_send('synthetic-secret',c.delivery_id,c.claim_token) then raise exception 'authorize active'; end if;
 perform public.fail_pickem_email_reminder('synthetic-secret',c.delivery_id,c.claim_token,'Synthetic failure',true);
 update private.pickem_reminder_deliveries set next_attempt_at=now();
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>1 then raise exception 'retry'; end if;
 insert into private.pickem_draft_picks values('${week}','${game2}','${user}','home2');
 select entry_state into s from private.pickem_reminder_progress('${week}','${user}'); if s<>'complete_draft' then raise exception 'complete draft'; end if;
 insert into public.pickem_contest_entries values('${week}','${user}','valid');
 update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now();
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>0 then raise exception 'accepted claim'; end if;
 update public.pickem_contest_entries set status='disqualified';
 select entry_state into s from private.pickem_reminder_progress('${week}','${user}'); if s<>'disqualified' then raise exception 'disqualified'; end if;
 delete from public.pickem_contest_entries;
 update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now();
 select * into c from public.claim_pickem_email_reminder('synthetic-secret');
 update public.pickem_weeks set entry_deadline_at=clock_timestamp();
 if public.authorize_pickem_email_reminder_send('synthetic-secret',c.delivery_id,c.claim_token) then raise exception 'authorize deadline'; end if;
 update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now();
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>0 then raise exception 'deadline claim'; end if;
 select public.enqueue_pickem_email_reminders('synthetic-secret') into n; if n<>0 then raise exception 'deadline enqueue'; end if;
 update public.pickem_weeks set entry_deadline_at=now()+interval '4 hours';
 update public.member_notification_preferences set pickem_reminder_email=false;
 update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now();
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>0 then raise exception 'unsubscribe'; end if;
 update public.member_notification_preferences set pickem_reminder_email=true;
 update public.member_account_status set status='suspended';
 update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now();
 select count(*) into n from public.claim_pickem_email_reminder('synthetic-secret'); if n<>0 then raise exception 'suspended'; end if;
 update public.member_account_status set status='active';
 insert into private.pickem_contest_game_resolution values('${game2}','void');
 select game_count into n from private.pickem_reminder_progress('${week}','${user}'); if n<>1 then raise exception 'void'; end if;
 begin perform public.claim_pickem_email_reminder('wrong-secret'); raise exception 'wrong secret succeeded'; exception when others then if sqlerrm='wrong secret succeeded' then raise; end if; end;
end $$;
select 'PASS: 16 isolated PostgreSQL17 fixture assertions; namespace-substituted SQL, stub auth/config/digest; rolled back' as result;
`;
  console.log('begin;\n' + namespaced(setup + failAccept + migration + scenarios) + '\nrollback;');
  process.exit(0);
}
const db = new PGlite();
await db.exec(fixtureSql);
await db.exec(failAccept);
await db.exec(sql);
let checks = 0;
async function query(s) { return (await db.query(s)).rows; }
async function state(expected) {
 const rows = await query(`select entry_state as state from private.pickem_reminder_progress('${week}','${user}')`);
 assert.equal(rows[0].state,expected); checks++;
}
async function claim() { return query("select * from public.claim_pickem_email_reminder('synthetic-secret')"); }
async function reset() {
 await db.exec(`truncate auth.users,public.member_account_status,public.member_notification_preferences,public.user_roles,
 public.pickem_weeks,public.pickem_games,public.pickem_picks,private.pickem_draft_picks,private.pickem_draft_predictions,
 private.pickem_entrant_phones,public.pickem_contest_entries,private.pickem_contest_game_resolution,
 private.product_email_suppressions,private.pickem_reminder_deliveries;
 insert into auth.users values('${user}','synthetic@example.invalid',now());
 insert into public.member_account_status values('${user}','active');
 insert into public.member_notification_preferences values('${user}',true);
 insert into public.pickem_weeks values('${week}',2026,9,'Synthetic Week','open',now()-interval '1 day',now()+interval '3 days',now()+interval '4 hours','${game1}');
 insert into public.pickem_games values('${game1}','${week}',now()+interval '4 hours','away1','home1'),('${game2}','${week}',now()+interval '1 day','away2','home2');`);
}
async function queued() {
 await db.exec(`insert into private.pickem_reminder_deliveries(week_id,recipient_user_id,recipient_email) values('${week}','${user}','synthetic@example.invalid')`);
}
async function picks(complete=false) {
 await db.exec(`insert into private.pickem_draft_picks values('${week}','${game1}','${user}','away1')${complete?`,('${week}','${game2}','${user}','home2')`:''}`);
}
await reset(); await state('none');
await picks(); await state('partial'); await queued();
let rows = await claim(); assert.equal(rows.length,1); assert.equal(rows[0].picked_count,1); assert.equal(rows[0].game_count,2); checks++;
assert.equal((await claim()).length,0); checks++;
await reset(); await picks(true); await state('complete_draft'); await queued();
rows=await claim(); assert.equal(rows[0].picked_count,2); assert.equal(rows[0].game_count,2); checks++;
// Missing phone, prediction and attestation cannot be mistaken for accepted entry.
await state('complete_draft');
await db.exec(`insert into public.pickem_contest_entries values('${week}','${user}','valid')`); await state('accepted');
await db.exec("update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now()"); assert.equal((await claim()).length,0); checks++;
await reset(); await db.exec(`insert into public.pickem_contest_entries values('${week}','${user}','disqualified')`); await state('disqualified'); await queued(); assert.equal((await claim()).length,0); checks++;
for(const change of [
 "update public.pickem_weeks set entry_deadline_at=clock_timestamp()-interval '1 second'",
 "update public.pickem_weeks set entry_deadline_at=clock_timestamp()",
 "update public.pickem_weeks set status='closed'",
 "update public.pickem_weeks set entry_deadline_at=null",
]) {
 await reset(); await queued(); await db.exec(change); await state('closed'); assert.equal((await claim()).length,0); checks++;
}
for(const change of [
 "update public.member_notification_preferences set pickem_reminder_email=false",
 "update public.member_account_status set status='suspended'",
 `insert into public.user_roles values('${user}','admin')`,
 `insert into public.user_roles values('${user}','moderator')`,
 "update auth.users set email_confirmed_at=null",
 "insert into private.product_email_suppressions select encode(extensions.digest('synthetic@example.invalid','sha256'),'hex')",
]) {
 await reset(); await queued(); await db.exec(change); assert.equal((await claim()).length,0); checks++;
}
await reset(); await picks(); await db.exec(`insert into private.pickem_contest_game_resolution values('${game2}','void')`); await state('complete_draft'); await queued(); rows=await claim(); assert.equal(rows[0].game_count,1); checks++;
await reset(); await db.exec(`insert into private.pickem_contest_game_resolution values('${game1}','void'),('${game2}','void')`); await state('closed'); await queued(); assert.equal((await claim()).length,0); checks++;
await reset(); await picks(true); await db.exec("update private.pickem_draft_picks set picked_school_slug='invalid'"); await state('none');
await reset(); await queued(); rows=await claim(); const first=rows[0];
rows=await query(`select public.fail_pickem_email_reminder('synthetic-secret','${first.delivery_id}','${first.claim_token}','Synthetic provider rejection',true) as status`); assert.equal(rows[0].status,'retryable'); checks++;
await db.exec("update private.pickem_reminder_deliveries set next_attempt_at=now()"); rows=await claim(); assert.equal(rows.length,1); assert.notEqual(rows[0].claim_token,first.claim_token); checks++;
rows=await query(`select public.accept_pickem_email_reminder('synthetic-secret','${first.delivery_id}','${first.claim_token}','fake-provider-id') as accepted`); assert.equal(rows[0].accepted,false); checks++;
await db.exec("update private.pickem_reminder_deliveries set status='retryable',next_attempt_at=now(); update public.pickem_weeks set entry_deadline_at=clock_timestamp()-interval '1 second'"); assert.equal((await claim()).length,0); checks++;
await assert.rejects(()=>claimBadSecret()); checks++;
async function claimBadSecret(){return query("select * from public.claim_pickem_email_reminder('wrong-secret')");}
// Queue window/dedup and a deadline reached after claim must remain safe.
await reset();
const daytime = Number((await query("select extract(hour from now() at time zone 'America/Chicago') as hour"))[0].hour) >= 8;
rows = await query("select public.enqueue_pickem_email_reminders('synthetic-secret') as count");
assert.equal(rows[0].count,daytime ? 1 : 0); checks++;
rows = await query("select public.enqueue_pickem_email_reminders('synthetic-secret') as count"); assert.equal(rows[0].count,0); checks++;
await db.exec("update public.pickem_weeks set entry_deadline_at=clock_timestamp()");
rows = await query("select public.enqueue_pickem_email_reminders('synthetic-secret') as count"); assert.equal(rows[0].count,0); checks++;
for (const change of [
 "update public.pickem_weeks set entry_deadline_at=clock_timestamp()",
 `insert into public.pickem_contest_entries values('${week}','${user}','valid')`,
 "update public.member_notification_preferences set pickem_reminder_email=false",
 "update public.member_account_status set status='suspended'",
 "update private.pickem_reminder_deliveries set claimed_at=now()-interval '11 minutes'",
]) {
 await reset(); await queued(); const d=(await claim())[0];
 rows=await query(`select public.authorize_pickem_email_reminder_send('synthetic-secret','${d.delivery_id}','${d.claim_token}') as allowed`); assert.equal(rows[0].allowed,true); checks++;
 await db.exec(change);
 rows=await query(`select public.authorize_pickem_email_reminder_send('synthetic-secret','${d.delivery_id}','${d.claim_token}') as allowed`); assert.equal(rows[0].allowed,false); checks++;
}
rows=await query("select has_function_privilege('anon','public.authorize_pickem_email_reminder_send(text,uuid,uuid)','execute') as allowed,has_function_privilege('authenticated','private.pickem_reminder_progress(uuid,uuid)','execute') as private_allowed"); assert.equal(rows[0].allowed,true); assert.equal(rows[0].private_allowed,false); checks++;
console.log(`PASS: ${checks} isolated PostgreSQL reminder safety assertions. No provider calls or real emails.`);
await db.close();

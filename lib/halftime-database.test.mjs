import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const baseline=JSON.parse(readFileSync(new URL('../supabase/tests/week8_p0_baseline.json',import.meta.url),'utf8'));
const previous=baseline.find(f=>f.signature.startsWith('private.publish_trusted_score(')).definition.replaceAll("errcode='40001'", "errcode = 'PT409'").replaceAll("errcode = '40001'", "errcode = 'PT409'");
const review=baseline.find(f=>f.signature==='public.apply_score_submission_review()').definition.replace("errcode = 'P0001', message = 'Game changed — review the current score.'", "errcode = 'PT409', message = 'Game changed — review the current score.'");
const migration=readFileSync(new URL('../supabase/migrations/20261014175756_score_halftime.sql',import.meta.url),'utf8');
// Focused local publication fixture. Auth identity and publisher corroboration
// are test scaffolding; this does not reproduce hosted Auth/PostgREST.
async function fixture(){
  const db=new PGlite();
  await db.exec(`create schema private;create schema auth;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.actor',true),'')::uuid$$;
    create function private.can_moderate_scores() returns boolean language sql as $$select true$$;
    create function private.assigned_scorekeeper_authority(text) returns jsonb language sql as $$select '{}'::jsonb$$;
    create table public.game_state(game_id text primary key,status text,home_score integer,away_score integer,period text,clock text,source_submission_id uuid,verified boolean,verified_at timestamptz,updated_by uuid,result_type text,official_winner_school_slug text,updated_at timestamptz default now(),score_revision bigint default 0);
    create table public.score_submissions(id uuid primary key default gen_random_uuid(),game_id text,submitted_by uuid,home_score integer,away_score integer,game_status text,period text,clock text,source_note text,status text default 'pending',reviewed_by uuid,reviewed_at timestamptz,review_note text,expected_state_updated_at timestamptz,expected_state_revision bigint,expected_state_absent boolean);
    create table public.score_submission_events(submission_id uuid,event_type text,actor_id uuid,note text,payload jsonb);
    create function public.test_corroboration() returns trigger language plpgsql as $$begin if new.event_type='approved' then new.payload:=new.payload||'{"publisher_bound_v1":true}'::jsonb;end if;return new;end$$;
    create trigger test_corroboration before insert on public.score_submission_events for each row execute function public.test_corroboration();
    set test.actor='00000000-0000-4000-8000-000000000001';
    insert into public.game_state(game_id,status,home_score,away_score,period,clock,verified,updated_at,score_revision) values('fixture','live',14,21,'2nd','04:00',true,'2026-10-16T23:59:00Z',7);
  `);
  await db.exec(previous+';'+review+';create trigger review before update on public.score_submissions for each row execute function public.apply_score_submission_review();');
  await db.exec(migration);
  return db;
}
const call=(period='Halftime',timestamp='2026-10-16T23:59:00Z')=>`select private.publish_trusted_score('fixture',14,21,'live','${period}','04:00',null,'${timestamp}',7,false,true,false)`;
test('halftime migration only extends period validation and clears its clock',()=>{
  const expected=previous.replace('^(1st|2nd|3rd|4th|OT|OT[2-9][0-9]*)$','^(1st|2nd|Halftime|3rd|4th|OT|OT[2-9][0-9]*)$').replace('Choose a valid quarter or overtime period.','Choose a valid quarter, halftime, or overtime period.').replace(' perform pg_advisory_xact_lock(hashtextextended(p_game_id,7319));'," -- Halftime remains LIVE, with no running clock.\n if p_game_status='live' and btrim(p_period)='Halftime' then p_clock := null; end if;\n perform pg_advisory_xact_lock(hashtextextended(p_game_id,7319));");
  assert.ok(migration.endsWith(expected+';\n'));
  assert.doesNotMatch(migration,/\b(grant|revoke|drop|alter table)\b/i);
  assert.match(migration,/a5274d8b7d9ed5b8e047a7c22944d2f8/);
});
test('actual publication function accepts halftime, stays LIVE and drops clock',async()=>{
  const db=await fixture();try{await db.exec(call());const g=(await db.query('select * from public.game_state')).rows[0];assert.equal(g.status,'live');assert.equal(g.period,'Halftime');assert.equal(g.clock,null);assert.equal(g.home_score,14);assert.equal(g.away_score,21);assert.equal((await db.query("select count(*) n from public.score_submissions where status='approved'")).rows[0].n,1);}finally{await db.close();}
});
test('quarter clock remains; stale halftime and anonymous publication fail closed',async()=>{
  const db=await fixture();try{
    await assert.rejects(db.exec(call('Halftime','2026-10-16T23:58:00Z')),e=>e.code==='PT409');
    assert.equal((await db.query('select count(*) n from public.score_submissions')).rows[0].n,0);
    await db.exec("set test.actor=''");await assert.rejects(db.exec(call()),e=>e.code==='42501');
    await db.exec("set test.actor='00000000-0000-4000-8000-000000000001'");
    await db.exec(call('3rd'));assert.equal((await db.query('select clock from public.game_state')).rows[0].clock,'04:00');
  }finally{await db.close();}
});

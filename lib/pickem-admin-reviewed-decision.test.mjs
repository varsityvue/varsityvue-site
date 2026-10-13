import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const original=readFileSync(new URL('../supabase/migrations/20260926193000_pickem_correction_claim_reconciliation.sql',import.meta.url),'utf8').match(/create or replace function public.admin_decide_pickem_winner_claim\([\s\S]*?\$\$;/)[0];
const wrapper=readFileSync(new URL('../supabase/migrations/20261012180000_pickem_candidate_bound_decision.sql',import.meta.url),'utf8');
const week='00000000-0000-4000-8000-000000000007',winner='00000000-0000-4000-8000-000000000001',next='00000000-0000-4000-8000-000000000002';
async function fixture(){const db=new PGlite();await db.exec(`create schema private; create schema auth; create role anon;create role authenticated;
create type public.user_role as enum('admin','member');
create function auth.uid() returns uuid language sql as $$select '${winner}'::uuid$$;
create function private.is_active_member(uuid) returns boolean language sql as $$select true$$;
create function private.has_role(public.user_role) returns boolean language sql as $$select current_setting('test.admin',true)='yes'$$;
create table private.pickem_contest_finalizations(week_id uuid primary key,generation integer,state text,winner_user_id uuid,finalized_at timestamptz);
create table private.pickem_winner_claims(week_id uuid,user_id uuid,generation integer,previous_rank integer,actor_id uuid,decision text default 'pending',respond_by timestamptz,responded_at timestamptz,decision_at timestamptz,reason text,primary key(week_id,user_id,generation));
create table public.pickem_contest_entries(week_id uuid,user_id uuid,status text,disqualification_reason text,entry_order integer);
create view public.pickem_week_standings as select week_id,user_id,row_number() over(order by entry_order) as weekly_rank from public.pickem_contest_entries where status='valid';
create function public.admin_pickem_provisional_winner_contact(uuid) returns table(user_id uuid) language sql as $$select winner_user_id from private.pickem_contest_finalizations where week_id=$1 and state='current'$$;
insert into private.pickem_contest_finalizations values('${week}',1,'current','${winner}',now());
insert into public.pickem_contest_entries values('${week}','${winner}','valid',null,1),('${week}','${next}','valid',null,2);
set test.admin='yes';`);await db.exec(original);await db.exec(wrapper);return db;}
function call(candidate=winner,generation=1,decision='ineligible'){return `select public.admin_decide_pickem_winner_claim_reviewed('${week}','${decision}','reviewed','${candidate}',${generation})`;}
test('stale disqualification retry cannot disqualify replacement or add audit record',async()=>{const db=await fixture();try{await db.exec(call());await assert.rejects(db.exec(call()),/reviewed candidate changed/);const {rows}=await db.query('select user_id,status from public.pickem_contest_entries order by entry_order');assert.equal(rows[0].status,'disqualified');assert.equal(rows[1].status,'valid');assert.equal((await db.query('select * from private.pickem_winner_claims')).rows.length,1);}finally{await db.close();}});
test('authorization and generation remain fail closed',async()=>{const db=await fixture();try{await db.exec("set test.admin='no'");await assert.rejects(db.exec(call()),/Administrator access/);await db.exec("set test.admin='yes'");await assert.rejects(db.exec(call(winner,2)),/reviewed candidate changed/);assert.equal((await db.query('select * from private.pickem_winner_claims')).rows.length,0);}finally{await db.close();}});
test('confirmation still requires notice and timely response; terminal retry cannot write again',async()=>{const db=await fixture();try{await assert.rejects(db.exec(call(winner,1,'confirmed')),/Record notification/);await db.exec(`insert into private.pickem_winner_claims(week_id,user_id,generation,respond_by,responded_at) values('${week}','${winner}',1,now()+interval '72 hours',now())`);await db.exec(call(winner,1,'confirmed'));await assert.rejects(db.exec(call(winner,1,'confirmed')),/already has a final/);assert.equal((await db.query('select decision from private.pickem_winner_claims')).rows[0].decision,'confirmed');}finally{await db.close();}});

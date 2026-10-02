-- Disposable database only. All fixtures and test changes roll back.
begin;
create temp table attribution_actors(label text primary key,id uuid) on commit drop;
insert into attribution_actors values
 ('A','00000000-0000-4000-8000-000000000801'),
 ('B','00000000-0000-4000-8000-000000000802'),
 ('member','00000000-0000-4000-8000-000000000803');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 label||'-attribution@example.invalid','!',now(),'{}',jsonb_build_object('display_name','Private fixture'),now(),now()
from attribution_actors;
insert into public.user_roles(user_id,role)
select id,case label when 'A' then 'admin'::public.user_role else 'moderator'::public.user_role end
from attribution_actors where label in ('A','B');
update public.profiles set username='publisher_a' where id=(select id from attribution_actors where label='A');
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug)
select '__attribution_'||name||'__','attr-away','attr-home'
from unnest(array['live','pending','rejected','approved','final','outcome','forfeit','legacy','deleted']) name;
grant select on attribution_actors to authenticated;
create function pg_temp.assert_attribution(p_game text,p_type text,p_username text default null)
returns void language plpgsql as $$ declare r record; begin
 select * into r from public.public_score_states() where game_id=p_game;
 if not found or r.attribution_type is distinct from p_type
 or r.attribution_username is distinct from p_username then
   raise exception 'Attribution assertion failed for %: expected %/%; got %/%',p_game,p_type,p_username,r.attribution_type,r.attribution_username;
 end if;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='A'),true);
set local role authenticated;
select public.submit_trusted_score_update('__attribution_live__',0,7,'live','1st','08:00',null,null,null,true);
reset role;
select pg_temp.assert_attribution('__attribution_live__','publisher','publisher_a');
create temp table attribution_stale as select updated_at,score_revision from public.game_state where game_id='__attribution_live__';
grant select on attribution_stale to authenticated;
-- B has no username: repeated publication changes publisher, not the reporter.
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='B'),true);
set local role authenticated;
select public.submit_trusted_score_update('__attribution_live__',0,14,'live','2nd','04:00',null,
 (select updated_at from attribution_stale),(select score_revision from attribution_stale),false);
reset role;
select pg_temp.assert_attribution('__attribution_live__','publisher');
-- Rejected stale A must not replace B's winning state/byline.
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='A'),true);
set local role authenticated;
do $$ begin
 begin
 perform public.submit_trusted_score_update('__attribution_live__',7,0,'live','1st','07:00',null,
 (select updated_at from attribution_stale),(select score_revision from attribution_stale),false);
 raise exception 'Stale update unexpectedly succeeded';
 exception when serialization_failure then null; end;
end $$;
reset role;
select pg_temp.assert_attribution('__attribution_live__','publisher');
do $$ begin if (select away_score from public.public_score_states() where game_id='__attribution_live__')<>14
 then raise exception 'Stale score changed'; end if; end $$;
-- A reviewer's current handle is resolved on each read.
update public.profiles set username='publisher_b' where id=(select id from attribution_actors where label='B');
select pg_temp.assert_attribution('__attribution_live__','publisher','publisher_b');
update public.profiles set username='renamed_publisher_b' where id=(select id from attribution_actors where label='B');
select pg_temp.assert_attribution('__attribution_live__','publisher','renamed_publisher_b');
update public.member_account_status set status='suspended',suspended_at=now()
where user_id=(select id from attribution_actors where label='B');
select pg_temp.assert_attribution('__attribution_live__','none');
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='B'),true);
set local role authenticated;
do $$ begin
 begin
 perform public.submit_trusted_score_update('__attribution_live__',0,21,'live','2nd','02:00',null,
 (select updated_at from public.game_state where game_id='__attribution_live__'),
 (select score_revision from public.game_state where game_id='__attribution_live__'),false);
 raise exception 'Suspended publisher allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.member_account_status set status='active',suspended_at=null where user_id=(select id from attribution_actors where label='B');
-- Missing account-status row is inactive, without rewriting canonical score.
delete from public.member_account_status where user_id=(select id from attribution_actors where label='B');
select pg_temp.assert_attribution('__attribution_live__','none');
insert into public.member_account_status(user_id) select id from attribution_actors where label='B';
-- Ordinary community reports remain private and pending.
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='member'),true);
set local role authenticated;
select * from public.submit_score_submission('__attribution_pending__',0,7,'live','1st','08:00',null);
select * from public.submit_score_submission('__attribution_rejected__',0,7,'live','1st','08:00',null);
select * from public.submit_score_submission('__attribution_approved__',0,7,'live','1st','08:00',null);
reset role;
do $$ begin if exists(select 1 from public.public_score_states() where game_id in ('__attribution_pending__','__attribution_rejected__','__attribution_approved__'))
 then raise exception 'Pending reporter became public'; end if; end $$;
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='A'),true);
set local role authenticated;
-- Clients cannot nominate another reviewer or score publisher.
do $$ begin
 begin
 update public.score_submissions set status='approved',reviewed_by=(select id from attribution_actors where label='B'),expected_state_absent=true
 where game_id='__attribution_approved__';
 raise exception 'Forged reviewer allowed';
 exception when insufficient_privilege then null; end;
 begin
 update public.game_state set updated_by=(select id from attribution_actors where label='B'),away_score=21 where game_id='__attribution_live__';
 raise exception 'Forged updater allowed';
 exception when insufficient_privilege then null; end;
end $$;
update public.score_submissions set status='rejected',reviewed_by=auth.uid() where game_id='__attribution_rejected__';
update public.score_submissions set status='approved',reviewed_by=auth.uid(),expected_state_absent=true where game_id='__attribution_approved__';
reset role;
select pg_temp.assert_attribution('__attribution_approved__','publisher','publisher_a');
do $$ begin if exists(select 1 from public.public_score_states() where game_id='__attribution_rejected__')
 then raise exception 'Rejected reporter became public'; end if; end $$;
-- Even own-actor direct edits lose byline if they no longer match publication.
set local role authenticated;
update public.game_state set updated_by=auth.uid(),away_score=8 where game_id='__attribution_approved__';
reset role;
select pg_temp.assert_attribution('__attribution_approved__','none');
-- Audited corrections are neutral; later trusted update replaces correction.
set local role authenticated;
select public.correct_game_score('__attribution_live__',
 (select updated_at from public.game_state where game_id='__attribution_live__'),0,
 'live',13,0,'2nd','03:00','Private correction reason');
reset role;
select pg_temp.assert_attribution('__attribution_live__','correction');
set local role authenticated;
select public.submit_trusted_score_update('__attribution_live__',0,21,'live','3rd','05:00',null,
 (select updated_at from public.game_state where game_id='__attribution_live__'),
 (select score_revision from public.game_state where game_id='__attribution_live__'),false);
select public.submit_trusted_score_update('__attribution_final__',21,28,'final',null,null,null,null,null,true);
select * from public.admin_originate_canonical_game_outcome('__attribution_outcome__',0,'no_contest',null,
 'Official fixture source','Private outcome reason','attr-away','attr-home');
reset role;
select pg_temp.assert_attribution('__attribution_live__','publisher','publisher_a');
select pg_temp.assert_attribution('__attribution_final__','verified');
select pg_temp.assert_attribution('__attribution_outcome__','outcome');
set local role authenticated;
select * from public.admin_originate_canonical_game_outcome('__attribution_forfeit__',0,'forfeit','attr-home',
 'Official fixture source','Private outcome reason','attr-away','attr-home');
reset role;
select pg_temp.assert_attribution('__attribution_forfeit__','outcome');
-- Numeric FINAL corrections via both existing audited operations stay neutral.
set local role authenticated;
select public.correct_game_score('__attribution_final__',
 (select updated_at from public.game_state where game_id='__attribution_final__'),0,
 'final',27,21,null,null,'Private final correction reason');
reset role;
select pg_temp.assert_attribution('__attribution_final__','correction');
set local role authenticated;
select * from public.admin_set_canonical_game_outcome('__attribution_final__',1,'played',null,
 'Private canonical correction reason',26,21);
reset role;
select pg_temp.assert_attribution('__attribution_final__','correction');
-- Unknown/repository/system state does not receive speculative human credit.
insert into public.game_state(game_id,status,home_score,away_score,verified,updated_by)
values('__attribution_legacy__','live',0,7,true,(select id from attribution_actors where label='A'));
select pg_temp.assert_attribution('__attribution_legacy__','none');
-- Missing/deleted profile removes personal display; public score survives.
select set_config('request.jwt.claim.sub',(select id::text from attribution_actors where label='B'),true);
set local role authenticated;
select public.submit_trusted_score_update('__attribution_deleted__',0,7,'live','1st','08:00',null,null,null,true);
reset role;
delete from public.profiles where id=(select id from attribution_actors where label='B');
select pg_temp.assert_attribution('__attribution_deleted__','none');
-- Exact public response allowlist, exercised under anonymous public authority.
set local role anon;
do $$ declare payload jsonb;key text;begin
 select to_jsonb(s) into payload from public.public_score_states() s where game_id='__attribution_live__';
 for key in select jsonb_object_keys(payload) loop
   if key not in ('game_id','status','home_score','away_score','period','clock','verified','kickoff_override',
    'result_type','official_winner_school_slug','attribution_type','attribution_username')
   then raise exception 'Unexpected public field: %',key; end if;
 end loop;
 if payload::text ~ '(00000000-0000|@example|Private|reviewed_by|updated_by|source_submission_id|actor_id|email|phone|display_name)'
 then raise exception 'Identity-bearing public payload';end if;
end $$;
reset role;
do $$ declare proc record;begin
 select p.prosecdef,p.proconfig into proc from pg_proc p where p.oid='public.public_score_states()'::regprocedure;
 if not proc.prosecdef or proc.proconfig is distinct from array['search_path=""']::text[]
 then raise exception 'RPC security definition changed';end if;
 if not has_function_privilege('anon','public.public_score_states()','execute')
 or not has_function_privilege('authenticated','public.public_score_states()','execute')
 or has_function_privilege('anon','private.corroborate_score_publication()','execute')
 then raise exception 'Unexpected public/trigger grants';end if;
end $$;
rollback;

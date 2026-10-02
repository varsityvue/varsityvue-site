-- Isolated database only. No Week 6 fixture. All identities and mutations roll back.
begin;
create temporary table setup_actors(label text primary key,id uuid) on commit drop;
insert into setup_actors values
 ('admin','00000000-0000-4000-8000-000000007701'),
 ('moderator','00000000-0000-4000-8000-000000007702'),
 ('member','00000000-0000-4000-8000-000000007703'),
 ('scorekeeper','00000000-0000-4000-8000-000000007704'),
 ('draft-member','00000000-0000-4000-8000-000000007705');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 label||'-future-setup@example.invalid','!',now(),'{}',jsonb_build_object('display_name',label||' fixture'),now(),now() from setup_actors;
insert into public.user_roles(user_id,role) select id,label::public.user_role from setup_actors where label in ('admin','moderator','scorekeeper');
create temporary table setup_catalog as select *,row_number() over(partition by week order by game_id) as position from private.pickem_admin_catalog() where week between 7 and 11;
create temporary table setup_results(test text primary key) on commit drop;
create temporary table setup_snapshots(key text primary key,value jsonb) on commit drop;
grant select on setup_actors,setup_catalog to authenticated;
grant all on setup_results,setup_snapshots to authenticated;
create function pg_temp.check_error(q text, expected text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then
   if sqlstate=expected then return; end if;
   raise exception 'Expected SQLSTATE %, got %: %',expected,sqlstate,sqlerrm;
 end;
 raise exception 'Expected rejection: %',q;
end $$;
create function pg_temp.payload(n integer,revision bigint default 0,second boolean default false) returns jsonb language sql as $$
 select jsonb_agg(jsonb_build_object('game_id',game_id,'schedule_revision',revision) order by game_id)
 from setup_catalog where week=n and position<=case when second then 2 else 1 end;
$$;
create function pg_temp.tb(n integer) returns text[] language sql as $$ select array[game_id] from setup_catalog where week=n and position=1 $$;
insert into setup_snapshots values('active',to_jsonb((select id from public.pickem_weeks where status in ('open','locked','graded') order by season desc,week desc limit 1)));
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='admin'),true);
do $$ declare n integer; w public.pickem_weeks; original jsonb; g uuid; feature_before jsonb; begin
 -- Failure after creating the week and first game must erase both.
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,11,-1,''Rollback fixture'',%L::jsonb,%L::text[])',
   jsonb_set(pg_temp.payload(11,0,true),'{1,schedule_revision}','1'),pg_temp.tb(11)),'40001');
 if exists(select 1 from public.pickem_weeks where season=2026 and week=11) then raise exception 'Partial initial draft survived'; end if;
 insert into setup_results values('initial creation rollback');
 for n in 7..11 loop
   select * into w from public.configure_pickem_draft(2026,n,-1,'Week '||n||' test draft',pg_temp.payload(n),pg_temp.tb(n));
   if w.status<>'draft' or w.opens_at is not null or w.closes_at is not null or w.entry_deadline_at is not null
     or w.configuration_revision<>1 or w.official_rules_version<>'2026-pickem-cash-v1'
     or w.official_rules_published_at<>'2026-09-27T05:08:44.209029Z'::timestamptz or w.presenting_sponsor_name<>'Gilder Storage'
     or not exists(select 1 from public.pickem_games where id=w.tiebreaker_game_id and week_id=w.id) then raise exception 'Invalid draft Week %',n; end if;
   original:=to_jsonb(w);select id into g from public.pickem_games where week_id=w.id;
   select * into w from public.configure_pickem_draft(2026,n,1,w.title,pg_temp.payload(n),pg_temp.tb(n));
   if to_jsonb(w) is distinct from original or (select id from public.pickem_games where week_id=w.id)<>g then raise exception 'No-op resave changed draft %',n; end if;
   insert into setup_results values('Week '||n||' persisted draft and no-op resave');
 end loop;
 if to_jsonb((select id from public.pickem_weeks where status in ('open','locked','graded') order by season desc,week desc limit 1)) is distinct from
   (select value from setup_snapshots where key='active') then raise exception 'Draft displaced active public contest'; end if;
 insert into setup_results values('drafts preserve active public week');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Bad'',%L::jsonb,''{}''::text[])',pg_temp.payload(8)),'22023');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Bad'',%L::jsonb,%L::text[])',pg_temp.payload(8,0,true),array(select game_id from setup_catalog where week=8 and position<=2)),'22023');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Bad'',%L::jsonb,''{foreign}''::text[])',pg_temp.payload(8)),'22023');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Bad'',%L::jsonb,%L::text[])',pg_temp.payload(8),pg_temp.tb(9)),'22023');
 insert into setup_results values('zero multiple foreign and non-slate tiebreakers rejected');
 perform pg_temp.check_error('select public.configure_pickem_draft(2026,8,1,''Bad'',''[{"game_id":"forged","schedule_revision":0}]'',''{forged}'')','22023');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Bad'',%L::jsonb,%L::text[])',jsonb_set(pg_temp.payload(8),'{0,schedule_revision}','null'),pg_temp.tb(8)),'22023');
 insert into setup_results values('invalid canonical games and missing revisions rejected');
 original:=(select to_jsonb(x) from public.internal_pickem_weeks x where season=2026 and week=8);
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Partial'',%L::jsonb,%L::text[])',
   jsonb_set(pg_temp.payload(8,0,true),'{1,schedule_revision}','1'),pg_temp.tb(8)),'40001');
 if (select to_jsonb(x) from public.internal_pickem_weeks x where season=2026 and week=8) is distinct from original
   or (select count(*) from public.pickem_games where week_id=(original->>'id')::uuid)<>1 then raise exception 'Partial edit survived'; end if;
 insert into setup_results values('existing draft rollback on intermediate schedule failure');
 select * into w from public.configure_pickem_draft(2026,8,1,'Changed title',pg_temp.payload(8),pg_temp.tb(8));
 if w.configuration_revision<>2 then raise exception 'Revision did not advance'; end if;
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,1,''Stale'',%L::jsonb,%L::text[])',pg_temp.payload(8),pg_temp.tb(8)),'40001');
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,8,-1,''Stale create'',%L::jsonb,%L::text[])',pg_temp.payload(8),pg_temp.tb(8)),'40001');
 insert into setup_results values('stale edit and stale creation rejected');
 -- Retained ID survives addition, order changes and replacement of the former tiebreaker.
 select id into g from public.pickem_games where week_id=w.id;
 select * into w from public.configure_pickem_draft(2026,8,2,w.title,pg_temp.payload(8,0,true),array[(select game_id from setup_catalog where week=8 and position=2)]);
 if not exists(select 1 from public.pickem_games where id=g and week_id=w.id) then raise exception 'Retained ID replaced'; end if;
 select * into w from public.configure_pickem_draft(2026,8,3,w.title,jsonb_build_array((pg_temp.payload(8,0,true))->1),array[(select game_id from setup_catalog where week=8 and position=2)]);
 if exists(select 1 from public.pickem_games where id=g) or (select count(*) from public.pickem_games where week_id=w.id)<>1 then raise exception 'Old tiebreaker removal failed'; end if;
 insert into setup_results values('stable retained IDs and atomic old tiebreaker removal');
end $$;
reset role;
insert into public.homepage_editorial_features(season,week,feature_type,eyebrow,headline,description,game_id,cta_label,active)
values(2026,7,'game_of_the_week','Editorial','Independent feature','Fixture only',(select game_id from setup_catalog where week=7 and position=2),'View',false);
insert into setup_snapshots select 'feature',to_jsonb(f) from public.homepage_editorial_features f where season=2026 and week=7;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='admin'),true);
do $$ declare w public.pickem_weeks; begin
 select * into w from public.configure_pickem_draft(2026,7,1,'Week 7 test draft',pg_temp.payload(7,0,true),array[(select game_id from setup_catalog where week=7 and position=2)]);
 if (select to_jsonb(f) from public.homepage_editorial_features f where season=2026 and week=7) is distinct from (select value from setup_snapshots where key='feature') then raise exception 'Contest altered editorial feature'; end if;
 update public.homepage_editorial_features set game_id=(select game_id from setup_catalog where week=7 and position=1) where season=2026 and week=7;
 if (select tiebreaker_game_id from public.pickem_weeks where id=w.id) is distinct from w.tiebreaker_game_id then raise exception 'Editorial changed contest'; end if;
 insert into setup_results values('editorial and contest independence in both directions');
end $$;
-- Incomplete approved metadata cannot be opened, even with a matching revision.
reset role;
update public.pickem_weeks set official_rules_version=null where season=2026 and week=10;
set local role authenticated;
do $$ declare w public.pickem_weeks; begin
 select * into w from public.internal_pickem_weeks where season=2026 and week=10;
 perform pg_temp.check_error(format('select public.open_pickem_draft(%L,%s,%L::jsonb)',w.id,w.configuration_revision,
   (select jsonb_object_agg(game_id,0) from public.pickem_games where week_id=w.id)),'22023');
 perform public.configure_pickem_draft(2026,10,w.configuration_revision,w.title,pg_temp.payload(10),pg_temp.tb(10));
 insert into setup_results values('opening rejects missing approved metadata and draft save restores policy');
end $$;
-- Role boundaries exercised before opening.
do $$ declare actor record; w uuid; begin
 select id into w from public.pickem_weeks where season=2026 and week=7;
 for actor in select * from setup_actors where label in ('member','scorekeeper','moderator') loop
   perform set_config('request.jwt.claim.sub',actor.id::text,true);
   if actor.label='moderator' then
     perform public.configure_pickem_draft(2026,9,1,'Moderator draft',pg_temp.payload(9),pg_temp.tb(9));
     perform public.open_pickem_draft((select id from public.pickem_weeks where season=2026 and week=9),2,
       (select jsonb_object_agg(game_id,0) from public.pickem_games where week_id=(select id from public.pickem_weeks where season=2026 and week=9)));
   else
     perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,9,1,''Denied'',%L::jsonb,%L::text[])',pg_temp.payload(9),pg_temp.tb(9)),'42501');
     perform pg_temp.check_error(format('select public.open_pickem_draft(%L,2,''{}'')',w),'42501');
   end if;
   perform pg_temp.check_error(format('select public.admin_finalize_pickem_contest_results(%L)',w),'42501');
   perform pg_temp.check_error(format('select public.admin_record_pickem_winner_notice(%L)',w),'42501');
   perform pg_temp.check_error(format('select public.admin_record_pickem_prize_paid(%L)',w),'42501');
   perform pg_temp.check_error(format('select public.admin_record_pickem_winner_response(%L)',w),'42501');
   perform pg_temp.check_error(format('select public.admin_decide_pickem_winner_claim(%L,''confirmed'',''test'')',w),'42501');
   perform pg_temp.check_error(format('select public.admin_reopen_pickem_game(%L,now()+interval ''1 day'',0,''test'')',(select id from public.pickem_games where week_id=w limit 1)),'42501');
 end loop;
 perform set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='admin'),true);
 perform pg_temp.check_error(format('update public.pickem_weeks set title=''Bypass'' where id=%L',w),'42501');
 perform pg_temp.check_error(format('delete from public.pickem_games where week_id=%L',w),'42501');
 insert into setup_results values('admin moderator member scorekeeper and dedicated-operation boundaries');
end $$;
do $$ declare w public.pickem_weeks; revisions jsonb; begin
 select * into w from public.internal_pickem_weeks where season=2026 and week=7;
 select jsonb_object_agg(game_id,0) into revisions from public.pickem_games where week_id=w.id;
 perform pg_temp.check_error(format('select public.open_pickem_draft(%L,1,%L::jsonb)',w.id,revisions),'40001');
 perform pg_temp.check_error(format('select public.open_pickem_draft(%L,%s,%L::jsonb)',w.id,w.configuration_revision,jsonb_set(revisions,array[(select game_id from public.pickem_games where week_id=w.id limit 1)],'1')),'40001');
 select * into w from public.open_pickem_draft(w.id,w.configuration_revision,revisions);
 if w.status<>'open' or w.entry_deadline_at<>(select min(lock_at) from public.pickem_games where week_id=w.id)
   or w.closes_at<>(select max(lock_at)+interval '1 second' from public.pickem_games where week_id=w.id)
   or w.outcome_resolution_at is distinct from ((date_trunc('week',w.entry_deadline_at at time zone 'America/Chicago')+interval '8 days') at time zone 'America/Chicago') then raise exception 'Opening/deadline freeze failed'; end if;
 insert into setup_results values('separate UPDATE opening freezes deadlines and preserves metadata');
 insert into setup_snapshots values('published',to_jsonb(w));
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,7,%s,''Unsafe'',%L::jsonb,%L::text[])',w.configuration_revision,pg_temp.payload(7),pg_temp.tb(7)),'55000');
 perform pg_temp.check_error(format('select public.open_pickem_draft(%L,%s,%L::jsonb)',w.id,w.configuration_revision,revisions),'55000');
 if (select to_jsonb(x) from public.internal_pickem_weeks x where id=w.id) is distinct from (select value from setup_snapshots where key='published') then raise exception 'Published week changed'; end if;
 insert into setup_results values('published edits and repeated opening rejected without metadata changes');
end $$;
reset role;
-- Real draft/entry RPCs create protected fixtures, never Week 6.
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='draft-member'),true);
select public.save_pickem_contest_draft((select id from public.pickem_weeks where season=2026 and week=7),
 (select jsonb_object_agg(id::text,home_school_slug) from public.pickem_games where week_id=(select id from public.pickem_weeks where season=2026 and week=7)),55);
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='member'),true);
select public.submit_pickem_contest_entry((select id from public.pickem_weeks where season=2026 and week=7),'2545557703',60,
 (select jsonb_object_agg(id::text,home_school_slug) from public.pickem_games where week_id=(select id from public.pickem_weeks where season=2026 and week=7)),true);
reset role;
-- Compress only the disposable Week 7 clock to exercise populated grades,
-- finalization, correction evidence and payment records. Restore every trigger
-- before testing setup rejection; the whole fixture remains in this rollback.
alter table public.pickem_weeks disable trigger freeze_pickem_contest_deadlines;
alter table public.pickem_weeks disable trigger protect_contest_week;
alter table public.pickem_games disable trigger protect_contest_slate;
update public.pickem_weeks set opens_at=now()-interval '2 hours',entry_deadline_at=now()-interval '1 hour',
 closes_at=now()-interval '1 minute' where season=2026 and week=7;
update public.pickem_games set lock_at=now()-interval '1 minute'
 where week_id=(select id from public.pickem_weeks where season=2026 and week=7);
alter table public.pickem_weeks enable trigger freeze_pickem_contest_deadlines;
alter table public.pickem_weeks enable trigger protect_contest_week;
alter table public.pickem_games enable trigger protect_contest_slate;
insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at,result_type,away_school_slug,home_school_slug)
 select game_id,'final',14,7,true,now(),'played',away_school_slug,home_school_slug from public.pickem_games
 where week_id=(select id from public.pickem_weeks where season=2026 and week=7);
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='admin'),true);
select public.admin_finalize_pickem_contest_results((select id from public.pickem_weeks where season=2026 and week=7));
select public.admin_record_pickem_winner_notice((select id from public.pickem_weeks where season=2026 and week=7));
select public.admin_record_pickem_winner_response((select id from public.pickem_weeks where season=2026 and week=7));
select public.admin_decide_pickem_winner_claim((select id from public.pickem_weeks where season=2026 and week=7),'confirmed','Isolated fixture only');
select public.admin_record_pickem_prize_paid((select id from public.pickem_weeks where season=2026 and week=7));
select public.correct_game_score(s.game_id,s.updated_at,s.outcome_revision,'final',7,21,null,null,'Isolated audited correction')
 from public.game_state s where game_id=(select game_id from public.pickem_games where id=(select tiebreaker_game_id from public.pickem_weeks where season=2026 and week=7));
reset role;
do $$ declare w uuid; begin
 select id into w from public.pickem_weeks where season=2026 and week=7;
 if not exists(select 1 from private.pickem_winner_claims where week_id=w and decision='paid' and payment_recorded_at is not null)
 or not exists(select 1 from private.pickem_contest_finalization_history where week_id=w)
 or not exists(select 1 from private.game_score_correction_audit a join public.pickem_games g on g.game_id=a.game_id where g.week_id=w)
 or not exists(select 1 from public.pickem_week_standings where week_id=w)
 or exists(select 1 from public.pickem_games where week_id=w and graded_at is null) then raise exception 'Populated preservation fixture incomplete'; end if;
 insert into setup_results values('populated grades standings resolutions finalization history claims correction and payment fixture');
end $$;
create function pg_temp.protected_state() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'receipts',(select jsonb_agg(to_jsonb(x) order by week_id,user_id) from public.pickem_contest_entries x),
 'picks',(select jsonb_agg(to_jsonb(x) order by id) from public.pickem_picks x),
 'predictions',(select jsonb_agg(to_jsonb(x) order by week_id,user_id) from public.pickem_week_tiebreakers x),
 'drafts',(select jsonb_agg(to_jsonb(x) order by pickem_game_id,user_id) from private.pickem_draft_picks x),
 'draft_predictions',(select jsonb_agg(to_jsonb(x) order by week_id,user_id) from private.pickem_draft_predictions x),
 'games',(select jsonb_agg(to_jsonb(x) order by id) from public.pickem_games x),
 'weeks',(select jsonb_agg(to_jsonb(x) order by id) from public.pickem_weeks x),
 'totals',(select jsonb_agg(to_jsonb(x) order by season,user_id) from public.pickem_member_totals x),
 'standings',(select jsonb_agg(to_jsonb(x) order by week_id,user_id) from public.pickem_week_standings x),
 'resolutions',(select jsonb_agg(to_jsonb(x) order by pickem_game_id) from private.pickem_contest_game_resolution x),
 'finalizations',(select jsonb_agg(to_jsonb(x) order by week_id) from private.pickem_contest_finalizations x),
 'history',(select jsonb_agg(to_jsonb(x) order by week_id,generation) from private.pickem_contest_finalization_history x),
 'claims',(select jsonb_agg(to_jsonb(x) order by week_id,user_id) from private.pickem_winner_claims x),
 'corrections',(select jsonb_agg(to_jsonb(x) order by id) from private.game_score_correction_audit x)
 );
$$;
insert into setup_snapshots values('protected',pg_temp.protected_state());
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='member'),true);
do $$ declare w uuid; selections jsonb; begin
 select id into w from public.pickem_weeks where season=2026 and week=7;
 select jsonb_object_agg(id::text,away_school_slug) into selections from public.pickem_games where week_id=w;
 perform pg_temp.check_error(format('select public.submit_pickem_contest_entry(%L,null,61,%L::jsonb,false)',w,selections),'P0001');
 if pg_temp.protected_state() is distinct from (select value from setup_snapshots where key='protected') then raise exception 'Locked pick/prediction rejection changed state'; end if;
 insert into setup_results values('individual pick and tiebreaker prediction locks retain receipt and state');
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from setup_actors where label='admin'),true);
do $$ declare w public.pickem_weeks; begin
 select * into w from public.internal_pickem_weeks where season=2026 and week=7;
 perform pg_temp.check_error(format('select public.configure_pickem_draft(2026,7,%s,''Unsafe'',%L::jsonb,%L::text[])',w.configuration_revision,pg_temp.payload(7),pg_temp.tb(7)),'55000');
 if pg_temp.protected_state() is distinct from (select value from setup_snapshots where key='protected') then raise exception 'Protected contest state changed'; end if;
 insert into setup_results values('receipt picks predictions private drafts deadlines locks grades standings and audit state preserved');
end $$;
reset role;
select count(*) as passed_assertion_groups,array_agg(test order by test) as passed from setup_results;
rollback;

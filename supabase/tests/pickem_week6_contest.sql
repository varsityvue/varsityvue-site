-- Disposable local database only. Synthetic identities never leave the CI database.
begin;
create temporary table test_ids (label text primary key, user_id uuid, phone text) on commit preserve rows;
insert into test_ids values
 ('A','00000000-0000-4000-8000-000000000101','2545550101'),
 ('B','00000000-0000-4000-8000-000000000102','2545550102'),
 ('C','00000000-0000-4000-8000-000000000103','2545550103'),
 ('D','00000000-0000-4000-8000-000000000104','2545550104'),
 ('draft','00000000-0000-4000-8000-000000000105','2545550105'),
 ('duplicate','00000000-0000-4000-8000-000000000106','(254) 555-0103'),
 ('admin','00000000-0000-4000-8000-000000000107','2545550107');
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  label || '@example.invalid', '!', now(), '{}'::jsonb,
  jsonb_build_object('display_name', 'Contest test ' || label), now(), now() from test_ids;
create temporary table contest_fixture (week_id uuid, game_number integer, pickem_game_id uuid) on commit preserve rows;
do $$ declare w uuid; g uuid; begin
 insert into public.pickem_weeks (season, week, title, status, opens_at, closes_at)
 values (2099, 6, 'Isolated test only', 'draft', now()-interval '1 hour', now()+interval '20 seconds') returning id into w;
 for i in 1..9 loop
  insert into public.pickem_games (week_id, game_id, sort_order, lock_at, away_school_slug, home_school_slug)
  values (w, '__isolated_week6_'||i, i, now()+case when i=1 then interval '7 seconds' else interval '15 seconds' end,
    'away-'||i, 'home-'||i) returning id into g;
  insert into contest_fixture values (w,i,g);
 end loop;
 update public.pickem_weeks set tiebreaker_game_id = (select pickem_game_id from contest_fixture where game_number=1), status='open' where id=w;
 if (select entry_deadline_at from public.pickem_weeks where id=w) is distinct from
    (select min(lock_at) from public.pickem_games where week_id=w) then raise exception 'Entry cutoff did not freeze at opening'; end if;
 if (select outcome_resolution_at from public.pickem_weeks where id=w) is distinct from
    ((date_trunc('week', (select min(lock_at) from public.pickem_games where week_id=w) at time zone 'America/Chicago') + interval '8 days') at time zone 'America/Chicago') then raise exception 'Monday Central cutoff incorrect'; end if;
end $$;
grant select on test_ids, contest_fixture to authenticated;
set local role authenticated;
do $$ declare w uuid; picks jsonb; count_draft integer; entrant record; begin
 select week_id into w from contest_fixture limit 1;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='draft'),true);
 select jsonb_build_object(pickem_game_id::text,'home-'||game_number) into picks from contest_fixture where game_number=1;
 select public.save_pickem_contest_draft(w,picks) into count_draft;
 if count_draft <> 1 or (select count(*) from public.get_pickem_contest_draft(w)) <> 1 then raise exception 'Draft persistence failed'; end if;
 if exists (select 1 from public.pickem_contest_entries where week_id=w)
 or exists (select 1 from public.pickem_picks where user_id=auth.uid())
 or (select valid_entries from public.pickem_contest_prize where week_id=w) <> 0 then
  raise exception 'Draft leaked into qualification or prize'; end if;
 begin
  perform public.submit_pickem_contest_entry(w,'2545550105',55,picks);
  raise exception 'Incomplete entry was accepted';
 exception when others then
  if sqlerrm = 'Incomplete entry was accepted' then raise; end if;
 end;
 if exists (select 1 from public.pickem_contest_entries where user_id=auth.uid()) then raise exception 'Incomplete entry timestamp created'; end if;
 select jsonb_object_agg(pickem_game_id::text,'home-'||game_number) into picks from contest_fixture;
 begin
  perform public.submit_pickem_contest_entry(w,'2545550105',null,picks);
  raise exception 'Missing prediction was accepted';
 exception when others then
  if sqlerrm = 'Missing prediction was accepted' then raise; end if;
 end;
 if has_table_privilege('authenticated','private.pickem_entrant_phones','SELECT')
 or has_table_privilege('authenticated','private.pickem_draft_picks','SELECT')
 or has_table_privilege('authenticated','public.pickem_picks','INSERT')
 or has_table_privilege('authenticated','public.pickem_week_tiebreakers','UPDATE') then
  raise exception 'Direct sensitive data or pick write privilege remains'; end if;
 for entrant in select * from test_ids where label in ('A','B','C','D') order by label loop
  perform set_config('request.jwt.claim.sub',entrant.user_id::text,true);
  select jsonb_object_agg(pickem_game_id::text,
    case when entrant.label='A' and game_number=9 then 'away-'||game_number else 'home-'||game_number end)
  into picks from contest_fixture;
  perform public.submit_pickem_contest_entry(w, entrant.phone,
    case entrant.label when 'A' then 55 when 'B' then 73 when 'C' then 60 else 66 end,picks);
  if entrant.label='C' then perform pg_sleep(0.05); end if;
 end loop;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='duplicate'),true);
 select jsonb_object_agg(pickem_game_id::text,'home-'||game_number) into picks from contest_fixture;
 begin
  perform public.submit_pickem_contest_entry(w,'+1 254 555 0103',63,picks);
  raise exception 'Duplicate normalized phone accepted';
 exception when others then
  if sqlerrm = 'Duplicate normalized phone accepted' then raise; end if;
 end;
 if (select valid_entries from public.pickem_contest_prize where week_id=w) <> 4 then raise exception 'Valid count wrong'; end if;
end $$;
-- Concurrent attempts race on the phone unique index. This sequential check
-- exercises the same conflict result; an additional two-session race runs below.
do $$ declare w uuid; picks jsonb; initial_time timestamptz; after_time timestamptz; begin
 select week_id into w from contest_fixture limit 1;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='C'),true);
 select completed_at into initial_time from public.pickem_contest_entries where week_id=w and user_id=auth.uid();
 select jsonb_object_agg(pickem_game_id::text,'home-'||game_number) into picks from contest_fixture;
 perform public.submit_pickem_contest_entry(w,null,60,picks);
 select completed_at into after_time from public.pickem_contest_entries where week_id=w and user_id=auth.uid();
 if initial_time is distinct from after_time then raise exception 'Repeat save changed initial completion'; end if;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='B'),true);
 if exists (select 1 from public.get_pickem_contest_draft(w)) then raise exception 'Another user draft visible'; end if;
end $$;
reset role;
commit;
-- Test the boundary in a new transaction, because PostgreSQL now() is the
-- transaction start time. The first game is locked; later games are open.
select pg_sleep(greatest(0,extract(epoch from ((select lock_at from public.pickem_games
  where id=(select pickem_game_id from contest_fixture where game_number=1))-clock_timestamp()))+0.1));
begin;
set local role authenticated;
do $$ declare w uuid; game_one uuid; game_two uuid; before_time timestamptz; picks jsonb; begin
 select week_id into w from contest_fixture limit 1;
 select pickem_game_id into game_one from contest_fixture where game_number=1;
 select pickem_game_id into game_two from contest_fixture where game_number=2;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='C'),true);
 select completed_at into before_time from public.pickem_contest_entries where week_id=w and user_id=auth.uid();
 begin
  perform public.submit_pickem_contest_entry(w,null,60,jsonb_build_object(game_one::text,'away-1'));
  raise exception 'Locked game edit accepted';
 exception when others then if sqlerrm='Locked game edit accepted' then raise; end if; end;
 perform public.submit_pickem_contest_entry(w,null,60,jsonb_build_object(game_two::text,'away-2'));
 if (select picked_school_slug from public.pickem_picks where user_id=auth.uid() and pickem_game_id=game_two)<>'away-2'
 or (select picked_school_slug from public.pickem_picks where user_id=auth.uid() and pickem_game_id=game_one)<>'home-1'
 then raise exception 'Mixed locked/unlocked edit failed'; end if;
 perform public.submit_pickem_contest_entry(w,null,60,jsonb_build_object(game_two::text,'home-2'));
 if (select completed_at from public.pickem_contest_entries where week_id=w and user_id=auth.uid()) is distinct from before_time
 then raise exception 'Editing changed initial entry time'; end if;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='draft'),true);
 select jsonb_object_agg(pickem_game_id::text,'home-'||game_number) into picks from contest_fixture;
 begin
  perform public.submit_pickem_contest_entry(w,'2545550105',63,picks);
  raise exception 'Late entry accepted';
 exception when others then if sqlerrm='Late entry accepted' then raise; end if; end;
 if exists (select 1 from public.pickem_contest_entries where user_id=auth.uid()) then
  raise exception 'Late attempt established eligibility'; end if;
end $$;
reset role;
-- Grading consumes canonical verified finals. Overtime is part of played total.
insert into public.game_state (game_id,status,home_score,away_score,period,verified,verified_at,result_type,away_school_slug,home_school_slug)
select '__isolated_week6_'||game_number, 'final', case when game_number=1 then 35 else 7 end,
 case when game_number=1 then 28 else 0 end, case when game_number=1 then 'OT' end,
 true, now(), 'played',
 'away-'||game_number, 'home-'||game_number from contest_fixture;
-- We intentionally wait until the stored deadline; changing it after entry is prohibited.
commit;
select pg_sleep(greatest(0,extract(epoch from ((select closes_at from public.pickem_weeks where id=(select week_id from contest_fixture limit 1))-clock_timestamp()))+0.1));
begin;
insert into public.user_roles (user_id,role)
select user_id,'admin'::public.user_role from test_ids where label='admin';
do $$ declare w uuid; expected text[]; actual text[]; begin
 select week_id into w from contest_fixture limit 1;
 select array_agg(ids.label order by standing.weekly_rank) into actual
 from public.pickem_week_standings standing join test_ids ids on ids.user_id=standing.user_id
 where standing.week_id=w;
 expected := array['C','D','B','A'];
 if actual is distinct from expected then raise exception 'Ranking expected %, got %', expected, actual; end if;
 if (select valid_entries from public.pickem_contest_prize where week_id=w)<>4
 or (select prize_dollars from public.pickem_contest_prize where week_id=w)<>4 then
  raise exception 'Prize count incorrect'; end if;
 if (select correct_picks from public.pickem_week_standings s join test_ids i on i.user_id=s.user_id where week_id=w and label='A')<>8 then
  raise exception 'Incorrect-pick grading failed'; end if;
end $$;
set local role authenticated;
do $$ declare w uuid; winner record; begin
 select week_id into w from contest_fixture limit 1;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='B'),true);
 begin
  perform public.admin_pickem_provisional_winner_contact(w);
  raise exception 'Ordinary member obtained winner contact';
 exception when others then if sqlerrm='Ordinary member obtained winner contact' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',(select user_id::text from test_ids where label='admin'),true);
 select * into winner from public.admin_pickem_provisional_winner_contact(w);
 if winner.user_id is distinct from (select user_id from test_ids where label='C')
 or winner.phone_e164 is distinct from '+12545550103' then
  raise exception 'Administrator provisional winner contact incorrect'; end if;
end $$;
reset role;
-- Corrected final changes the authoritative total and standings immediately.
update public.game_state set home_score=42 where game_id='__isolated_week6_1';
do $$ declare w uuid; begin
 select week_id into w from contest_fixture limit 1;
 if (select actual_total from public.pickem_week_standings where week_id=w limit 1)<>70 then
  raise exception 'Corrected Game of the Week total stale'; end if;
 if (select i.label from public.pickem_week_standings s join test_ids i on i.user_id=s.user_id
     where week_id=w order by weekly_rank limit 1)<>'B' then
  raise exception 'Corrected final did not rerank predictions'; end if;
end $$;
-- A verified forfeit grades its explicit winner, regardless of score absence.
update public.game_state set result_type='forfeit',home_score=null,away_score=null,
 official_winner_school_slug='away-9' where game_id='__isolated_week6_9';
do $$ begin
 if (select p.is_correct from public.pickem_picks p join contest_fixture f on f.pickem_game_id=p.pickem_game_id
     join test_ids i on i.user_id=p.user_id where f.game_number=9 and i.label='A') is distinct from true
 then raise exception 'Explicit forfeit winner failed grading'; end if;
end $$;
-- A no-contest void clears any prior grade; the remaining score excludes it.
update public.game_state set status='final',result_type='no_contest',home_score=null,away_score=null,
 official_winner_school_slug=null where game_id='__isolated_week6_9';
do $$ declare w uuid; begin
 select week_id into w from contest_fixture limit 1;
 if exists (select 1 from public.pickem_picks p join contest_fixture f on f.pickem_game_id=p.pickem_game_id
            where f.game_number=9 and p.is_correct is not null) then raise exception 'Void retained stale grade'; end if;
 if (select correct_picks from public.pickem_week_standings s join test_ids i on i.user_id=s.user_id
     where week_id=w and label='C')<>8 then raise exception 'Void scoring incorrect'; end if;
end $$;
-- GOTW no played total skips distance for all entrants and uses original receipt time.
update public.game_state set result_type='no_contest',home_score=null,away_score=null,
 official_winner_school_slug=null where game_id='__isolated_week6_1';
do $$ declare w uuid; begin
 select week_id into w from contest_fixture limit 1;
 if exists (select 1 from public.pickem_week_standings where week_id=w and distance is not null) then
  raise exception 'Void GOTW still used prediction'; end if;
 if (select i.label from public.pickem_week_standings s join test_ids i on i.user_id=s.user_id
     where week_id=w order by weekly_rank limit 1)<>'A' then
  raise exception 'GOTW fallback did not use initial entry time'; end if;
end $$;
-- Exercise the cap through 117 actual completed RPC entries, then revoke one.
create temporary table cap_ids (user_id uuid, phone text) on commit preserve rows;
insert into cap_ids select gen_random_uuid(), '254555'||lpad(n::text,4,'0')
from generate_series(200,316) n;
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select user_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 user_id::text||'@example.invalid','!',now(),'{}'::jsonb,'{}'::jsonb,now(),now() from cap_ids;
create temporary table cap_fixture (week_id uuid, game_id uuid) on commit preserve rows;
do $$ declare w uuid; g uuid; begin
 insert into public.pickem_weeks (season,week,title,status,opens_at,closes_at)
 values (2099,8,'Cap fixture','draft',now()-interval '1 hour',now()+interval '1 hour') returning id into w;
 insert into public.pickem_games (week_id,game_id,lock_at,away_school_slug,home_school_slug)
 values (w,'__cap_game__',now()+interval '30 minutes','cap-away','cap-home') returning id into g;
 update public.pickem_weeks set tiebreaker_game_id=g,status='open' where id=w;
 insert into cap_fixture values (w,g);
end $$;
grant select on cap_ids, cap_fixture to authenticated;
set local role authenticated;
do $$ declare entrant record; w uuid; g uuid; begin
 select week_id,game_id into w,g from cap_fixture;
 for entrant in select * from cap_ids loop
  perform set_config('request.jwt.claim.sub',entrant.user_id::text,true);
  perform public.submit_pickem_contest_entry(w,entrant.phone,63,jsonb_build_object(g::text,'cap-home'));
 end loop;
end $$;
reset role;
do $$ declare w uuid; begin
 select week_id into w from cap_fixture;
 if (select valid_entries from public.pickem_contest_prize where week_id=w)<>117
 or (select prize_dollars from public.pickem_contest_prize where week_id=w)<>100 then
  raise exception '117 valid entries did not cap at $100'; end if;
 update public.pickem_contest_entries set status='disqualified',disqualification_reason='Synthetic test'
 where week_id=w and user_id=(select user_id from cap_ids limit 1);
 if (select valid_entries from public.pickem_contest_prize where week_id=w)<>116
 or (select prize_dollars from public.pickem_contest_prize where week_id=w)<>100 then
  raise exception 'Disqualification did not recalculate valid count'; end if;
end $$;
-- Week 5 had no prediction at entry: equal correct totals remain shared rank.
do $$ declare w uuid; g uuid; begin
 select id into w from public.pickem_weeks where season=2026 and week=5;
 if w is null then raise exception 'Expected seeded Week 5 historical slate'; end if;
 update public.pickem_weeks set status='open',closes_at=now()+interval '1 hour' where id=w;
 insert into public.pickem_games (week_id,game_id,lock_at,away_school_slug,home_school_slug)
 values (w,'__historical_week5__',now()+interval '1 hour','history-away','history-home') returning id into g;
 insert into public.pickem_picks (pickem_game_id,user_id,picked_school_slug)
 select g,user_id,'history-home' from test_ids where label in ('A','B');
 insert into public.game_state (game_id,status,home_score,away_score,verified,verified_at,result_type,away_school_slug,home_school_slug)
 values ('__historical_week5__','final',7,0,true,now(),'played','history-away','history-home');
 update public.pickem_weeks set closes_at=now()-interval '1 hour' where id=w;
 if (select count(*) from public.pickem_week_standings where week_id=w and weekly_rank=1)<>2 then
  raise exception 'Week 5 historical shared rank changed'; end if;
end $$;
rollback;

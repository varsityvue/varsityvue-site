-- Run on an isolated database. Synthetic game, grades, and notification events roll back.
begin;
create temporary table correction_ids (key text primary key, value uuid not null) on commit drop;
insert into correction_ids select 'admin', user_id from public.user_roles where role='admin' order by user_id limit 1;
insert into correction_ids select 'moderator', user_id from public.user_roles where role='moderator' order by user_id limit 1;
insert into correction_ids select 'member', user_id from public.member_account_status
  where status='active' and user_id not in (select value from correction_ids) order by user_id limit 1;
do $$ begin if (select count(*) from correction_ids) <> 3 then raise exception 'Admin, moderator and active member fixtures required'; end if; end $$;
grant select on correction_ids to authenticated;

do $$ declare week_id uuid; selected_id uuid; begin
  insert into public.pickem_weeks(season, week, title, status, closes_at) values (2097, 27, '__correction__', 'open', now()+interval '1 hour') returning id into week_id;
  insert into public.pickem_games(week_id, game_id, lock_at, away_school_slug, home_school_slug)
    values (week_id, '__score_correction__', now() + interval '2 hours', 'away-a', 'home-a') returning id into selected_id;
  update public.pickem_weeks set tiebreaker_game_id=selected_id where id=week_id;
  insert into public.pickem_week_tiebreakers(week_id,user_id,predicted_total)
    values (week_id,(select value from correction_ids where key='member'),35),
           (week_id,(select value from correction_ids where key='moderator'),42);
  insert into public.pickem_picks(pickem_game_id, user_id, picked_school_slug)
    values (selected_id, (select value from correction_ids where key='member'), 'away-a'),
           (selected_id, (select value from correction_ids where key='moderator'), 'home-a');
  insert into public.game_state(game_id,status,away_score,home_score,period,clock,verified,verified_at,away_school_slug,home_school_slug)
    values ('__score_correction__','live',7,0,'Q1','08:00',true,now(),'away-a','home-a');
  update public.pickem_weeks set closes_at=now()-interval '1 minute' where id=week_id;
end $$;

select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='member'), true);
set local role authenticated;
do $$ begin
  begin
    perform public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),0,'live',7,3,'Q1','07:30','Member attempt');
    raise exception 'Member correction was accepted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='moderator'), true);
set local role authenticated;
select public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),0,'live',7,3,'Q2','07:30','Verified live correction');
do $$ begin
  if not exists (select 1 from public.game_state where game_id='__score_correction__' and home_score=3 and period='Q2' and clock='07:30' and outcome_revision=1) then
    raise exception 'Live score or period/clock correction failed'; end if;
  begin
    perform public.correct_game_score('__score_correction__','2020-01-01'::timestamptz,0,'live',7,7,'Q2','05:00','Stale request');
    raise exception 'Stale update was accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),1,'final',7,3,'Q4','00:00','Moderator final attempt');
    raise exception 'Moderator final was accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.game_state set status='final' where game_id='__score_correction__';
    raise exception 'Direct moderator FINAL update was accepted';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
-- Enable synthetic registration within this transaction; original FINAL event is unique per game.
insert into public.school_follows(user_id,school_slug,source_surface)
  values ((select value from correction_ids where key='member'),'away-a','scoreboard');
insert into public.member_notification_preferences(user_id,final_score_email)
  values ((select value from correction_ids where key='member'),true);
insert into private.final_score_notification_games(game_id,game_date,kickoff,away_team_name,home_team_name,away_school_slug,home_school_slug)
  values ('__score_correction__',current_date,'2026-09-26T19:00:00-05:00','Away A','Home A','away-a','home-a');
update private.final_score_email_activation set activated_at=now()-interval '1 hour', minimum_game_date=current_date,
  baseline_verified_final_game_ids=array_remove(baseline_verified_final_game_ids,'__score_correction__') where singleton;
select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='admin'), true);
set local role authenticated;
select public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),1,'final',21,14,'Q4','00:00','Verified final');
do $$ begin
  if not exists (select 1 from public.pickem_games where game_id='__score_correction__' and result_winner_school_slug='away-a') then raise exception 'Initial final did not grade'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='moderator'), true);
set local role authenticated;
do $$ begin
  begin
    update public.game_state set clock='00:01' where game_id='__score_correction__';
    raise exception 'Direct finalized clock update bypassed the audit';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='admin'), true);
set local role authenticated;
select public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),2,'final',14,28,'Q4','00:00','Official corrected final');
reset role;
do $$ begin
  if not exists (select 1 from public.pickem_games where game_id='__score_correction__' and result_winner_school_slug='home-a') then raise exception 'Winner did not regrade'; end if;
  if not exists (select 1 from public.pickem_picks p join public.pickem_games g on g.id=p.pickem_game_id where g.game_id='__score_correction__' and p.picked_school_slug='home-a' and p.is_correct) then raise exception 'Pick grade did not reverse'; end if;
  if not exists (select 1 from public.pickem_member_totals where season=2097 and user_id=(select value from correction_ids where key='moderator') and correct_picks=1)
    or not exists (select 1 from public.pickem_member_totals where season=2097 and user_id=(select value from correction_ids where key='member') and correct_picks=0) then
    raise exception 'Member totals did not reverse'; end if;
  if not exists (select 1 from public.pickem_week_standings where season=2097 and week=27 and user_id=(select value from correction_ids where key='moderator') and weekly_rank=1 and correct_picks=1) then
    raise exception 'Weekly leaderboard did not reverse'; end if;
  if not exists (select 1 from public.pickem_week_standings where season=2097 and week=27 and user_id=(select value from correction_ids where key='moderator') and actual_total=42 and predicted_total=42 and distance=0) then
    raise exception 'Corrected Game of the Week total did not update'; end if;
  if (select count(*) from private.product_notification_events where category='final_score' and source_key='game-final:__score_correction__') <> 1 then raise exception 'Duplicate or missing FINAL event'; end if;
  if (select count(*) from private.product_email_deliveries d join private.product_notification_events e on e.id=d.event_id
      where e.source_key='game-final:__score_correction__' and d.recipient_user_id=(select value from correction_ids where key='member')) <> 1 then
    raise exception 'Initial FINAL delivery missing or duplicated'; end if;
  if not exists (select 1 from private.product_notification_events where source_key='game-final:__score_correction__'
    and content_snapshot->>'away_score'='21' and content_snapshot->>'home_score'='14') then
    raise exception 'Original FINAL snapshot unexpectedly changed'; end if;
  if (select count(*) from private.game_score_correction_audit where game_id='__score_correction__') <> 3 then raise exception 'Correction audit is incomplete'; end if;
end $$;
set local role authenticated;
select public.correct_game_score('__score_correction__',(select updated_at from public.game_state where game_id='__score_correction__'),3,'final',17,17,'OT','00:00','Official tie');
reset role;
do $$ begin
  if exists (select 1 from public.pickem_picks p join public.pickem_games g on g.id=p.pickem_game_id where g.game_id='__score_correction__' and p.is_correct is not null) then raise exception 'Tie did not clear grades'; end if;
  if exists (select 1 from public.pickem_member_totals where season=2097 and user_id in (select value from correction_ids)) then raise exception 'Tie left stale member totals'; end if;
  if (select count(*) from private.product_notification_events where category='final_score' and source_key='game-final:__score_correction__') <> 1 then raise exception 'Tie sent another FINAL'; end if;
  if not exists (select 1 from private.game_score_correction_audit where game_id='__score_correction__'
    and actor_id=(select value from correction_ids where key='admin') and reason='Official corrected final'
    and previous_state->>'away_score'='21' and corrected_state->>'away_score'='14'
    and occurred_at is not null) then raise exception 'Audit identity, reason, time, or before/after values missing'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select value::text from correction_ids where key='member'), true);
set local role authenticated;
do $$ begin
  begin
    delete from private.game_score_correction_audit where game_id='__score_correction__';
    raise exception 'Ordinary user erased audit history';
  exception when insufficient_privilege then null; end;
  begin
    update private.game_score_correction_audit set reason='tampered' where game_id='__score_correction__';
    raise exception 'Ordinary user altered audit history';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

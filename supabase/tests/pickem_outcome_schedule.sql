-- Canonical outcome, schedule revision, lock synchronization, DST, and
-- authorization regression suite. Every fixture is synthetic and rolled back.

begin;

create temporary table canonical_audit_ids (
  key text primary key,
  value uuid not null
) on commit drop;

insert into canonical_audit_ids
select 'admin', user_id from public.user_roles where role = 'admin' order by user_id limit 1;
insert into canonical_audit_ids
select 'moderator', user_id from public.user_roles where role = 'moderator' order by user_id limit 1;
insert into canonical_audit_ids
select 'member', user_id
from public.member_account_status
where status = 'active'
  and user_id not in (select value from canonical_audit_ids)
order by user_id limit 1;

do $setup$
begin
  if (select count(*) from canonical_audit_ids) <> 3 then
    raise exception 'Outcome/schedule suite requires one admin, one moderator, and one ordinary active member';
  end if;
end
$setup$;

grant select on canonical_audit_ids to anon, authenticated;

do $constraints$
declare blocked boolean;
begin
  insert into public.game_state (
    game_id, status, home_score, away_score, verified, verified_at,
    result_type, away_school_slug, home_school_slug
  ) values (
    '__outcome_valid_played__', 'final', 14, 21, true, now(),
    'played', 'away-a', 'home-a'
  );

  blocked := false;
  begin
    insert into public.game_state (game_id, status, verified, result_type)
    values ('__outcome_played_missing__', 'final', true, 'played');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Played result without scores was accepted'; end if;

  blocked := false;
  begin
    insert into public.game_state (game_id, status, home_score, away_score, verified, result_type)
    values ('__outcome_played_tied__', 'final', 14, 14, true, 'played');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Played result with tied scores was accepted'; end if;

  insert into public.game_state (
    game_id, status, home_score, away_score, verified, result_type
  ) values ('__outcome_valid_tie__', 'final', 14, 14, true, 'tie');

  blocked := false;
  begin
    insert into public.game_state (game_id, status, home_score, away_score, verified, result_type)
    values ('__outcome_invalid_tie__', 'final', 14, 21, true, 'tie');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Tie with unequal scores was accepted'; end if;

  insert into public.game_state (
    game_id, status, verified, result_type,
    away_school_slug, home_school_slug, official_winner_school_slug
  ) values (
    '__outcome_valid_forfeit__', 'final', true, 'forfeit',
    'away-f', 'home-f', 'away-f'
  );

  blocked := false;
  begin
    insert into public.game_state (
      game_id, status, verified, result_type, away_school_slug, home_school_slug
    ) values (
      '__outcome_forfeit_no_winner__', 'final', true, 'forfeit', 'away-f', 'home-f'
    );
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Forfeit without official winner was accepted'; end if;

  blocked := false;
  begin
    insert into public.game_state (
      game_id, status, verified, result_type,
      away_school_slug, home_school_slug, official_winner_school_slug
    ) values (
      '__outcome_forfeit_bad_winner__', 'final', true, 'forfeit',
      'away-f', 'home-f', 'outsider'
    );
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Forfeit winner outside matchup was accepted'; end if;

  blocked := false;
  begin
    insert into public.game_state (
      game_id, status, home_score, away_score, verified, result_type,
      away_school_slug, home_school_slug, official_winner_school_slug
    ) values (
      '__outcome_played_with_winner__', 'final', 21, 14, true, 'played',
      'away-p', 'home-p', 'home-p'
    );
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Official winner on played result was accepted'; end if;

  insert into public.game_state (game_id, status, verified, result_type)
  values ('__outcome_valid_no_contest__', 'final', true, 'no_contest');

  blocked := false;
  begin
    insert into public.game_state (
      game_id, status, verified, result_type,
      away_school_slug, home_school_slug, official_winner_school_slug
    ) values (
      '__outcome_no_contest_winner__', 'final', true, 'no_contest',
      'away-n', 'home-n', 'home-n'
    );
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Official winner on no-contest was accepted'; end if;

  insert into public.game_state (game_id, status, verified)
  values ('__outcome_cancelled__', 'cancelled', true),
         ('__outcome_postponed__', 'postponed', true),
         ('__outcome_unclassified__', 'final', false);
end
$constraints$;

do $grading$
declare
  member_id uuid := (select value from canonical_audit_ids where key = 'member');
  week_id uuid;
  target_pickem_game_id uuid;
  selected_slug text;
  graded integer;
  correct integer;
begin
  insert into public.pickem_weeks (season, week, title, status)
  values (2096, 1, '__canonical_outcome_grading__', 'open') returning id into week_id;

  insert into public.pickem_games (
    week_id, game_id, lock_at, away_school_slug, home_school_slug
  ) values (
    week_id, '__outcome_transition__', now() + interval '2 hours', 'away-t', 'home-t'
  ) returning id into target_pickem_game_id;

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values (target_pickem_game_id, member_id, 'away-t');

  insert into public.game_state (
    game_id, status, home_score, away_score, verified, verified_at,
    result_type, away_school_slug, home_school_slug
  ) values (
    '__outcome_transition__', 'final', 7, 21, true, now(),
    'played', 'away-t', 'home-t'
  );

  if not (select is_correct is true from public.pickem_picks where pickem_game_id = target_pickem_game_id) then
    raise exception 'Played result did not grade from numeric winner';
  end if;

  update public.game_state
  set home_score = 14, away_score = 14, result_type = 'tie'
  where game_id = '__outcome_transition__';
  if exists (select 1 from public.pickem_picks where pickem_game_id = target_pickem_game_id and is_correct is not null) then
    raise exception 'Played-to-tie retained a stale grade';
  end if;

  update public.game_state
  set home_score = 7, away_score = 21, result_type = 'played'
  where game_id = '__outcome_transition__';
  update public.game_state
  set home_score = null, away_score = null, result_type = 'no_contest'
  where game_id = '__outcome_transition__';
  if exists (select 1 from public.pickem_picks where pickem_game_id = target_pickem_game_id and is_correct is not null) then
    raise exception 'No-contest was graded';
  end if;

  update public.game_state
  set result_type = 'forfeit', official_winner_school_slug = 'home-t'
  where game_id = '__outcome_transition__';
  if not (select is_correct is false from public.pickem_picks where pickem_game_id = target_pickem_game_id) then
    raise exception 'Forfeit did not grade from official winner';
  end if;

  update public.game_state
  set official_winner_school_slug = 'away-t'
  where game_id = '__outcome_transition__';
  if not (select is_correct is true from public.pickem_picks where pickem_game_id = target_pickem_game_id) then
    raise exception 'Forfeit winner correction did not regrade';
  end if;

  update public.game_state
  set home_score = 24, away_score = 10,
      result_type = 'played', official_winner_school_slug = null
  where game_id = '__outcome_transition__';
  if not (select is_correct is false from public.pickem_picks where pickem_game_id = target_pickem_game_id) then
    raise exception 'Forfeit-to-played did not return to numeric grading';
  end if;

  update public.game_state
  set status = 'cancelled', home_score = null, away_score = null,
      result_type = null, official_winner_school_slug = null
  where game_id = '__outcome_transition__';
  if exists (select 1 from public.pickem_picks where pickem_game_id = target_pickem_game_id and is_correct is not null) then
    raise exception 'Cancellation retained a stale grade';
  end if;

  update public.game_state
  set status = 'final', home_score = 7, away_score = 21, result_type = 'played'
  where game_id = '__outcome_transition__';
  update public.game_state
  set status = 'postponed', home_score = null, away_score = null, result_type = null
  where game_id = '__outcome_transition__';
  if exists (select 1 from public.pickem_picks where pickem_game_id = target_pickem_game_id and is_correct is not null) then
    raise exception 'Postponement was graded';
  end if;

  select picked_school_slug into selected_slug
  from public.pickem_picks where pickem_game_id = target_pickem_game_id and user_id = member_id;
  if selected_slug <> 'away-t' then raise exception 'Saved selection was not preserved'; end if;

  select coalesce(graded_picks, 0), coalesce(correct_picks, 0)
  into graded, correct
  from public.pickem_member_totals where season = 2096 and user_id = member_id;
  if coalesce(graded, 0) <> 0 or coalesce(correct, 0) <> 0 then
    raise exception 'VOID/pending transition retained totals';
  end if;
end
$grading$;

do $dst$
declare blocked boolean;
begin
  if private.resolve_chicago_local_kickoff('2026-07-15 19:00'::timestamp) <> '2026-07-16 00:00+00'::timestamptz then
    raise exception 'CDT conversion was incorrect';
  end if;
  if private.resolve_chicago_local_kickoff('2026-12-15 19:00'::timestamp) <> '2026-12-16 01:00+00'::timestamptz then
    raise exception 'CST conversion was incorrect';
  end if;

  blocked := false;
  begin perform private.resolve_chicago_local_kickoff('2026-03-08 02:30'::timestamp);
  exception when invalid_datetime_format then blocked := true;
  end;
  if not blocked then raise exception 'Nonexistent spring-forward time was accepted'; end if;

  blocked := false;
  begin perform private.resolve_chicago_local_kickoff('2026-11-01 01:30'::timestamp);
  exception when invalid_datetime_format then blocked := true;
  end;
  if not blocked then raise exception 'Ambiguous fall-back time was accepted'; end if;
end
$dst$;

do $schedule_setup$
declare
  week_id uuid;
begin
  insert into public.pickem_weeks (season, week, title, status)
  values (2096, 2, '__canonical_schedule__', 'open') returning id into week_id;

  insert into public.game_state (
    game_id, status, verified, kickoff_override,
    away_school_slug, home_school_slug, schedule_revision
  ) values
    ('__schedule_future__', 'upcoming', true, '2096-09-14 00:00+00', 'away-s', 'home-s', 0),
    ('__schedule_passed__', 'upcoming', true, now() - interval '2 hours', 'away-p', 'home-p', 0),
    ('__schedule_exact__', 'upcoming', true, now(), 'away-e', 'home-e', 0);

  insert into public.pickem_games (
    week_id, game_id, sort_order, lock_at, away_school_slug, home_school_slug
  ) values
    (week_id, '__schedule_future__', 1, '2096-09-14 00:00+00', 'away-s', 'home-s'),
    (week_id, '__schedule_passed__', 2, now() - interval '1 hour', 'away-p', 'home-p'),
    (week_id, '__schedule_exact__', 3, now(), 'away-e', 'home-e');
end
$schedule_setup$;

select set_config('request.jwt.claim.sub', (select value::text from canonical_audit_ids where key = 'moderator'), true);
set local role authenticated;

do $moderator_schedule$
declare
  future_game uuid;
  passed_game uuid;
  exact_game uuid;
  original_passed_lock timestamptz;
  original_exact_lock timestamptz;
  first_revised_at timestamptz;
  no_op_changed boolean;
  blocked boolean;
begin
  select id into future_game from public.pickem_games where game_id = '__schedule_future__';
  select id, lock_at into passed_game, original_passed_lock from public.pickem_games where game_id = '__schedule_passed__';
  select id, lock_at into exact_game, original_exact_lock from public.pickem_games where game_id = '__schedule_exact__';

  perform public.update_canonical_game_kickoff(
    '__schedule_future__', 0, '2096-09-14 00:00+00',
    '2096-09-14 20:00'::timestamp, 'Later verified kickoff', 'away-s', 'home-s'
  );
  if (select schedule_revision from public.game_state where game_id='__schedule_future__') <> 1 then
    raise exception 'Schedule revision did not increment exactly once';
  end if;
  if (select lock_at from public.pickem_games where id=future_game) <> '2096-09-15 01:00+00'::timestamptz then
    raise exception 'Later pre-lock kickoff did not move lock later';
  end if;
  select schedule_revised_at into first_revised_at from public.game_state where game_id='__schedule_future__';
  if first_revised_at is null or first_revised_at > clock_timestamp() then
    raise exception 'schedule_revised_at was not generated by the database clock';
  end if;

  select result.changed into no_op_changed
  from public.update_canonical_game_kickoff(
    '__schedule_future__', 1, '2096-09-15 01:00+00',
    '2096-09-14 20:00'::timestamp, 'Repeated identical kickoff', 'away-s', 'home-s'
  ) result;
  if no_op_changed is not false
    or (select schedule_revision from public.game_state where game_id='__schedule_future__') <> 1 then
    raise exception 'Repeated identical schedule update was not a no-op';
  end if;

  blocked := false;
  begin
    perform public.update_canonical_game_kickoff(
      '__schedule_future__', 0, '2096-09-15 01:00+00',
      '2096-09-14 18:00'::timestamp, 'Stale competing update', 'away-s', 'home-s'
    );
  exception when serialization_failure then blocked := true;
  end;
  if not blocked then raise exception 'Stale schedule revision was accepted'; end if;

  perform public.update_canonical_game_kickoff(
    '__schedule_future__', 1, '2096-09-15 01:00+00',
    '2096-09-14 18:00'::timestamp, 'Earlier verified kickoff', 'away-s', 'home-s'
  );
  if (select schedule_revision from public.game_state where game_id='__schedule_future__') <> 2
    or (select lock_at from public.pickem_games where id=future_game) <> '2096-09-14 23:00+00'::timestamptz then
    raise exception 'Earlier pre-lock kickoff did not shorten lock';
  end if;

  perform public.update_canonical_game_kickoff(
    '__schedule_passed__', 0, now() - interval '2 hours',
    '2096-09-14 20:00'::timestamp, 'Later kickoff after lock', 'away-p', 'home-p'
  );
  if (select lock_at from public.pickem_games where id=passed_game) <> original_passed_lock then
    raise exception 'Later post-lock schedule update reopened picks';
  end if;

  perform public.update_canonical_game_kickoff(
    '__schedule_passed__', 1, '2096-09-15 01:00+00',
    '2026-09-20 18:00'::timestamp, 'Earlier kickoff after lock', 'away-p', 'home-p'
  );
  if (select lock_at from public.pickem_games where id=passed_game) <> original_passed_lock then
    raise exception 'Earlier post-lock schedule update reopened picks';
  end if;

  perform public.sync_pickem_game_lock(
    (select week_id from public.pickem_games where id=passed_game),
    '__schedule_passed__', 2, '2026-09-20 23:00+00', 2, 'away-p', 'home-p'
  );
  if (select lock_at from public.pickem_games where id=passed_game) <> original_passed_lock then
    raise exception 'Pick Em week save overwrote a passed lock';
  end if;

  perform public.update_canonical_game_kickoff(
    '__schedule_exact__', 0, original_exact_lock,
    '2096-09-14 18:00'::timestamp, 'Exact-boundary schedule update', 'away-e', 'home-e'
  );
  if (select lock_at from public.pickem_games where id=exact_game) <> original_exact_lock then
    raise exception 'Exact lock instant was treated as open';
  end if;

  blocked := false;
  begin
    update public.pickem_games set lock_at = now() + interval '3 hours' where id = passed_game;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator bypassed controlled lock operation'; end if;

  blocked := false;
  begin
    insert into public.game_state (
      game_id, status, verified, kickoff_override, schedule_revision
    ) values (
      '__direct_schedule_insert__', 'upcoming', true, now() + interval '1 day', 0
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator inserted a canonical kickoff outside the controlled operation'; end if;

  blocked := false;
  begin
    delete from public.pickem_games where id = passed_game;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator deleted and bypassed a passed Pick Em lock'; end if;

  blocked := false;
  begin
    perform public.admin_reopen_pickem_game(passed_game, now() + interval '2 hours', 0, 'Moderator attempt');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator manually reopened a matchup'; end if;

  perform public.update_canonical_game_kickoff(
    '__schedule_passed__', 2, '2026-09-20 23:00+00',
    '2096-09-15 20:00'::timestamp, 'Future kickoff awaiting authorized reopen', 'away-p', 'home-p'
  );
  if (select lock_at from public.pickem_games where id=passed_game) <> original_passed_lock then
    raise exception 'Future post-lock schedule update reopened picks';
  end if;

end
$moderator_schedule$;

reset role;

do $automatic_audit$
begin
  if (select count(*) from private.game_schedule_audit where game_id='__schedule_future__') <> 2 then
    raise exception 'No-op or stale schedule update created a misleading audit record';
  end if;
  if not exists (
    select 1 from private.game_schedule_audit
    where game_id='__schedule_future__' and automatic
      and previous_pickem_lock is distinct from new_pickem_lock
  ) then raise exception 'Committed automatic lock audit does not match lock changes'; end if;
end
$automatic_audit$;

select set_config('request.jwt.claim.sub', (select value::text from canonical_audit_ids where key = 'admin'), true);
set local role authenticated;

do $admin_reopen$
declare
  passed_game uuid;
  reopened_lock timestamptz;
  blocked boolean;
begin
  select id into passed_game from public.pickem_games where game_id='__schedule_passed__';
  reopened_lock := now() + interval '2 hours';

  blocked := false;
  begin
    perform public.admin_reopen_pickem_game(
      passed_game, '2096-09-16 02:00+00', 0, 'Invalid lock after kickoff'
    );
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Manual reopen later than canonical kickoff was accepted'; end if;

  perform public.admin_reopen_pickem_game(passed_game, reopened_lock, 0, 'Verified postponement window');
  if (select lock_at from public.pickem_games where id=passed_game) <> reopened_lock
    or (select lock_revision from public.pickem_games where id=passed_game) <> 1 then
    raise exception 'Authorized manual reopen did not update the lock revision';
  end if;
  blocked := false;
  begin perform public.admin_reopen_pickem_game(passed_game, now()+interval '3 hours', 0, 'Stale');
  exception when serialization_failure then blocked := true;
  end;
  if not blocked then raise exception 'Stale manual reopen revision was accepted'; end if;

  blocked := false;
  begin perform public.admin_reopen_pickem_game(passed_game, now()-interval '1 minute', 1, 'Past');
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Past manual reopen time was accepted'; end if;

  blocked := false;
  begin perform public.admin_reopen_pickem_game(passed_game, now()+interval '3 hours', 1, '   ');
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Blank manual reopen reason was accepted'; end if;

  blocked := false;
  begin
    insert into private.game_schedule_audit (
      game_id, action_type, reason, previous_schedule_revision,
      new_schedule_revision, automatic
    ) values ('__direct_audit__','schedule_update','bypass',0,1,true);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Authenticated caller inserted directly into private audit'; end if;
end
$admin_reopen$;

reset role;

do $manual_audit$
begin
  if not exists (
    select 1 from private.game_schedule_audit audit
    join public.pickem_games game on game.id = audit.pickem_game_id
    where game.game_id='__schedule_passed__' and audit.action_type='manual_reopen'
      and audit.automatic is false and audit.reason='Verified postponement window'
      and audit.previous_lock_revision=0 and audit.new_lock_revision=1
  ) then raise exception 'Manual reopen audit is incomplete'; end if;
end
$manual_audit$;

select set_config('request.jwt.claim.sub', (select value::text from canonical_audit_ids where key = 'member'), true);
set local role authenticated;

do $member_security$
declare blocked boolean; changed integer;
begin
  blocked := false;
  begin
    perform public.update_canonical_game_kickoff(
      '__schedule_future__', 2, '2096-09-14 23:00+00',
      '2096-09-14 17:00'::timestamp, 'Member attempt', 'away-s', 'home-s'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ordinary member updated canonical schedule'; end if;

  update public.game_state set result_type='no_contest' where game_id='__schedule_future__';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Ordinary member updated canonical outcome'; end if;
end
$member_security$;

reset role;
set local role anon;

do $anonymous_security$
declare blocked boolean;
begin
  blocked := false;
  begin
    perform public.update_canonical_game_kickoff(
      '__schedule_future__', 2, '2096-09-14 23:00+00',
      '2096-09-14 17:00'::timestamp, 'Anonymous attempt', 'away-s', 'home-s'
    );
  exception when insufficient_privilege or undefined_function then blocked := true;
  end;
  if not blocked then raise exception 'Anonymous caller invoked canonical schedule operation'; end if;
end
$anonymous_security$;

reset role;

select 'pickem_outcome_schedule' as suite, true as passed;

rollback;

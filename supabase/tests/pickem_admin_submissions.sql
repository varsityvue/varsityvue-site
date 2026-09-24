-- Administrator Pick 'Em submission visibility regression suite.
-- All fixtures and changes are synthetic and rolled back.

begin;

create temporary table admin_submission_ids (
  key text primary key,
  value uuid not null
) on commit drop;

insert into admin_submission_ids
select 'admin', user_id from public.user_roles
where role = 'admin' order by user_id limit 1;
insert into admin_submission_ids
select 'moderator', user_id from public.user_roles
where role = 'moderator' order by user_id limit 1;
insert into admin_submission_ids
select 'member', status.user_id
from public.member_account_status status
where status.status = 'active'
  and not exists (
    select 1 from public.user_roles elevated
    where elevated.user_id = status.user_id
      and elevated.role in ('moderator'::public.user_role, 'admin'::public.user_role)
  )
order by status.user_id limit 1;

do $preflight$
begin
  if (select count(*) from admin_submission_ids) <> 3 then
    raise exception 'Admin-submission suite requires an active administrator, moderator, and ordinary member';
  end if;
end
$preflight$;

grant select on admin_submission_ids to anon, authenticated;

do $fixtures$
declare
  synthetic_week_id uuid;
  open_game_id uuid;
  graded_game_id uuid;
  void_game_id uuid;
  missing_game_id uuid;
begin
  insert into public.pickem_weeks (season, week, title, status)
  values (2099, 4, '__admin_submission_visibility__', 'open')
  returning id into synthetic_week_id;

  insert into public.pickem_games (
    week_id, game_id, sort_order, lock_at, away_school_slug, home_school_slug
  ) values
    (synthetic_week_id, '__admin_submission_open__', 1, now() + interval '2 hours', 'open-away', 'open-home'),
    (synthetic_week_id, '__admin_submission_graded__', 2, now() + interval '2 hours', 'graded-away', 'graded-home'),
    (synthetic_week_id, '__admin_submission_void__', 3, now() + interval '2 hours', 'void-away', 'void-home'),
    (synthetic_week_id, '__admin_submission_missing__', 4, now() + interval '2 hours', 'missing-away', 'missing-home');

  select id into open_game_id from public.pickem_games where game_id = '__admin_submission_open__';
  select id into graded_game_id from public.pickem_games where game_id = '__admin_submission_graded__';
  select id into void_game_id from public.pickem_games where game_id = '__admin_submission_void__';
  select id into missing_game_id from public.pickem_games where game_id = '__admin_submission_missing__';

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values
    (open_game_id, (select value from admin_submission_ids where key = 'member'), 'open-away'),
    (graded_game_id, (select value from admin_submission_ids where key = 'member'), 'graded-away'),
    (void_game_id, (select value from admin_submission_ids where key = 'member'), 'void-away'),
    (open_game_id, (select value from admin_submission_ids where key = 'moderator'), 'open-home'),
    (graded_game_id, (select value from admin_submission_ids where key = 'moderator'), 'graded-home'),
    (void_game_id, (select value from admin_submission_ids where key = 'moderator'), 'void-home'),
    (missing_game_id, (select value from admin_submission_ids where key = 'moderator'), 'missing-home');

  update public.pickem_games
  set lock_at = now() - interval '2 hours'
  where id in (graded_game_id, void_game_id, missing_game_id);

  insert into public.game_state (
    game_id, status, home_score, away_score, verified, verified_at,
    result_type, away_school_slug, home_school_slug
  ) values (
    '__admin_submission_graded__', 'final', 14, 21, true, now(),
    'played', 'graded-away', 'graded-home'
  );

  insert into public.game_state (
    game_id, status, verified, verified_at, result_type,
    away_school_slug, home_school_slug
  ) values (
    '__admin_submission_void__', 'final', true, now(), 'no_contest',
    'void-away', 'void-home'
  );
end
$fixtures$;

-- Direct reads expose only the caller's own raw picks after the migration.
select set_config('request.jwt.claim.sub', (select value::text from admin_submission_ids where key = 'moderator'), true);
set local role authenticated;
do $moderator_raw_read$
declare visible_rows integer;
begin
  select count(*) into visible_rows
  from public.pickem_picks picks
  join public.pickem_games games on games.id = picks.pickem_game_id
  where games.game_id like '__admin_submission_%';
  if visible_rows <> 4 then raise exception 'Moderator raw-pick read was not limited to owned rows'; end if;
end
$moderator_raw_read$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from admin_submission_ids where key = 'member'), true);
set local role authenticated;
do $member_rpc$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_pickem_submissions(
      (select week_id from public.pickem_games where game_id = '__admin_submission_open__')
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ordinary member accessed the administrator submission RPC'; end if;
end
$member_rpc$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from admin_submission_ids where key = 'moderator'), true);
set local role authenticated;
do $moderator_rpc$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_pickem_submissions(
      (select week_id from public.pickem_games where game_id = '__admin_submission_open__')
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator accessed the administrator submission RPC'; end if;
end
$moderator_rpc$;
reset role;

update public.member_account_status
set status = 'suspended', suspended_at = now(), suspended_by = null
where user_id = (select value from admin_submission_ids where key = 'admin');
select set_config('request.jwt.claim.sub', (select value::text from admin_submission_ids where key = 'admin'), true);
set local role authenticated;
do $inactive_admin_rpc$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_pickem_submissions(
      (select week_id from public.pickem_games where game_id = '__admin_submission_open__')
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Inactive administrator accessed the submission RPC'; end if;
end
$inactive_admin_rpc$;
reset role;
update public.member_account_status
set status = 'active', suspended_at = null, suspended_by = null
where user_id = (select value from admin_submission_ids where key = 'admin');

select set_config('request.jwt.claim.sub', (select value::text from admin_submission_ids where key = 'admin'), true);
set local role authenticated;
do $admin_visibility$
declare
  synthetic_week_id uuid;
  returned_rows integer;
begin
  select week_id into synthetic_week_id
  from public.pickem_games where game_id = '__admin_submission_open__';

  select count(*) into returned_rows
  from public.admin_pickem_submissions(synthetic_week_id);
  if returned_rows <> 8 then raise exception 'Administrator view did not return every entrant/game pair'; end if;

  if exists (
    select 1 from public.admin_pickem_submissions(synthetic_week_id)
    where game_id = '__admin_submission_open__'
      and (is_locked is true or picked_school_slug is not null or is_correct is not null)
  ) then raise exception 'Pre-lock selections were disclosed'; end if;

  if not exists (
    select 1 from public.admin_pickem_submissions(synthetic_week_id)
    where game_id = '__admin_submission_graded__'
      and entrant_user_id = (select value from admin_submission_ids where key = 'member')
      and is_locked is true and picked_school_slug = 'graded-away'
      and result_winner_school_slug = 'graded-away'
      and is_correct is true and entrant_points = 1 and entrant_graded_picks = 1
  ) then raise exception 'Post-lock selection, grade, or weekly points were incorrect'; end if;

  if not exists (
    select 1 from public.admin_pickem_submissions(synthetic_week_id)
    where game_id = '__admin_submission_void__'
      and result_type = 'no_contest' and graded_at is null and is_correct is null
  ) then raise exception 'Void result was not represented without a grade'; end if;

  if not exists (
    select 1 from public.admin_pickem_submissions(synthetic_week_id)
    where game_id = '__admin_submission_missing__'
      and entrant_user_id = (select value from admin_submission_ids where key = 'member')
      and picked_school_slug is null and entrant_saved_picks = 3
      and week_game_count = 4 and entrant_complete is false
  ) then raise exception 'Incomplete entrant was not represented'; end if;

  if not exists (
    select 1 from public.admin_pickem_submissions(synthetic_week_id)
    where entrant_user_id = (select value from admin_submission_ids where key = 'moderator')
      and entrant_saved_picks = 4 and entrant_complete is true
  ) then raise exception 'Complete entrant was not represented'; end if;
end
$admin_visibility$;
reset role;

select 'pickem_admin_submissions' as suite, true as passed;

rollback;

-- Administrator scoreless exceptional-outcome origination regression suite.
-- All fixtures and changes are synthetic and rolled back.

begin;

create temporary table scoreless_outcome_ids (
  key text primary key,
  value uuid not null
) on commit drop;

insert into scoreless_outcome_ids
select 'admin', user_id from public.user_roles
where role = 'admin' order by user_id limit 1;
insert into scoreless_outcome_ids
select 'moderator', user_id from public.user_roles
where role = 'moderator' order by user_id limit 1;
insert into scoreless_outcome_ids
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
  if (select count(*) from scoreless_outcome_ids) <> 3 then
    raise exception 'Scoreless-outcome suite requires an active administrator, moderator, and ordinary member';
  end if;
end
$preflight$;

grant select on scoreless_outcome_ids to anon, authenticated;

do $fixtures$
declare
  week_id uuid;
  forfeit_pickem_game_id uuid;
  no_contest_pickem_game_id uuid;
begin
  insert into public.pickem_weeks (season, week, title, status)
  values (2098, 1, '__scoreless_outcome_origination__', 'open')
  returning id into week_id;

  insert into public.pickem_games (
    week_id, game_id, lock_at, away_school_slug, home_school_slug
  ) values (
    week_id, '__scoreless_forfeit__', now() + interval '2 hours', 'away-f', 'home-f'
  ) returning id into forfeit_pickem_game_id;

  insert into public.pickem_games (
    week_id, game_id, lock_at, away_school_slug, home_school_slug
  ) values (
    week_id, '__scoreless_no_contest__', now() + interval '2 hours', 'away-n', 'home-n'
  ) returning id into no_contest_pickem_game_id;

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values
    (forfeit_pickem_game_id, (select value from scoreless_outcome_ids where key = 'member'), 'away-f'),
    (forfeit_pickem_game_id, (select value from scoreless_outcome_ids where key = 'moderator'), 'home-f'),
    (no_contest_pickem_game_id, (select value from scoreless_outcome_ids where key = 'member'), 'away-n'),
    (no_contest_pickem_game_id, (select value from scoreless_outcome_ids where key = 'moderator'), 'home-n');

  -- Exercise the existing-state path and prove that provisional live scores
  -- are cleared rather than converted into an invented final.
  insert into public.game_state (
    game_id, status, home_score, away_score, verified, verified_at,
    updated_by, away_school_slug, home_school_slug
  ) values (
    '__scoreless_forfeit__', 'live', 7, 0, true, now(),
    (select value from scoreless_outcome_ids where key = 'admin'),
    'away-f', 'home-f'
  );

  insert into public.score_submissions (
    game_id, submitted_by, home_score, away_score, game_status, source_note
  ) values (
    '__scoreless_forfeit__',
    (select value from scoreless_outcome_ids where key = 'member'),
    7, 0, 'live', 'Synthetic pending report'
  );

  insert into private.final_score_notification_games (
    game_id, game_date, kickoff, away_team_name, home_team_name,
    away_school_slug, home_school_slug
  ) values
    ('__scoreless_forfeit__', '2098-08-28', '2098-08-28T19:00:00-05:00', 'Away F', 'Home F', 'away-f', 'home-f'),
    ('__scoreless_no_contest__', '2098-08-28', '2098-08-28T19:00:00-05:00', 'Away N', 'Home N', 'away-n', 'home-n');
end
$fixtures$;

-- Anonymous, ordinary-member, moderator, and inactive-admin callers fail at
-- the trusted boundary.
set local role anon;
do $anon$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_originate_canonical_game_outcome(
      '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Official source',
      'Anonymous attempt', 'away-f', 'home-f'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Anonymous caller was not rejected'; end if;
end
$anon$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'member'), true);
set local role authenticated;
do $member$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_originate_canonical_game_outcome(
      '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Official source',
      'Member attempt', 'away-f', 'home-f'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ordinary member was not rejected'; end if;
end
$member$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'moderator'), true);
set local role authenticated;
do $moderator$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_originate_canonical_game_outcome(
      '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Official source',
      'Moderator attempt', 'away-f', 'home-f'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator was not rejected'; end if;

  blocked := false;
  begin
    update public.game_state
    set status = 'final', result_type = 'forfeit',
        official_winner_school_slug = 'away-f', home_score = null, away_score = null
    where game_id = '__scoreless_forfeit__';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator bypassed the trusted operation'; end if;
end
$moderator$;
reset role;

update public.member_account_status
set status = 'suspended', suspended_at = now(), suspended_by = null
where user_id = (select value from scoreless_outcome_ids where key = 'admin');
select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'admin'), true);
set local role authenticated;
do $inactive_admin$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_originate_canonical_game_outcome(
      '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Official source',
      'Inactive administrator attempt', 'away-f', 'home-f'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Inactive administrator was not rejected'; end if;
end
$inactive_admin$;
reset role;
update public.member_account_status
set status = 'active', suspended_at = null, suspended_by = null
where user_id = (select value from scoreless_outcome_ids where key = 'admin');

-- Invalid shapes fail without changing state, grading, reports, or audit.
select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'admin'), true);
set local role authenticated;
do $validation$
declare blocked boolean;
begin
  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'played', null, 'Source', 'Reason', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Played was accepted by the scoreless operation'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'forfeit', null, 'Source', 'Reason', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Forfeit without a winner was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'forfeit', 'outsider', 'Source', 'Reason', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Nonparticipant forfeit winner was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'no_contest', 'home-f', 'Source', 'Reason', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'No-contest with a winner was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'forfeit', 'away-f', ' ', 'Reason', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Blank source was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Source', ' ', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Blank reason was accepted'; end if;
end
$validation$;
reset role;

do $validation_atomicity$
begin
  if not exists (
    select 1 from public.game_state
    where game_id = '__scoreless_forfeit__' and status = 'live'
      and home_score = 7 and away_score = 0 and outcome_revision = 0
  ) then raise exception 'Rejected validation changed game state'; end if;
  if exists (
    select 1 from private.game_outcome_audit where game_id like '__scoreless_%'
  ) then raise exception 'Rejected validation created an audit row'; end if;
end
$validation_atomicity$;

-- Originate a scoreless forfeit from existing live state.
select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'admin'), true);
set local role authenticated;
select * from public.admin_originate_canonical_game_outcome(
  '__scoreless_forfeit__', 0, 'forfeit', 'away-f',
  'District executive committee ruling', 'Home school could not field a team',
  'away-f', 'home-f'
);
reset role;

do $forfeit_result$
begin
  if not exists (
    select 1 from public.game_state
    where game_id = '__scoreless_forfeit__'
      and status = 'final' and verified is true
      and result_type = 'forfeit' and official_winner_school_slug = 'away-f'
      and home_score is null and away_score is null and outcome_revision = 1
  ) then raise exception 'Scoreless forfeit was not stored canonically'; end if;
  if not exists (
    select 1 from public.pickem_games
    where game_id = '__scoreless_forfeit__'
      and result_winner_school_slug = 'away-f' and graded_at is not null
  ) then raise exception 'Forfeit did not grade from the explicit winner'; end if;
  if not exists (
    select 1 from public.pickem_picks picks
    join public.pickem_games games on games.id = picks.pickem_game_id
    where games.game_id = '__scoreless_forfeit__'
      and picks.user_id = (select value from scoreless_outcome_ids where key = 'member')
      and picks.picked_school_slug = 'away-f' and picks.is_correct is true
  ) then raise exception 'Winning saved pick was not preserved and graded'; end if;
  if not exists (
    select 1 from public.pickem_picks picks
    join public.pickem_games games on games.id = picks.pickem_game_id
    where games.game_id = '__scoreless_forfeit__'
      and picks.user_id = (select value from scoreless_outcome_ids where key = 'moderator')
      and picks.picked_school_slug = 'home-f' and picks.is_correct is false
  ) then raise exception 'Losing saved pick was not preserved and graded'; end if;
  if not exists (
    select 1 from public.score_submissions
    where game_id = '__scoreless_forfeit__' and status = 'superseded'
  ) then raise exception 'Pending numeric report was not preserved as superseded history'; end if;
end
$forfeit_result$;

-- Same expected revision is stale; the current revision is a duplicate final.
select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'admin'), true);
set local role authenticated;
do $stale_and_duplicate$
declare blocked boolean := false;
begin
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 0, 'forfeit', 'away-f', 'Source', 'Stale attempt', 'away-f', 'home-f'
  ); exception when serialization_failure then blocked := true; end;
  if not blocked then raise exception 'Stale scoreless request was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_originate_canonical_game_outcome(
    '__scoreless_forfeit__', 1, 'forfeit', 'away-f', 'Source', 'Duplicate attempt', 'away-f', 'home-f'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Duplicate scoreless final was accepted'; end if;
end
$stale_and_duplicate$;
reset role;

-- Originate a no-contest when no dynamic state row exists.
select set_config('request.jwt.claim.sub', (select value::text from scoreless_outcome_ids where key = 'admin'), true);
set local role authenticated;
select * from public.admin_originate_canonical_game_outcome(
  '__scoreless_no_contest__', 0, 'no_contest', null,
  'UIL official ruling', 'Game will not be played and has no winner',
  'away-n', 'home-n'
);
reset role;

do $no_contest_result$
begin
  if not exists (
    select 1 from public.game_state
    where game_id = '__scoreless_no_contest__'
      and status = 'final' and verified is true
      and result_type = 'no_contest' and official_winner_school_slug is null
      and home_score is null and away_score is null and outcome_revision = 1
  ) then raise exception 'Absent-state no-contest was not stored canonically'; end if;
  if exists (
    select 1 from public.pickem_picks picks
    join public.pickem_games games on games.id = picks.pickem_game_id
    where games.game_id = '__scoreless_no_contest__' and picks.is_correct is not null
  ) then raise exception 'No-contest graded a saved pick as a win or loss'; end if;
  if (select count(*) from public.pickem_picks picks
      join public.pickem_games games on games.id = picks.pickem_game_id
      where games.game_id = '__scoreless_no_contest__') <> 2 then
    raise exception 'No-contest deleted saved picks';
  end if;
end
$no_contest_result$;

do $audit_and_notifications$
begin
  if (select count(*) from private.game_outcome_audit where game_id like '__scoreless_%') <> 2 then
    raise exception 'Successful originations did not create exactly two audit rows';
  end if;
  if exists (
    select 1 from private.game_outcome_audit
    where game_id like '__scoreless_%'
      and (actor_id is null or source is null or btrim(source) = ''
        or reason is null or btrim(reason) = ''
        or previous_status is null or new_status <> 'final'
        or previous_verified is null or new_verified is not true
        or new_outcome_revision <> previous_outcome_revision + 1)
  ) then raise exception 'Scoreless outcome audit row is incomplete'; end if;
  if exists (
    select 1 from private.product_notification_events
    where source_key in ('game-final:__scoreless_forfeit__', 'game-final:__scoreless_no_contest__')
  ) then raise exception 'Scoreless outcome created a product notification event'; end if;
  if exists (
    select 1 from private.product_email_deliveries delivery
    join private.product_notification_events event on event.id = delivery.event_id
    where event.source_key in ('game-final:__scoreless_forfeit__', 'game-final:__scoreless_no_contest__')
  ) then raise exception 'Scoreless outcome created an email delivery'; end if;
end
$audit_and_notifications$;

do $security_shape$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_originate_canonical_game_outcome'
      and p.prosecdef
      and p.proconfig @> array['search_path=""']::text[]
  ) then raise exception 'Trusted scoreless function lacks SECURITY DEFINER or safe search_path'; end if;
  if has_function_privilege(
      'anon',
      'public.admin_originate_canonical_game_outcome(text,bigint,text,text,text,text,text,text)',
      'EXECUTE'
    ) or has_function_privilege(
      'public',
      'public.admin_originate_canonical_game_outcome(text,bigint,text,text,text,text,text,text)',
      'EXECUTE'
    ) then raise exception 'Scoreless function execute grants are broader than authenticated'; end if;
  if not has_function_privilege(
      'authenticated',
      'public.admin_originate_canonical_game_outcome(text,bigint,text,text,text,text,text,text)',
      'EXECUTE'
    ) then raise exception 'Authenticated role cannot reach the internally authorized function'; end if;
end
$security_shape$;

select 'pickem_scoreless_outcome_origination' as suite, true as passed;

rollback;

-- Administrator canonical-outcome operation regression suite.
-- All fixtures and changes are synthetic and rolled back.

begin;

create temporary table admin_outcome_ids (
  key text primary key,
  value uuid not null
) on commit drop;

insert into admin_outcome_ids
select 'admin', user_id from public.user_roles
where role = 'admin' order by user_id limit 1;
insert into admin_outcome_ids
select 'moderator', user_id from public.user_roles
where role = 'moderator' order by user_id limit 1;
insert into admin_outcome_ids
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
  if (select count(*) from admin_outcome_ids) <> 3 then
    raise exception 'Admin-outcome suite requires an active administrator, moderator, and ordinary member';
  end if;
end
$preflight$;

grant select on admin_outcome_ids to anon, authenticated;

do $fixtures$
declare
  week_id uuid;
  pickem_game_id uuid;
begin
  insert into public.pickem_weeks (season, week, title, status)
  values (2097, 1, '__admin_outcome_audit__', 'open')
  returning id into week_id;

  insert into public.pickem_games (
    week_id, game_id, lock_at, away_school_slug, home_school_slug
  ) values (
    week_id, '__admin_outcome_game__', now() + interval '2 hours', 'away-a', 'home-a'
  ) returning id into pickem_game_id;

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values
    (pickem_game_id, (select value from admin_outcome_ids where key = 'member'), 'away-a'),
    (pickem_game_id, (select value from admin_outcome_ids where key = 'moderator'), 'home-a');

  insert into public.game_state (
    game_id, status, home_score, away_score, verified, verified_at,
    updated_by, result_type, away_school_slug, home_school_slug
  ) values (
    '__admin_outcome_game__', 'final', 14, 21, true, now(),
    (select value from admin_outcome_ids where key = 'admin'),
    'played', 'away-a', 'home-a'
  );
end
$fixtures$;

do $initial_grading$
begin
  if (select count(*) from public.pickem_picks picks
      join public.pickem_games games on games.id = picks.pickem_game_id
      where games.game_id = '__admin_outcome_game__') <> 2 then
    raise exception 'Synthetic picks were not created';
  end if;
  if not exists (
    select 1 from public.pickem_picks picks
    join public.pickem_games games on games.id = picks.pickem_game_id
    where games.game_id = '__admin_outcome_game__'
      and picks.user_id = (select value from admin_outcome_ids where key = 'member')
      and picks.is_correct is true
  ) then raise exception 'Initial played result did not grade the away pick'; end if;
end
$initial_grading$;

-- Anonymous, ordinary, moderator, and inactive-admin callers are rejected.
set local role anon;
do $anon$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_set_canonical_game_outcome(
      '__admin_outcome_game__', 0, 'forfeit', 'home-a', 'Anonymous attempt'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Anonymous caller was not rejected'; end if;
end
$anon$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key = 'member'), true);
set local role authenticated;
do $member$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_set_canonical_game_outcome(
      '__admin_outcome_game__', 0, 'forfeit', 'home-a', 'Forged actor ' ||
      (select value::text from admin_outcome_ids where key = 'admin')
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ordinary member or forged actor value bypassed authorization'; end if;
end
$member$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key = 'moderator'), true);
set local role authenticated;
do $moderator$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_set_canonical_game_outcome(
      '__admin_outcome_game__', 0, 'forfeit', 'home-a', 'Moderator attempt'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator caller was not rejected'; end if;

  blocked := false;
  begin
    update public.game_state set result_type = 'forfeit', official_winner_school_slug = 'home-a'
    where game_id = '__admin_outcome_game__';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Moderator bypassed the trusted operation with a direct outcome update'; end if;
end
$moderator$;
reset role;

update public.member_account_status
set status = 'suspended', suspended_at = now(), suspended_by = null
where user_id = (select value from admin_outcome_ids where key = 'admin');
select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key = 'admin'), true);
set local role authenticated;
do $inactive_admin$
declare blocked boolean := false;
begin
  begin
    perform * from public.admin_set_canonical_game_outcome(
      '__admin_outcome_game__', 0, 'forfeit', 'home-a', 'Inactive administrator attempt'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Inactive administrator was not rejected'; end if;
end
$inactive_admin$;
reset role;
update public.member_account_status
set status = 'active', suspended_at = null, suspended_by = null
where user_id = (select value from admin_outcome_ids where key = 'admin');

-- Successful forfeit and correction grade only from the explicit winner.
select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key = 'admin'), true);
set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 0, 'forfeit', 'home-a', 'Official home-team forfeit ruling'
);
reset role;

do $home_forfeit$
begin
  if not exists (
    select 1 from public.game_state where game_id = '__admin_outcome_game__'
      and result_type = 'forfeit' and official_winner_school_slug = 'home-a'
      and outcome_revision = 1
  ) then raise exception 'Home forfeit result was not stored canonically'; end if;
  if not exists (
    select 1 from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
    where games.game_id='__admin_outcome_game__'
      and picks.user_id=(select value from admin_outcome_ids where key='moderator')
      and picks.is_correct is true
  ) then raise exception 'Forfeit did not grade from explicit home winner'; end if;
end
$home_forfeit$;

set local role authenticated;
do $no_change$
declare blocked boolean := false;
begin
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 1, 'forfeit', 'home-a', 'Repeated processing'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Repeated identical processing was not rejected'; end if;
end
$no_change$;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 1, 'forfeit', 'away-a', 'Corrected official forfeit winner'
);
reset role;

do $away_forfeit$
begin
  if not exists (
    select 1 from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
    where games.game_id='__admin_outcome_game__'
      and picks.user_id=(select value from admin_outcome_ids where key='member')
      and picks.is_correct is true
  ) then raise exception 'Forfeit winner correction did not regrade from explicit away winner'; end if;
end
$away_forfeit$;

-- Invalid/missing winners and stale revisions fail without partial writes.
set local role authenticated;
do $failed_forfeit$
declare
  blocked boolean;
begin
  blocked := false;
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 2, 'forfeit', null, 'Missing winner'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Forfeit without winner was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 2, 'forfeit', 'outsider', 'Invalid winner'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Nonparticipating forfeit winner was accepted'; end if;

  blocked := false;
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 1, 'no_contest', null, 'Stale edit'
  ); exception when serialization_failure then blocked := true; end;
  if not blocked then raise exception 'Stale outcome revision was accepted'; end if;

end
$failed_forfeit$;
reset role;

do $failed_forfeit_atomicity$
begin
  if not exists (
    select 1 from public.game_state where game_id='__admin_outcome_game__'
      and result_type='forfeit' and official_winner_school_slug='away-a'
      and outcome_revision=2
  ) or (select count(*) from private.game_outcome_audit where game_id='__admin_outcome_game__') <> 2 then
    raise exception 'Failed validation caused a partial canonical or audit write';
  end if;
  if not exists (
    select 1 from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
    where games.game_id='__admin_outcome_game__'
      and picks.user_id=(select value from admin_outcome_ids where key='member')
      and picks.is_correct is true
  ) then raise exception 'Failed validation changed an authoritative grade or total'; end if;
end
$failed_forfeit_atomicity$;

-- Forfeit to no-contest clears grades/totals without deleting selections.
set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 2, 'no_contest', null, 'Official no-contest ruling'
);
reset role;

do $no_contest$
begin
  if exists (
    select 1 from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
    where games.game_id='__admin_outcome_game__' and picks.is_correct is not null
  ) then raise exception 'No-contest retained grades'; end if;
  if exists (
    select 1 from public.pickem_member_totals
    where season=2097 and user_id in (select value from admin_outcome_ids)
  ) then raise exception 'No-contest retained eligible-denominator totals'; end if;
  if (select count(*) from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
      where games.game_id='__admin_outcome_game__') <> 2 then
    raise exception 'No-contest deleted saved picks';
  end if;
end
$no_contest$;

-- No-contest to played derives the winner from unequal scores.
set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 3, 'played', null, 'Return to verified played result'
);
reset role;

do $played$
begin
  if not exists (
    select 1 from public.pickem_games where game_id='__admin_outcome_game__'
      and result_winner_school_slug='away-a' and graded_at is not null
  ) then raise exception 'Return to played did not derive the away winner from scores'; end if;
end
$played$;

-- Played to tie atomically corrects the scores and outcome without an invalid intermediate row.
set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 4, 'tie', null, 'Verified official tie', 14, 14
);
do $equal_played_rejected$
declare blocked boolean := false;
begin
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 5, 'played', null, 'Invalid played attempt'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Equal-score played result was accepted'; end if;
end
$equal_played_rejected$;
reset role;

do $tie$
begin
  if (select official_winner_school_slug from public.game_state where game_id='__admin_outcome_game__') is not null then
    raise exception 'Tie retained an official winner';
  end if;
  if exists (
    select 1 from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
    where games.game_id='__admin_outcome_game__' and picks.is_correct is not null
  ) then raise exception 'Tie retained grades'; end if;
end
$tie$;

set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 5, 'played', null, 'Corrected unequal final scores', 10, 24
);
reset role;

do $played_home$
begin
  if not exists (
    select 1 from public.pickem_games where game_id='__admin_outcome_game__'
      and result_winner_school_slug='home-a'
  ) then raise exception 'Tie-to-played did not replace the stale exceptional outcome'; end if;
  if (select count(*) from public.pickem_picks picks join public.pickem_games games on games.id=picks.pickem_game_id
      where games.game_id='__admin_outcome_game__') <> 2 then
    raise exception 'Return to played deleted saved picks';
  end if;
end
$played_home$;

-- Missing-score played and unequal-score tie fail atomically.
set local role authenticated;
do $invalid_shapes$
declare blocked boolean := false;
begin
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 6, 'tie', null, 'Invalid unequal tie'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Unequal-score tie was accepted'; end if;
end
$invalid_shapes$;
reset role;

update public.game_state
set result_type='no_contest', official_winner_school_slug=null, away_score=null, home_score=null
where game_id='__admin_outcome_game__';
set local role authenticated;
do $missing_scores$
declare blocked boolean := false;
begin
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 6, 'played', null, 'Missing scores'
  ); exception when invalid_parameter_value then blocked := true; end;
  if not blocked then raise exception 'Played without scores was accepted'; end if;
end
$missing_scores$;
reset role;

-- Two logically competing corrections using the same expected revision cannot both succeed.
set local role authenticated;
select * from public.admin_set_canonical_game_outcome(
  '__admin_outcome_game__', 6, 'played', null, 'First competing correction', 17, 10
);
do $competing$
declare blocked boolean := false;
begin
  begin perform * from public.admin_set_canonical_game_outcome(
    '__admin_outcome_game__', 6, 'forfeit', 'home-a', 'Second competing correction'
  ); exception when serialization_failure then blocked := true; end;
  if not blocked then raise exception 'Second competing edit silently succeeded'; end if;
end
$competing$;
reset role;

-- Successful changes create complete immutable audit rows; rejected changes do not.
do $audit$
declare
  success_count integer;
begin
  select count(*) into success_count from private.game_outcome_audit
  where game_id='__admin_outcome_game__';
  if success_count <> 7 then
    raise exception 'Expected 7 successful-change audit rows, found %', success_count;
  end if;
  if exists (
    select 1 from private.game_outcome_audit
    where game_id='__admin_outcome_game__'
      and (actor_id is null or reason is null or btrim(reason)=''
        or new_result_type is null or previous_status is null or new_status is null
        or previous_verified is null or new_verified is null
        or new_outcome_revision <> previous_outcome_revision + 1)
  ) then raise exception 'Outcome audit row is incomplete'; end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='private' and table_name='game_outcome_audit'
      and column_name in ('picked_school_slug','pickem_game_id','member_id','user_id')
  ) then raise exception 'Outcome audit stores member-selection data'; end if;
end
$audit$;

select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key='member'), true);
set local role authenticated;
do $audit_access$
declare blocked boolean := false;
begin
  begin execute 'select count(*) from private.game_outcome_audit';
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Ordinary member read private outcome audit'; end if;

  blocked := false;
  begin execute $sql$insert into private.game_outcome_audit (
    game_id, reason, new_result_type, previous_status, new_status,
    previous_verified, new_verified, previous_outcome_revision, new_outcome_revision
  ) values ('forged','forged','tie','final','final',true,true,0,1)$sql$;
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Ordinary member inserted a forged outcome audit'; end if;
end
$audit_access$;
reset role;

set local role anon;
do $anon_audit_access$
declare blocked boolean := false;
begin
  begin execute 'select count(*) from private.game_outcome_audit';
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Anonymous caller read private outcome audit'; end if;
  blocked := false;
  begin execute 'delete from private.game_outcome_audit';
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Anonymous caller mutated private outcome audit'; end if;
end
$anon_audit_access$;
reset role;

select set_config('request.jwt.claim.sub', (select value::text from admin_outcome_ids where key='moderator'), true);
set local role authenticated;
do $moderator_audit_access$
declare blocked boolean := false;
begin
  begin execute 'select count(*) from private.game_outcome_audit';
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Moderator read private outcome audit'; end if;
  blocked := false;
  begin execute 'update private.game_outcome_audit set reason=reason';
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Moderator mutated private outcome audit'; end if;
end
$moderator_audit_access$;
reset role;

do $security_shape$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='admin_set_canonical_game_outcome'
      and p.prosecdef and p.proconfig @> array['search_path=""']::text[]
  ) then raise exception 'Trusted outcome function lacks SECURITY DEFINER or safe search_path'; end if;
  if has_function_privilege('anon', 'public.admin_set_canonical_game_outcome(text,bigint,text,text,text,integer,integer)', 'EXECUTE')
    or has_function_privilege('public', 'public.admin_set_canonical_game_outcome(text,bigint,text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Outcome function execute grants are broader than authenticated';
  end if;
  if not has_function_privilege('authenticated', 'public.admin_set_canonical_game_outcome(text,bigint,text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Authenticated role cannot reach the internally authorized outcome function';
  end if;
end
$security_shape$;

-- Correcting an already verified final must not enqueue email or notification work.
do $notifications$
begin
  if exists (
    select 1 from private.product_notification_events where source_key='game-final:__admin_outcome_game__'
  ) or exists (
    select 1 from private.product_email_deliveries delivery
    join private.product_notification_events event on event.id=delivery.event_id
    where event.source_key='game-final:__admin_outcome_game__'
  ) then raise exception 'Outcome corrections created notification or email work'; end if;
end
$notifications$;

select 'pickem_admin_outcomes' as suite, true as passed;

rollback;

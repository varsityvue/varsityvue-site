-- Deterministic Pick 'Em lifecycle regression test.
-- Run only against an isolated/local database or through a single transaction.
-- Synthetic game IDs are intentionally absent from the notification registry,
-- and every fixture is rolled back.

begin;

do $audit$
declare
  member_a uuid;
  member_b uuid;
  week_one uuid;
  week_two uuid;
  other_season uuid;
  away_game uuid;
  home_game uuid;
  pending_game uuid;
  unverified_game uuid;
  other_week_game uuid;
  other_season_game uuid;
  before_game uuid;
  exact_game uuid;
  after_game uuid;
  graded integer;
  correct integer;
  row_total integer;
  blocked boolean;
begin
  select user_id into member_a
  from public.member_account_status
  where status = 'active'
  order by user_id
  limit 1;

  select user_id into member_b
  from public.member_account_status
  where status = 'active' and user_id <> member_a
  order by user_id
  limit 1;

  if member_a is null or member_b is null then
    raise exception 'Pick Em lifecycle test requires two active fixture identities';
  end if;

  insert into public.pickem_weeks (season, week, title, status)
  values (2098, 1, '__pickem_audit_week_1__', 'open') returning id into week_one;
  insert into public.pickem_weeks (season, week, title, status)
  values (2098, 2, '__pickem_audit_week_2__', 'open') returning id into week_two;
  insert into public.pickem_weeks (season, week, title, status)
  values (2099, 1, '__pickem_audit_other_season__', 'open') returning id into other_season;

  insert into public.pickem_games (week_id, game_id, sort_order, lock_at, away_school_slug, home_school_slug)
  values
    (week_one, '__pickem_audit_away__', 1, now() + interval '1 hour', 'away-a', 'home-a'),
    (week_one, '__pickem_audit_home__', 2, now() + interval '1 hour', 'away-b', 'home-b'),
    (week_one, '__pickem_audit_pending__', 3, now() + interval '1 hour', 'away-c', 'home-c'),
    (week_one, '__pickem_audit_unverified__', 4, now() + interval '1 hour', 'away-d', 'home-d'),
    (week_two, '__pickem_audit_week_2_game__', 1, now() + interval '1 hour', 'away-e', 'home-e'),
    (other_season, '__pickem_audit_other_season_game__', 1, now() + interval '1 hour', 'away-f', 'home-f');

  select id into away_game from public.pickem_games where game_id = '__pickem_audit_away__';
  select id into home_game from public.pickem_games where game_id = '__pickem_audit_home__';
  select id into pending_game from public.pickem_games where game_id = '__pickem_audit_pending__';
  select id into unverified_game from public.pickem_games where game_id = '__pickem_audit_unverified__';
  select id into other_week_game from public.pickem_games where game_id = '__pickem_audit_week_2_game__';
  select id into other_season_game from public.pickem_games where game_id = '__pickem_audit_other_season_game__';

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values
    (away_game, member_a, 'away-a'),
    (away_game, member_b, 'home-a'),
    (home_game, member_a, 'home-b'),
    (home_game, member_b, 'away-b'),
    (pending_game, member_a, 'away-c'),
    (unverified_game, member_a, 'away-d'),
    (other_week_game, member_a, 'home-e'),
    (other_season_game, member_a, 'away-f');

  insert into public.game_state (game_id, status, home_score, away_score, verified, verified_at, result_type)
  values
    ('__pickem_audit_away__', 'final', 7, 21, true, now(), 'played'),
    ('__pickem_audit_home__', 'final', 24, 10, true, now(), 'played'),
    ('__pickem_audit_unverified__', 'final', 3, 14, false, null, null),
    ('__pickem_audit_week_2_game__', 'final', 28, 7, true, now(), 'played'),
    ('__pickem_audit_other_season_game__', 'final', 0, 35, true, now(), 'played');

  if not (select is_correct is true from public.pickem_picks where pickem_game_id = away_game and user_id = member_a) then
    raise exception 'Away pick with away win was not correct';
  end if;
  if not (select is_correct is false from public.pickem_picks where pickem_game_id = away_game and user_id = member_b) then
    raise exception 'Home pick with away win was not incorrect';
  end if;
  if not (select is_correct is true from public.pickem_picks where pickem_game_id = home_game and user_id = member_a) then
    raise exception 'Home pick with home win was not correct';
  end if;
  if not (select is_correct is false from public.pickem_picks where pickem_game_id = home_game and user_id = member_b) then
    raise exception 'Away pick with home win was not incorrect';
  end if;
  if not (select is_correct is null from public.pickem_picks where pickem_game_id = pending_game and user_id = member_a) then
    raise exception 'Scheduled game did not remain pending';
  end if;
  if not (select is_correct is null from public.pickem_picks where pickem_game_id = unverified_game and user_id = member_a) then
    raise exception 'Unverified final was graded';
  end if;

  select graded_picks, correct_picks into graded, correct
  from public.pickem_member_totals where season = 2098 and user_id = member_a;
  if graded <> 3 or correct <> 3 then
    raise exception 'Cross-week season total mismatch: % graded, % correct', graded, correct;
  end if;

  select graded_picks, correct_picks into graded, correct
  from public.pickem_member_totals where season = 2099 and user_id = member_a;
  if graded <> 1 or correct <> 1 then
    raise exception 'Cross-season isolation failed';
  end if;

  select count(*) filter (where picks.is_correct is not null),
         count(*) filter (where picks.is_correct = true)
  into graded, correct
  from public.pickem_picks picks
  join public.pickem_games games on games.id = picks.pickem_game_id
  where games.week_id = week_one and picks.user_id = member_a;
  if graded <> 2 or correct <> 2 then
    raise exception 'Weekly total mismatch';
  end if;

  update public.game_state set updated_at = now() where game_id = '__pickem_audit_away__';
  select graded_picks, correct_picks into graded, correct
  from public.pickem_member_totals where season = 2098 and user_id = member_a;
  if graded <> 3 or correct <> 3 then raise exception 'Repeated processing changed totals'; end if;

  update public.game_state set home_score = 31, away_score = 14
  where game_id = '__pickem_audit_away__';
  if not (select is_correct is true from public.pickem_picks where pickem_game_id = away_game and user_id = member_b) then
    raise exception 'Corrected winner did not make the opposing pick correct';
  end if;
  select graded_picks, correct_picks into graded, correct
  from public.pickem_member_totals where season = 2098 and user_id = member_a;
  if graded <> 3 or correct <> 2 then raise exception 'Winner correction did not regrade totals'; end if;

  update public.game_state set home_score = 14, away_score = 14, result_type = 'tie'
  where game_id = '__pickem_audit_away__';
  if not (select is_correct is null from public.pickem_picks where pickem_game_id = away_game and user_id = member_a) then
    raise exception 'Tie correction retained a stale grade';
  end if;
  if not (select is_correct is null from public.pickem_picks where pickem_game_id = away_game and user_id = member_b) then
    raise exception 'Tie correction retained a stale opposing grade';
  end if;
  if exists (
    select 1 from public.pickem_member_totals
    where season = 2098 and user_id not in (member_a, member_b)
  ) then
    raise exception 'A member without audit picks received phantom audit points';
  end if;

  update public.game_state
  set status = 'cancelled', verified = true, home_score = null, away_score = null,
      result_type = null, official_winner_school_slug = null
  where game_id = '__pickem_audit_home__';
  if exists (
    select 1 from public.pickem_picks
    where pickem_game_id = home_game and is_correct is not null
  ) then
    raise exception 'Cancellation retained stale grades';
  end if;

  insert into public.pickem_games (week_id, game_id, sort_order, lock_at, away_school_slug, home_school_slug)
  values
    (week_one, '__pickem_audit_before__', 10, now() + interval '1 second', 'before-away', 'before-home'),
    (week_one, '__pickem_audit_exact__', 11, now(), 'exact-away', 'exact-home'),
    (week_one, '__pickem_audit_after__', 12, now() - interval '1 second', 'after-away', 'after-home');
  select id into before_game from public.pickem_games where game_id = '__pickem_audit_before__';
  select id into exact_game from public.pickem_games where game_id = '__pickem_audit_exact__';
  select id into after_game from public.pickem_games where game_id = '__pickem_audit_after__';

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values (before_game, member_a, 'before-away');

  blocked := false;
  begin
    insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
    values (exact_game, member_a, 'exact-away');
  exception when others then blocked := position('locked' in lower(sqlerrm)) > 0;
  end;
  if not blocked then raise exception 'Exact-kickoff pick was not rejected'; end if;

  blocked := false;
  begin
    insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
    values (after_game, member_a, 'after-away');
  exception when others then blocked := position('locked' in lower(sqlerrm)) > 0;
  end;
  if not blocked then raise exception 'Post-kickoff pick was not rejected'; end if;

  blocked := false;
  begin
    insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
    values (before_game, member_b, 'not-a-team');
  exception when others then blocked := position('invalid team' in lower(sqlerrm)) > 0;
  end;
  if not blocked then raise exception 'Non-matchup team was not rejected'; end if;

  insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
  values (before_game, member_b, 'before-away')
  on conflict (pickem_game_id, user_id) do update
  set picked_school_slug = excluded.picked_school_slug;
  update public.pickem_picks set picked_school_slug = 'before-home'
  where pickem_game_id = before_game and user_id = member_b;
  select count(*) into row_total from public.pickem_picks
  where pickem_game_id = before_game and user_id = member_b;
  if row_total <> 1 then raise exception 'Resave created duplicate logical picks'; end if;
end
$audit$;

select 'pickem_lifecycle' as suite, true as passed;

rollback;

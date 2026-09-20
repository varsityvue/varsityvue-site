-- Harden the dormant Pick 'Em foundation before exposing member picks.

alter table public.pickem_games
  add column away_school_slug text,
  add column home_school_slug text;

alter table public.pickem_games
  add constraint pickem_games_distinct_teams
  check (away_school_slug is null or home_school_slug is null or away_school_slug <> home_school_slug);

create or replace function private.enforce_pickem_pick_lock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_game public.pickem_games%rowtype;
  selected_week public.pickem_weeks%rowtype;
begin
  -- Grading changes do not alter the member's selection and must remain
  -- possible after kickoff. RLS prevents members from grading themselves.
  if tg_op = 'UPDATE'
    and new.pickem_game_id = old.pickem_game_id
    and new.user_id = old.user_id
    and new.picked_school_slug = old.picked_school_slug then
    return new;
  end if;

  select * into selected_game
  from public.pickem_games
  where id = new.pickem_game_id;

  if not found then
    raise exception 'Pick Em game not found';
  end if;

  select * into selected_week
  from public.pickem_weeks
  where id = selected_game.week_id;

  if selected_week.status <> 'open'::public.pickem_week_status then
    raise exception 'This Pick Em slate is not open';
  end if;

  if now() >= selected_game.lock_at then
    raise exception 'This game is locked';
  end if;

  if selected_game.away_school_slug is null
    or selected_game.home_school_slug is null
    or new.picked_school_slug not in (
      selected_game.away_school_slug,
      selected_game.home_school_slug
    ) then
    raise exception 'Invalid team selection';
  end if;

  new.is_correct := null;
  return new;
end;
$$;

revoke all on function private.enforce_pickem_pick_lock() from public, anon, authenticated;

create trigger pickem_pick_lock_guard
before insert or update on public.pickem_picks
for each row execute function private.enforce_pickem_pick_lock();

create table public.pickem_member_totals (
  season integer not null check (season >= 2000),
  user_id uuid not null references public.profiles(id) on delete cascade,
  graded_picks integer not null default 0 check (graded_picks >= 0),
  correct_picks integer not null default 0 check (correct_picks >= 0),
  incorrect_picks integer not null default 0 check (incorrect_picks >= 0),
  updated_at timestamptz not null default now(),
  primary key (season, user_id),
  constraint pickem_member_totals_math
    check (graded_picks = correct_picks + incorrect_picks)
);

alter table public.pickem_member_totals enable row level security;

grant select on table public.pickem_member_totals to anon, authenticated;

create policy "Pickem totals are publicly readable"
on public.pickem_member_totals for select
to anon, authenticated
using (true);

create or replace function private.refresh_pickem_member_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  target_season integer;
  total_graded integer;
  total_correct integer;
  total_incorrect integer;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.user_id;
  else
    target_user_id := new.user_id;
  end if;

  select pickem_weeks.season into target_season
  from public.pickem_games
  join public.pickem_weeks on pickem_weeks.id = pickem_games.week_id
  where pickem_games.id = case when tg_op = 'DELETE' then old.pickem_game_id else new.pickem_game_id end;

  if target_season is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select
    count(*) filter (where picks.is_correct is not null)::integer,
    count(*) filter (where picks.is_correct = true)::integer,
    count(*) filter (where picks.is_correct = false)::integer
  into total_graded, total_correct, total_incorrect
  from public.pickem_picks picks
  join public.pickem_games games on games.id = picks.pickem_game_id
  join public.pickem_weeks weeks on weeks.id = games.week_id
  where picks.user_id = target_user_id
    and weeks.season = target_season;

  if total_graded = 0 then
    delete from public.pickem_member_totals
    where season = target_season and user_id = target_user_id;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.pickem_member_totals (
    season,
    user_id,
    graded_picks,
    correct_picks,
    incorrect_picks,
    updated_at
  )
  values (
    target_season,
    target_user_id,
    total_graded,
    total_correct,
    total_incorrect,
    now()
  )
  on conflict (season, user_id) do update
  set graded_picks = excluded.graded_picks,
      correct_picks = excluded.correct_picks,
      incorrect_picks = excluded.incorrect_picks,
      updated_at = excluded.updated_at;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.refresh_pickem_member_total() from public, anon, authenticated;

create trigger pickem_member_total_refresh
after insert or update or delete on public.pickem_picks
for each row execute function private.refresh_pickem_member_total();

drop view public.pickem_standings;

create view public.pickem_standings
with (security_invoker = true)
as
select
  totals.season,
  totals.user_id,
  profiles.display_name,
  profiles.username,
  totals.graded_picks,
  totals.correct_picks,
  totals.incorrect_picks,
  case
    when totals.graded_picks = 0 then 0::numeric
    else round(100.0 * totals.correct_picks / totals.graded_picks, 1)
  end as accuracy_pct
from public.pickem_member_totals totals
join public.profiles profiles on profiles.id = totals.user_id;

grant select on public.pickem_standings to anon, authenticated;

create view public.pickem_game_cards
with (security_invoker = true)
as
select
  games.id,
  games.week_id,
  games.game_id,
  games.sort_order,
  games.lock_at,
  games.away_school_slug,
  games.home_school_slug,
  games.result_winner_school_slug,
  games.graded_at,
  (weeks.status <> 'open'::public.pickem_week_status or now() >= games.lock_at) as is_locked
from public.pickem_games games
join public.pickem_weeks weeks on weeks.id = games.week_id;

grant select on public.pickem_game_cards to anon, authenticated;

-- Week 5 launch slate: every tracked Week 5 matchup except Albany's bye.
insert into public.pickem_weeks (
  season,
  week,
  title,
  status,
  opens_at,
  closes_at
)
values (
  2026,
  5,
  'Week 5 Pick Em',
  'open',
  '2026-09-20T00:00:00Z',
  '2026-09-26T00:00:00Z'
)
on conflict (season, week) do update
set title = excluded.title,
    status = excluded.status,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at;

insert into public.pickem_games (
  week_id,
  game_id,
  sort_order,
  lock_at,
  away_school_slug,
  home_school_slug
)
select
  weeks.id,
  slate.game_id,
  slate.sort_order,
  slate.lock_at,
  slate.away_school_slug,
  slate.home_school_slug
from public.pickem_weeks weeks
cross join (values
  ('jacksboro-at-cisco-2026-week-5', 1, '2026-09-26T00:00:00Z'::timestamptz, 'jacksboro', 'cisco'),
  ('stephenville-vs-canyon-west-plains-2026-week-5', 2, '2026-09-26T00:00:00Z'::timestamptz, 'canyon-west-plains', 'stephenville'),
  ('tolar-at-comanche-2026-week-5', 3, '2026-09-26T00:00:00Z'::timestamptz, 'tolar', 'comanche'),
  ('early-at-de-leon-2026-week-5', 4, '2026-09-26T00:00:00Z'::timestamptz, 'early', 'de-leon'),
  ('florence-at-hico-2026-week-5', 5, '2026-09-26T00:00:00Z'::timestamptz, 'florence', 'hico'),
  ('hawley-at-post-2026-week-5', 6, '2026-09-26T00:00:00Z'::timestamptz, 'hawley', 'post'),
  ('miles-at-stamford-2026-week-5', 7, '2026-09-26T00:00:00Z'::timestamptz, 'miles', 'stamford'),
  ('winters-at-goldthwaite-2026-week-5', 8, '2026-09-26T00:00:00Z'::timestamptz, 'winters', 'goldthwaite'),
  ('crawford-at-santo-2026-week-5', 9, '2026-09-26T00:00:00Z'::timestamptz, 'crawford', 'santo')
) as slate(game_id, sort_order, lock_at, away_school_slug, home_school_slug)
where weeks.season = 2026 and weeks.week = 5
on conflict (week_id, game_id) do update
set sort_order = excluded.sort_order,
    lock_at = excluded.lock_at,
    away_school_slug = excluded.away_school_slug,
    home_school_slug = excluded.home_school_slug;

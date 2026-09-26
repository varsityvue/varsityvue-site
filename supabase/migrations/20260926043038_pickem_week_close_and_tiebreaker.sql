-- Week 5 has no prediction field and remains historical. Configure a GOTW
-- pickem_game only for a future week before opening that slate.
alter table public.pickem_weeks
  add column tiebreaker_game_id uuid references public.pickem_games(id);

create table public.pickem_week_tiebreakers (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  predicted_total integer not null check (predicted_total between 0 and 300),
  submitted_at timestamptz not null default now(),
  primary key (week_id, user_id)
);

alter table public.pickem_week_tiebreakers enable row level security;
grant select, insert, update on public.pickem_week_tiebreakers to authenticated;
create policy "Entrants read own prediction and closed-week predictions"
on public.pickem_week_tiebreakers for select to authenticated
using (user_id = auth.uid() or private.can_moderate_scores() or exists (
  select 1 from public.pickem_weeks week where week.id = week_id
    and week.closes_at is not null and now() >= week.closes_at
));
create policy "Entrants create own prediction"
on public.pickem_week_tiebreakers for insert to authenticated
with check (user_id = auth.uid());
create policy "Entrants update own prediction"
on public.pickem_week_tiebreakers for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function private.enforce_week_tiebreaker_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare selected_week public.pickem_weeks%rowtype;
begin
  select * into selected_week from public.pickem_weeks where id = new.week_id;
  if selected_week.id is null or selected_week.tiebreaker_game_id is null
    or (selected_week.season = 2026 and selected_week.week < 6)
    or selected_week.status <> 'open'::public.pickem_week_status
    or selected_week.closes_at is null or now() >= selected_week.closes_at
    or not exists (select 1 from public.pickem_games game
      where game.id = selected_week.tiebreaker_game_id and game.week_id = selected_week.id)
  then raise exception 'This weekly tiebreaker is not open'; end if;
  if tg_op = 'UPDATE' and (new.week_id <> old.week_id or new.user_id <> old.user_id)
  then raise exception 'Prediction identity cannot be changed'; end if;
  new.submitted_at := now();
  return new;
end; $$;

revoke all on function private.enforce_week_tiebreaker_lock() from public, anon, authenticated;
create trigger pickem_week_tiebreaker_lock before insert or update
on public.pickem_week_tiebreakers for each row execute function private.enforce_week_tiebreaker_lock();

-- Preserve the grading exception from the existing per-game trigger while
-- enforcing the weekly submission boundary separately.
create or replace function private.enforce_pickem_pick_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare selected_game public.pickem_games%rowtype;
  selected_week public.pickem_weeks%rowtype;
begin
  if tg_op = 'UPDATE' and new.pickem_game_id = old.pickem_game_id
    and new.user_id = old.user_id and new.picked_school_slug = old.picked_school_slug
    and new.is_correct is distinct from old.is_correct then return new; end if;
  select * into selected_game from public.pickem_games where id = new.pickem_game_id;
  if selected_game.id is null then raise exception 'Pick Em game not found'; end if;
  select * into selected_week from public.pickem_weeks where id = selected_game.week_id;
  if selected_week.status <> 'open'::public.pickem_week_status
    or (selected_week.closes_at is not null and now() >= selected_week.closes_at)
  then raise exception 'This Pick Em slate is not open'; end if;
  if now() >= selected_game.lock_at then raise exception 'This game is locked'; end if;
  if selected_game.away_school_slug is null or selected_game.home_school_slug is null
    or new.picked_school_slug not in (selected_game.away_school_slug, selected_game.home_school_slug)
  then raise exception 'Invalid team selection'; end if;
  new.is_correct := null;
  return new;
end; $$;

create or replace view public.pickem_game_cards with (security_invoker = true) as
select games.id, games.week_id, games.game_id, games.sort_order, games.lock_at,
  games.away_school_slug, games.home_school_slug, games.result_winner_school_slug,
  games.graded_at,
  (weeks.status <> 'open'::public.pickem_week_status or
    (weeks.closes_at is not null and now() >= weeks.closes_at) or
    now() >= games.lock_at) as is_locked
from public.pickem_games games join public.pickem_weeks weeks on weeks.id = games.week_id;

-- Only closed weeks are public. No Week 5 prediction is synthesized. A void,
-- cancelled, postponed, scoreless forfeit or unverified GOTW has no total, so
-- its tiebreaker remains inactive. Exact remaining ties share a rank; user ID
-- is only a stable display order.
create view public.pickem_week_standings as
with totals as (
  select week.id as week_id, week.season, week.week, pick.user_id,
    count(*) filter (where pick.is_correct is not null)::integer as graded_picks,
    count(*) filter (where pick.is_correct = true)::integer as correct_picks,
    prediction.predicted_total,
    case when state.verified and state.status = 'final'
      and state.result_type in ('played', 'tie')
      and state.home_score is not null and state.away_score is not null
      then state.home_score + state.away_score end as actual_total
  from public.pickem_weeks week
  join public.pickem_games game on game.week_id = week.id
  join public.pickem_picks pick on pick.pickem_game_id = game.id
  left join public.pickem_week_tiebreakers prediction on prediction.week_id = week.id and prediction.user_id = pick.user_id
  left join public.pickem_games featured on featured.id = week.tiebreaker_game_id
  left join public.game_state state on state.game_id = featured.game_id
  where week.closes_at is not null and now() >= week.closes_at
  group by week.id, pick.user_id, prediction.predicted_total, state.verified,
    state.status, state.result_type, state.home_score, state.away_score
), ranked as (
  select totals.*, case when actual_total is not null and predicted_total is not null
    then abs(actual_total - predicted_total) end as distance
  from totals
)
select ranked.*, profiles.display_name, profiles.username,
  rank() over (partition by ranked.week_id order by ranked.correct_picks desc, ranked.distance asc nulls last) as weekly_rank
from ranked join public.profiles profiles on profiles.id = ranked.user_id;

grant select on public.pickem_week_standings to anon, authenticated;

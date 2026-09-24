-- Give active administrators a privacy-preserving Pick 'Em submission view.
-- Raw selections remain owner-readable only; the RPC reveals each selection
-- independently when that game's authoritative Pick 'Em lock has passed.

drop policy "Active users can read own picks" on public.pickem_picks;

create policy "Active users can read own picks"
on public.pickem_picks for select
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

create or replace function public.admin_pickem_submissions(
  p_week_id uuid default null
)
returns table (
  week_id uuid,
  season integer,
  week integer,
  week_title text,
  week_status text,
  entrant_user_id uuid,
  entrant_display_name text,
  entrant_username text,
  entrant_saved_picks integer,
  week_game_count integer,
  entrant_complete boolean,
  entrant_last_submitted_at timestamptz,
  entrant_graded_picks integer,
  entrant_points integer,
  pickem_game_id uuid,
  game_id text,
  sort_order integer,
  lock_at timestamptz,
  is_locked boolean,
  away_school_slug text,
  home_school_slug text,
  picked_school_slug text,
  pick_submitted_at timestamptz,
  game_status text,
  result_type text,
  result_winner_school_slug text,
  graded_at timestamptz,
  is_correct boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Active administrator access required.';
  end if;

  return query
  with selected_week as (
    select selected.*
    from public.pickem_weeks selected
    where p_week_id is null or selected.id = p_week_id
    order by selected.season desc, selected.week desc, selected.id
    limit 1
  ), entrants as (
    select distinct picks.user_id
    from public.pickem_picks picks
    join public.pickem_games games on games.id = picks.pickem_game_id
    join selected_week selected on selected.id = games.week_id
  ), entrant_summaries as (
    select
      entrants.user_id,
      count(picks.id)::integer as saved_picks,
      max(picks.updated_at) as last_submitted_at,
      count(picks.id) filter (
        where (selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at)
          and games.result_winner_school_slug is not null
          and games.graded_at is not null
          and picks.is_correct is not null
      )::integer as graded_picks,
      count(picks.id) filter (
        where (selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at)
          and games.result_winner_school_slug is not null
          and games.graded_at is not null
          and picks.is_correct is true
      )::integer as points
    from entrants
    cross join selected_week selected
    left join public.pickem_games games on games.week_id = selected.id
    left join public.pickem_picks picks
      on picks.pickem_game_id = games.id
      and picks.user_id = entrants.user_id
    group by entrants.user_id
  ), game_counts as (
    select count(*)::integer as game_count
    from public.pickem_games games
    join selected_week selected on selected.id = games.week_id
  )
  select
    selected.id,
    selected.season,
    selected.week,
    selected.title,
    selected.status::text,
    entrants.user_id,
    profiles.display_name,
    profiles.username,
    summaries.saved_picks,
    counts.game_count,
    summaries.saved_picks = counts.game_count,
    summaries.last_submitted_at,
    summaries.graded_picks,
    summaries.points,
    games.id,
    games.game_id,
    games.sort_order,
    games.lock_at,
    (selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at),
    games.away_school_slug,
    games.home_school_slug,
    case
      when selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at
        then picks.picked_school_slug
      else null
    end,
    picks.submitted_at,
    state.status,
    state.result_type,
    case
      when selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at
        then games.result_winner_school_slug
      else null
    end,
    case
      when selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at
        then games.graded_at
      else null
    end,
    case
      when selected.status <> 'open'::public.pickem_week_status or now() >= games.lock_at
        then picks.is_correct
      else null
    end
  from selected_week selected
  cross join entrants
  join public.profiles profiles on profiles.id = entrants.user_id
  join entrant_summaries summaries on summaries.user_id = entrants.user_id
  cross join game_counts counts
  join public.pickem_games games on games.week_id = selected.id
  left join public.pickem_picks picks
    on picks.pickem_game_id = games.id
    and picks.user_id = entrants.user_id
  left join public.game_state state on state.game_id = games.game_id
  order by
    coalesce(nullif(btrim(profiles.display_name), ''), nullif(btrim(profiles.username), ''), entrants.user_id::text),
    games.sort_order,
    games.id;
end;
$$;

revoke all on function public.admin_pickem_submissions(uuid)
  from public, anon;
grant execute on function public.admin_pickem_submissions(uuid)
  to authenticated;

comment on function public.admin_pickem_submissions(uuid) is
  'Returns an active-administrator-only weekly Pick Em submission audit with per-game lock concealment.';

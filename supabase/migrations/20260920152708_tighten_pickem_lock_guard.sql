-- Locked picks are immutable, including their audit timestamps. Only a real
-- grading transition may bypass the member-facing kickoff guard.

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
  if tg_op = 'UPDATE'
    and new.pickem_game_id = old.pickem_game_id
    and new.user_id = old.user_id
    and new.picked_school_slug = old.picked_school_slug
    and new.is_correct is distinct from old.is_correct then
    return new;
  end if;

  select * into selected_game
  from public.pickem_games
  where id = new.pickem_game_id;

  if not found then raise exception 'Pick Em game not found'; end if;

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

create or replace function private.grade_pickem_from_verified_final()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_game record;
  winner_slug text;
begin
  if new.verified is not true
    or new.status <> 'final'
    or new.home_score is null
    or new.away_score is null
    or new.home_score = new.away_score then
    return new;
  end if;

  for selected_game in
    select id, away_school_slug, home_school_slug
    from public.pickem_games
    where game_id = new.game_id
  loop
    winner_slug := case
      when new.away_score > new.home_score then selected_game.away_school_slug
      else selected_game.home_school_slug
    end;

    update public.pickem_games
    set result_winner_school_slug = winner_slug,
        graded_at = now()
    where id = selected_game.id;

    update public.pickem_picks
    set is_correct = (picked_school_slug = winner_slug),
        updated_at = now()
    where pickem_game_id = selected_game.id
      and is_correct is distinct from (picked_school_slug = winner_slug);
  end loop;

  return new;
end;
$$;

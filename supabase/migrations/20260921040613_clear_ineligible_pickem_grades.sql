-- Keep grades synchronized with the current canonical result. A result that
-- stops being an eligible verified, non-tied final must not retain a prior
-- winner or points from an older state.

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
    for selected_game in
      select id
      from public.pickem_games
      where game_id = new.game_id
    loop
      update public.pickem_games
      set result_winner_school_slug = null,
          graded_at = null
      where id = selected_game.id
        and (result_winner_school_slug is not null or graded_at is not null);

      update public.pickem_picks
      set is_correct = null,
          updated_at = now()
      where pickem_game_id = selected_game.id
        and is_correct is not null;
    end loop;

    return new;
  end if;

  for selected_game in
    select id, away_school_slug, home_school_slug
    from public.pickem_games
    where game_id = new.game_id
  loop
    if selected_game.away_school_slug is null
      or selected_game.home_school_slug is null
      or selected_game.away_school_slug = selected_game.home_school_slug then
      update public.pickem_games
      set result_winner_school_slug = null,
          graded_at = null
      where id = selected_game.id
        and (result_winner_school_slug is not null or graded_at is not null);

      update public.pickem_picks
      set is_correct = null,
          updated_at = now()
      where pickem_game_id = selected_game.id
        and is_correct is not null;

      continue;
    end if;

    winner_slug := case
      when new.away_score > new.home_score then selected_game.away_school_slug
      else selected_game.home_school_slug
    end;

    update public.pickem_games
    set result_winner_school_slug = winner_slug,
        graded_at = now()
    where id = selected_game.id
      and result_winner_school_slug is distinct from winner_slug;

    update public.pickem_picks
    set is_correct = (picked_school_slug = winner_slug),
        updated_at = now()
    where pickem_game_id = selected_game.id
      and is_correct is distinct from (picked_school_slug = winner_slug);
  end loop;

  return new;
end;
$$;

revoke all on function private.grade_pickem_from_verified_final()
  from public, anon, authenticated;

-- Grade Pick 'Em directly from the canonical verified game-state pipeline.

create index pickem_member_totals_user_idx
  on public.pickem_member_totals(user_id);

update public.pickem_weeks
set title = 'Week 5 Pick ’Em'
where season = 2026 and week = 5;

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
    where pickem_game_id = selected_game.id;
  end loop;

  return new;
end;
$$;

revoke all on function private.grade_pickem_from_verified_final() from public, anon, authenticated;

create trigger verified_final_grades_pickem
after insert or update of status, home_score, away_score, verified
on public.game_state
for each row execute function private.grade_pickem_from_verified_final();

-- Submit every score through the durable moderation record, while allowing an
-- active Moderator or Admin to approve through the existing publication trigger
-- in the same transaction.

create or replace function public.submit_score_submission(
  p_game_id text,
  p_home_score integer,
  p_away_score integer,
  p_game_status text,
  p_period text default null,
  p_clock text default null,
  p_source_note text default null
)
returns table (
  submission_id uuid,
  submission_status public.score_submission_status
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  created_submission_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  insert into public.score_submissions (
    game_id,
    submitted_by,
    home_score,
    away_score,
    game_status,
    period,
    clock,
    source_note
  ) values (
    p_game_id,
    actor_id,
    p_home_score,
    p_away_score,
    p_game_status,
    p_period,
    p_clock,
    p_source_note
  )
  returning id into created_submission_id;

  if private.can_moderate_scores() then
    update public.score_submissions
    set status = 'approved',
        reviewed_by = actor_id,
        review_note = 'Approved at submission by trusted score authority.'
    where id = created_submission_id
      and status = 'pending';
  end if;

  return query
  select submissions.id, submissions.status
  from public.score_submissions submissions
  where submissions.id = created_submission_id;
end;
$$;

revoke all on function public.submit_score_submission(text, integer, integer, text, text, text, text)
from public, anon;
grant execute on function public.submit_score_submission(text, integer, integer, text, text, text, text)
to authenticated;

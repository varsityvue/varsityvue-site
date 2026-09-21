-- Prevent a stale pending report from replacing an approved terminal game state.
-- The guarded upsert is the authoritative check so concurrent reviews and direct
-- Data API updates cannot race past the application-level moderation guard.

create or replace function public.apply_score_submission_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      new.reviewed_at := coalesce(new.reviewed_at, now());

      insert into public.score_submission_events (
        submission_id,
        event_type,
        actor_id,
        note,
        payload
      ) values (
        new.id,
        'approved',
        new.reviewed_by,
        new.review_note,
        jsonb_build_object(
          'game_id', new.game_id,
          'home_score', new.home_score,
          'away_score', new.away_score,
          'game_status', new.game_status,
          'period', new.period,
          'clock', new.clock
        )
      );

      insert into public.game_state (
        game_id,
        status,
        home_score,
        away_score,
        period,
        clock,
        source_submission_id,
        verified,
        verified_at,
        updated_by
      ) values (
        new.game_id,
        new.game_status,
        new.home_score,
        new.away_score,
        new.period,
        new.clock,
        new.id,
        true,
        now(),
        new.reviewed_by
      )
      on conflict (game_id) do update set
        status = excluded.status,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        period = excluded.period,
        clock = excluded.clock,
        source_submission_id = excluded.source_submission_id,
        verified = true,
        verified_at = excluded.verified_at,
        updated_by = excluded.updated_by,
        updated_at = now()
      where not (
        public.game_state.verified
        and public.game_state.status in ('final', 'cancelled', 'postponed')
      );

      get diagnostics affected_rows = row_count;

      if affected_rows = 0 then
        raise exception using
          errcode = 'P0001',
          message = 'Approval blocked: this game already has a verified terminal state.';
      end if;

      update public.score_submissions
      set status = 'superseded',
          reviewed_by = new.reviewed_by,
          reviewed_at = now(),
          review_note = coalesce(review_note, 'Superseded by approved score update ' || new.id::text)
      where game_id = new.game_id
        and id <> new.id
        and status = 'pending';

    elsif new.status = 'rejected' then
      new.reviewed_at := coalesce(new.reviewed_at, now());

      insert into public.score_submission_events (
        submission_id,
        event_type,
        actor_id,
        note
      ) values (
        new.id,
        'rejected',
        new.reviewed_by,
        new.review_note
      );

    elsif new.status = 'superseded' then
      insert into public.score_submission_events (
        submission_id,
        event_type,
        actor_id,
        note
      ) values (
        new.id,
        'superseded',
        new.reviewed_by,
        new.review_note
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_score_submission_review() from public;
revoke all on function public.apply_score_submission_review() from anon;
revoke all on function public.apply_score_submission_review() from authenticated;

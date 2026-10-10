set local lock_timeout='2s';
set local statement_timeout='10s';
DO $gate$ begin if md5(pg_get_functiondef('public.apply_score_submission_review()'::regprocedure)) <> 'dc29a6296e46da90bc8caea9af16b9fc' then raise exception 'Function drift: emergency hotfix aborted'; end if; end $gate$;
CREATE OR REPLACE FUNCTION public.apply_score_submission_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  affected_rows integer;
  current_state public.game_state%rowtype;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      perform pg_advisory_xact_lock(hashtextextended(new.game_id, 7319));
      select * into current_state from public.game_state where game_id = new.game_id for update;
      if (found and (new.expected_state_absent or new.expected_state_updated_at is null
                     or new.expected_state_revision is null
                     or current_state.updated_at is distinct from new.expected_state_updated_at
                     or current_state.score_revision is distinct from new.expected_state_revision))
         or (not found and (not new.expected_state_absent or new.expected_state_updated_at is not null
                            or new.expected_state_revision is not null)) then
        raise exception using errcode = 'P0001', message = 'Game changed — review the current score.';
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
      insert into public.score_submission_events (submission_id,event_type,actor_id,note,payload)
      values (new.id,'approved',new.reviewed_by,new.review_note,
        jsonb_build_object('game_id',new.game_id,'home_score',new.home_score,
          'away_score',new.away_score,'game_status',new.game_status,'period',new.period,'clock',new.clock));
      insert into public.game_state (
        game_id,status,home_score,away_score,period,clock,source_submission_id,
        verified,verified_at,updated_by,result_type
      ) values (
        new.game_id,new.game_status,new.home_score,new.away_score,new.period,new.clock,
        new.id,true,now(),new.reviewed_by,
        case when new.game_status='final' and new.home_score<>new.away_score then 'played' else null end
      )
      on conflict (game_id) do update set
        status=excluded.status,home_score=excluded.home_score,away_score=excluded.away_score,
        period=excluded.period,clock=excluded.clock,source_submission_id=excluded.source_submission_id,
        verified=true,verified_at=excluded.verified_at,updated_by=excluded.updated_by,
        result_type=excluded.result_type,official_winner_school_slug=null,updated_at=now()
      where not (public.game_state.verified and public.game_state.status in ('final','cancelled','postponed'));
      get diagnostics affected_rows = row_count;
      if affected_rows = 0 then
        raise exception using errcode = 'P0001', message = 'Approval blocked: this game already has a verified terminal state.';
      end if;
      update public.score_submissions set status='superseded', reviewed_by=new.reviewed_by,
        reviewed_at=now(), review_note=coalesce(review_note,'Superseded by approved score update '||new.id::text)
      where game_id=new.game_id and id<>new.id and status='pending';
    elsif new.status='rejected' then
      new.reviewed_at := coalesce(new.reviewed_at,now());
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'rejected',new.reviewed_by,new.review_note);
    elsif new.status='superseded' then
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'superseded',new.reviewed_by,new.review_note);
    end if;
  end if;
  return new;
end;
$function$
;

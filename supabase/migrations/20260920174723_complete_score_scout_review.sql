alter table public.missing_score_evidence
  add column review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'deferred', 'superseded')),
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz,
  add column review_note text check (review_note is null or char_length(review_note) <= 1000);

create index missing_score_evidence_review_idx
  on public.missing_score_evidence(intelligence_id, review_status, captured_at desc);

grant update on public.missing_score_evidence to authenticated;

create policy "Moderators review missing score evidence" on public.missing_score_evidence
for update to authenticated
using ((select private.can_moderate_scores()))
with check ((select private.can_moderate_scores()));

create or replace function public.review_missing_score_evidence(
  target_evidence_id uuid,
  decision text,
  note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  evidence_record record;
  created_submission_id uuid;
  created_submission_status public.score_submission_status;
  clean_note text := nullif(left(trim(coalesce(note, '')), 1000), '');
begin
  if actor_id is null or not private.can_moderate_scores() then
    raise exception using errcode = '42501', message = 'Moderator access required.';
  end if;

  if decision not in ('approve', 'reject', 'defer') then
    raise exception using errcode = '22023', message = 'Invalid evidence decision.';
  end if;

  select
    evidence.id,
    evidence.intelligence_id,
    evidence.source_name,
    evidence.source_url,
    evidence.away_score,
    evidence.home_score,
    evidence.review_status,
    intelligence.game_id,
    intelligence.status as intelligence_status
  into evidence_record
  from public.missing_score_evidence evidence
  join public.missing_score_intelligence intelligence on intelligence.id = evidence.intelligence_id
  where evidence.id = target_evidence_id
  for update of evidence, intelligence;

  if not found then
    raise exception using errcode = 'P0002', message = 'Score evidence not found.';
  end if;

  if evidence_record.intelligence_status <> 'open' then
    raise exception using errcode = '55000', message = 'This missing-score item is no longer open.';
  end if;

  if decision = 'approve' then
    if evidence_record.review_status not in ('pending', 'deferred') then
      raise exception using errcode = '55000', message = 'This evidence cannot be approved in its current state.';
    end if;
    if evidence_record.away_score is null or evidence_record.home_score is null then
      raise exception using errcode = '22023', message = 'Approved evidence must include both final scores.';
    end if;

    select result.submission_id, result.submission_status
    into created_submission_id, created_submission_status
    from public.submit_score_submission(
      evidence_record.game_id,
      evidence_record.home_score,
      evidence_record.away_score,
      'final',
      null,
      null,
      left(
        'Score Scout evidence: ' || evidence_record.source_name ||
        case when evidence_record.source_url is not null then ' — ' || evidence_record.source_url else '' end,
        500
      )
    ) result;

    if created_submission_id is null or created_submission_status <> 'approved' then
      raise exception using errcode = '55000', message = 'The canonical score submission was not approved.';
    end if;

    update public.missing_score_evidence
    set review_status = 'superseded', reviewed_by = actor_id, reviewed_at = now(),
        review_note = coalesce(review_note, 'Superseded by approved evidence for this game.')
    where intelligence_id = evidence_record.intelligence_id
      and id <> target_evidence_id
      and review_status in ('pending', 'deferred');

    update public.missing_score_evidence
    set review_status = 'approved', reviewed_by = actor_id, reviewed_at = now(), review_note = clean_note
    where id = target_evidence_id;

    return jsonb_build_object(
      'decision', decision,
      'game_id', evidence_record.game_id,
      'submission_id', created_submission_id,
      'submission_status', created_submission_status
    );
  end if;

  update public.missing_score_evidence
  set review_status = case when decision = 'reject' then 'rejected' else 'deferred' end,
      reviewed_by = actor_id,
      reviewed_at = now(),
      review_note = clean_note
  where id = target_evidence_id
    and review_status in ('pending', 'deferred');

  if not found then
    raise exception using errcode = '55000', message = 'This evidence can no longer be reviewed.';
  end if;

  return jsonb_build_object('decision', decision, 'game_id', evidence_record.game_id);
end;
$$;

revoke all on function public.review_missing_score_evidence(uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_missing_score_evidence(uuid, text, text) to authenticated;

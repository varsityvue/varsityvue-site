-- Future publications only: no historical backfill or new base tables.
create function private.bind_score_publication_actor() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if auth.uid() is null or not private.can_moderate_scores() then
      raise exception using errcode='42501', message='Trusted score authority required.';
    end if;
    if tg_table_name = 'score_submissions' then
      if new.reviewed_by is distinct from old.reviewed_by or new.status is distinct from old.status then
        if new.reviewed_by is distinct from auth.uid() then
          raise exception using errcode='42501', message='Publishing reviewer must be the authenticated actor.';
        end if;
      end if;
    else
      if new.updated_by is distinct from auth.uid() then
        raise exception using errcode='42501', message='Score updater must be the authenticated actor.';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.bind_score_publication_actor() from public, anon, authenticated;
create trigger aa_bind_score_publication_actor before update on public.score_submissions
for each row execute function private.bind_score_publication_actor();
create trigger aa_bind_score_publication_actor before insert or update on public.game_state
for each row execute function private.bind_score_publication_actor();

-- Existing approval trigger inserts an immutable publication event in the same
-- transaction as the winning state. Mark only newly authenticated publications.
create function private.corroborate_score_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.payload := coalesce(new.payload, '{}'::jsonb) - 'publisher_bound_v1';
  if new.event_type = 'approved' and auth.uid() is not null
     and new.actor_id = auth.uid() and private.can_moderate_scores() then
    new.payload := new.payload || jsonb_build_object('publisher_bound_v1', true);
  end if;
  return new;
end;
$$;
revoke all on function private.corroborate_score_publication() from public, anon, authenticated;
create trigger corroborate_score_publication before insert on public.score_submission_events
for each row execute function private.corroborate_score_publication();

create function public.public_score_states()
returns table (
  game_id text, status text, home_score integer, away_score integer,
  period text, clock text, verified boolean, kickoff_override timestamptz,
  result_type text, official_winner_school_slug text,
  attribution_type text, attribution_username text
)
language sql stable security definer set search_path = '' as $$
  with states as (
    select g.*,
      exists (
        select 1 from public.score_submissions s
        join public.score_submission_events e on e.submission_id=s.id
        where s.id=g.source_submission_id and s.game_id=g.game_id and s.status='approved'
          and s.reviewed_by=g.updated_by and e.actor_id=s.reviewed_by and e.event_type='approved'
          and e.created_at=g.verified_at and e.payload->>'publisher_bound_v1'='true'
          and s.game_status=g.status and s.home_score=g.home_score and s.away_score=g.away_score
          and s.period is not distinct from g.period and s.clock is not distinct from g.clock
          and e.payload @> jsonb_build_object('game_id',g.game_id,'game_status',g.status,
            'home_score',g.home_score,'away_score',g.away_score,'period',g.period,'clock',g.clock)
      ) as published,
      exists (
        select 1 from private.game_score_correction_audit a
        where a.game_id=g.game_id and g.source_submission_id is null
          and a.corrected_state = jsonb_build_object('status',g.status,'away_score',g.away_score,
            'home_score',g.home_score,'period',g.period,'clock',g.clock,'result_type',g.result_type,
            'official_winner_school_slug',g.official_winner_school_slug,'outcome_revision',g.outcome_revision)
      ) or exists (
        select 1 from private.game_outcome_audit a
        where a.game_id=g.game_id and a.new_outcome_revision=g.outcome_revision
          and a.new_status=g.status and a.new_verified=g.verified
          and a.new_result_type=g.result_type
          and a.new_away_score is not distinct from g.away_score
          and a.new_home_score is not distinct from g.home_score
          and a.new_official_winner_school_slug is not distinct from g.official_winner_school_slug
          and a.new_verified_at is not distinct from g.verified_at
      ) as corrected
    from public.game_state g where g.verified
  ), classified as (
    select g.*, p.username,
      case
        when g.status='final' and g.result_type in ('forfeit','no_contest') then 'outcome'
        when g.corrected then 'correction'
        when g.status='live' and g.home_score is not null and g.away_score is not null
          and g.published and p.id is not null and private.is_active_member(p.id) then 'publisher'
        when g.status='final' and g.published and g.result_type in ('played','tie') then 'verified'
        else 'none'
      end as public_attribution
    from states g left join public.profiles p on p.id=g.updated_by
  )
  select g.game_id,g.status,g.home_score,g.away_score,g.period,g.clock,g.verified,
    g.kickoff_override,g.result_type,g.official_winner_school_slug,g.public_attribution,
    case when g.public_attribution='publisher'
      and g.username collate "C" ~ '^[a-z0-9_]{3,30}$'
      and g.username not in ('varsityvue','admin','administrator','moderator','support','official')
      then g.username else null end
  from classified g;
$$;
revoke all on function public.public_score_states() from public, anon, authenticated, service_role;
grant execute on function public.public_score_states() to anon, authenticated;
comment on function public.public_score_states() is
  'Sanitized verified score state and corroborated current attribution. No private actor or submission identifiers.';

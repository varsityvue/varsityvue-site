alter table public.missing_score_intelligence
  add column last_discovery_at timestamptz,
  add column discovery_attempts integer not null default 0 check (discovery_attempts between 0 and 20),
  add column last_discovery_status text check (last_discovery_status in ('searching', 'evidence_found', 'no_evidence', 'provider_error')),
  add column last_discovery_detail text check (last_discovery_detail is null or char_length(last_discovery_detail) <= 500);
create unique index missing_score_evidence_source_url_idx
  on public.missing_score_evidence(intelligence_id, source_url) where source_url is not null;
create or replace function public.claim_missing_score_discovery(worker_secret text, candidate_game_ids text[])
returns table (intelligence_id uuid, game_id text, kickoff timestamptz, away_team text, home_team text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  return query
  with claimed as (
    select item.id from public.missing_score_intelligence item
    where item.status = 'open' and item.game_id = any(coalesce(candidate_game_ids, array[]::text[]))
      and item.discovery_attempts < 6
      and (item.last_discovery_at is null or item.last_discovery_at < now() - interval '2 hours')
    order by item.kickoff limit 3 for update skip locked
  ), updated as (
    update public.missing_score_intelligence item
    set last_discovery_at = now(), discovery_attempts = item.discovery_attempts + 1,
      last_discovery_status = 'searching', last_discovery_detail = null, updated_at = now()
    from claimed where item.id = claimed.id
    returning item.id, item.game_id, item.kickoff, item.away_team, item.home_team
  )
  select updated.id, updated.game_id, updated.kickoff, updated.away_team, updated.home_team from updated;
end; $$;
create or replace function public.record_missing_score_discovery(
  worker_secret text, target_intelligence_id uuid, discovery_status text,
  discovery_detail text, evidence_items jsonb
) returns integer language plpgsql security definer set search_path = '' as $$
declare inserted_count integer := 0;
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  if discovery_status not in ('evidence_found', 'no_evidence', 'provider_error') then raise exception 'Invalid discovery status'; end if;
  if jsonb_typeof(evidence_items) <> 'array' or jsonb_array_length(evidence_items) > 10 then raise exception 'Invalid evidence batch'; end if;
  insert into public.missing_score_evidence
    (intelligence_id, source_name, source_type, ingestion_method, source_url, away_score, home_score, evidence_note)
  select target_intelligence_id, left(item->>'source_name', 100), item->>'source_type', 'automated',
    left(item->>'source_url', 500), (item->>'away_score')::integer, (item->>'home_score')::integer,
    left(nullif(item->>'evidence_note', ''), 1000)
  from jsonb_array_elements(evidence_items) item
  where item->>'source_type' in ('official_school', 'official_team', 'broadcaster', 'newspaper', 'score_service', 'social', 'other')
    and item->>'source_url' ~ '^https?://'
    and (item->>'away_score')::integer between 0 and 150
    and (item->>'home_score')::integer between 0 and 150
    and char_length(item->>'source_name') between 1 and 100
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  update public.missing_score_intelligence set
    last_discovery_status = case when inserted_count > 0 then 'evidence_found' else discovery_status end,
    last_discovery_detail = left(discovery_detail, 500), updated_at = now()
  where id = target_intelligence_id and status = 'open';
  return inserted_count;
end; $$;
revoke all on function public.claim_missing_score_discovery(text, text[]) from public, anon, authenticated;
revoke all on function public.record_missing_score_discovery(text, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.claim_missing_score_discovery(text, text[]) to anon;
grant execute on function public.record_missing_score_discovery(text, uuid, text, text, jsonb) to anon;

create table public.missing_score_intelligence (
  id uuid primary key default gen_random_uuid(),
  game_id text not null unique,
  week integer,
  kickoff timestamptz not null,
  away_team text not null,
  home_team text not null,
  away_school_slug text,
  home_school_slug text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  detected_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text,
  moderator_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.missing_score_evidence (
  id uuid primary key default gen_random_uuid(),
  intelligence_id uuid not null references public.missing_score_intelligence(id) on delete cascade,
  source_name text not null check (char_length(source_name) between 1 and 100),
  source_url text check (source_url is null or char_length(source_url) between 8 and 500),
  away_score integer check (away_score between 0 and 150),
  home_score integer check (home_score between 0 and 150),
  evidence_note text check (evidence_note is null or char_length(evidence_note) <= 1000),
  captured_by uuid references public.profiles(id) on delete set null,
  captured_at timestamptz not null default now(),
  constraint missing_score_evidence_scores_together check ((away_score is null) = (home_score is null))
);

create index missing_score_intelligence_status_idx on public.missing_score_intelligence(status, kickoff);
create index missing_score_evidence_item_idx on public.missing_score_evidence(intelligence_id, captured_at desc);

alter table public.missing_score_intelligence enable row level security;
alter table public.missing_score_evidence enable row level security;
revoke all on public.missing_score_intelligence, public.missing_score_evidence from public, anon, authenticated;
grant select, update on public.missing_score_intelligence to authenticated;
grant select, insert on public.missing_score_evidence to authenticated;

create policy "Moderators read missing score intelligence" on public.missing_score_intelligence
for select to authenticated using ((select private.can_moderate_scores()));
create policy "Moderators update missing score intelligence" on public.missing_score_intelligence
for update to authenticated using ((select private.can_moderate_scores())) with check ((select private.can_moderate_scores()));
create policy "Moderators read missing score evidence" on public.missing_score_evidence
for select to authenticated using ((select private.can_moderate_scores()));
create policy "Moderators add missing score evidence" on public.missing_score_evidence
for insert to authenticated with check ((select private.can_moderate_scores()) and captured_by = (select auth.uid()));

create or replace function public.sync_missing_score_intelligence(worker_secret text, candidates jsonb, resolved_game_ids text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare inserted_count integer := 0; resolved_count integer := 0;
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  if jsonb_typeof(candidates) <> 'array' or jsonb_array_length(candidates) > 100 then raise exception 'Invalid candidate batch'; end if;

  insert into public.missing_score_intelligence (game_id, week, kickoff, away_team, home_team, away_school_slug, home_school_slug)
  select item->>'game_id', nullif(item->>'week','')::integer, (item->>'kickoff')::timestamptz,
    left(item->>'away_team', 120), left(item->>'home_team', 120), nullif(item->>'away_school_slug',''), nullif(item->>'home_school_slug','')
  from jsonb_array_elements(candidates) item
  where item->>'game_id' ~ '^[a-z0-9-]{3,200}$'
    and char_length(item->>'away_team') between 1 and 120
    and char_length(item->>'home_team') between 1 and 120
  on conflict (game_id) do update set last_checked_at = now(), kickoff = excluded.kickoff, week = excluded.week,
    away_team = excluded.away_team, home_team = excluded.home_team,
    away_school_slug = excluded.away_school_slug, home_school_slug = excluded.home_school_slug,
    updated_at = now()
  where missing_score_intelligence.status = 'open';
  get diagnostics inserted_count = row_count;

  update public.missing_score_intelligence set status = 'resolved', resolved_at = now(), resolution = 'score_recorded', updated_at = now()
  where status = 'open' and game_id = any(coalesce(resolved_game_ids, array[]::text[]));
  get diagnostics resolved_count = row_count;
  return jsonb_build_object('synced', inserted_count, 'resolved', resolved_count);
end;
$$;

create or replace function private.resolve_missing_score_intelligence()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.verified and new.status in ('final', 'cancelled', 'postponed') then
    update public.missing_score_intelligence set status = 'resolved', resolved_at = now(),
      resolution = new.status, updated_at = now() where game_id = new.game_id and status = 'open';
  end if;
  return new;
end;
$$;

create trigger resolve_missing_score_intelligence_after_game_state
after insert or update on public.game_state for each row execute function private.resolve_missing_score_intelligence();

revoke all on function public.sync_missing_score_intelligence(text, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.sync_missing_score_intelligence(text, jsonb, text[]) to anon, authenticated;

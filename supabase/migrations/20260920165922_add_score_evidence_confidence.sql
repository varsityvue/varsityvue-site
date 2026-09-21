alter table public.missing_score_evidence
  add column source_type text not null default 'other'
    check (source_type in ('official_school', 'official_team', 'broadcaster', 'newspaper', 'score_service', 'social', 'other')),
  add column ingestion_method text not null default 'moderator'
    check (ingestion_method in ('moderator', 'automated')),
  add column source_weight integer generated always as (
    case source_type
      when 'official_school' then 95
      when 'official_team' then 95
      when 'broadcaster' then 85
      when 'newspaper' then 85
      when 'score_service' then 70
      when 'social' then 55
      else 40
    end
  ) stored;
create index missing_score_evidence_consensus_idx
  on public.missing_score_evidence(intelligence_id, away_score, home_score)
  where away_score is not null and home_score is not null;

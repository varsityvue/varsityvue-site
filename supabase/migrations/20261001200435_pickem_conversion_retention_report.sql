-- Read-only receipt-based reporting. No contest records or lifecycle are changed.
create function public.admin_pickem_conversion_report(p_season integer default 2026)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  report jsonb;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Active administrator access required';
  end if;
  if p_season is null or p_season < 2026 or p_season > 2100 then
    raise exception using errcode = '22023', message = 'Invalid reporting season';
  end if;

  with weeks as (
    select numbers.week, w.id, w.status, w.opens_at,
      f.finalized_at, f.state as finalization_state
    from pg_catalog.generate_series(6, 11) numbers(week)
    left join public.pickem_weeks w on w.season = p_season and w.week = numbers.week
    left join private.pickem_contest_finalizations f on f.week_id = w.id
  ), valid_entries as (
    select e.week_id, e.user_id, e.completed_at
    from public.pickem_contest_entries e join weeks w on w.id = e.week_id
    where e.status = 'valid'
  ), required_games as (
    select g.* from public.pickem_games g join weeks w on w.id = g.week_id
    where not exists (
      select 1 from private.pickem_contest_game_resolution r
      where r.pickem_game_id = g.id and r.disposition = 'void'
    )
  ), selections as (
    -- UNION deduplicates a matchup saved in both stores. Validate the selection
    -- against its matchup; prediction-only drafts are not saved selections.
    select g.week_id, p.user_id, g.id as game_id
    from public.pickem_picks p join required_games g on g.id = p.pickem_game_id
    where p.picked_school_slug in (g.away_school_slug, g.home_school_slug)
    union
    select g.week_id, d.user_id, g.id
    from private.pickem_draft_picks d join required_games g
      on g.id = d.pickem_game_id and g.week_id = d.week_id
    where d.picked_school_slug in (g.away_school_slug, g.home_school_slug)
  ), complete_users as (
    select s.week_id, s.user_id from selections s group by s.week_id, s.user_id
    having count(*) = (select count(*) from required_games g where g.week_id = s.week_id)
  ), drafts as (
    select d.week_id, d.user_id from private.pickem_draft_picks d join weeks w on w.id = d.week_id
    union
    select d.week_id, d.user_id from private.pickem_draft_predictions d join weeks w on w.id = d.week_id
  ), weekly as (
    select w.*,
      (select count(*) from public.pickem_games g where g.week_id = w.id) as game_count,
      (select count(*) from required_games g where g.week_id = w.id) as required_game_count,
      (select count(*) from valid_entries e where e.week_id = w.id) as valid_count,
      (select count(*) from public.pickem_contest_entries e where e.week_id = w.id and e.status = 'disqualified') as disqualified_count,
      (select count(*) from drafts d where d.week_id = w.id and not exists (
        select 1 from public.pickem_contest_entries e where e.week_id = d.week_id and e.user_id = d.user_id
      )) as outstanding_drafts,
      (select count(distinct s.user_id) from selections s where s.week_id = w.id) as any_selections,
      (select count(*) from complete_users c where c.week_id = w.id) as complete_selections,
      (select count(*) from complete_users c where c.week_id = w.id and not exists (
        select 1 from valid_entries e where e.week_id = c.week_id and e.user_id = c.user_id
      )) as complete_without_valid
    from weeks w
  ), participants as (
    select user_id, min(completed_at) as first_accepted_at from valid_entries group by user_id
  ), participant_follows as (
    select p.user_id, p.first_accepted_at, min(f.created_at) as earliest_surviving_follow
    from participants p left join public.school_follows f on f.user_id = p.user_id
    group by p.user_id, p.first_accepted_at
  ), totals as (
    select count(*) as unique_participants,
      count(*) filter (where earliest_surviving_follow is not null) as following,
      count(*) filter (where earliest_surviving_follow is null) as not_following,
      count(*) filter (where earliest_surviving_follow <= first_accepted_at) as followed_before,
      count(*) filter (where earliest_surviving_follow > first_accepted_at) as followed_after
    from participant_follows
  ), pairs as (
    select previous.week as previous_week, current.week as current_week,
      previous.valid_count as previous_cohort,
      (select count(*) from valid_entries a join valid_entries b on b.user_id = a.user_id
        where a.week_id = previous.id and b.week_id = current.id) as repeats,
      coalesce(current.status <> 'draft' and current.opens_at <= now()
        and current.valid_count > 0 and previous.valid_count > 0, false) as measurable,
      coalesce(previous.finalization_state = 'current' and current.finalization_state = 'current', false) as finalized
    from weekly previous join weekly current on current.week = previous.week + 1
  )
  select jsonb_build_object(
    'generated_at', now(), 'season', p_season,
    'summary', jsonb_build_object(
      'unique_valid_participants', totals.unique_participants,
      'total_valid_entries', (select count(*) from valid_entries),
      'average_entries_per_participant', case when totals.unique_participants > 0
        then round((select count(*) from valid_entries)::numeric / totals.unique_participants, 2) else null end,
      'currently_following', totals.following, 'no_current_follows', totals.not_following,
      'follow_adoption_pct', case when totals.unique_participants > 0
        then round(100.0 * totals.following / totals.unique_participants, 1) else null end,
      'surviving_follow_before_or_at_first_entry', totals.followed_before,
      'earliest_surviving_follow_after_first_entry', totals.followed_after
    ),
    'weeks', (select jsonb_agg(jsonb_build_object(
      'week', w.week, 'configured', w.id is not null,
      'status', coalesce(w.status::text, 'not_configured'),
      'game_count', w.game_count, 'required_game_count', w.required_game_count,
      'valid_accepted_entries', w.valid_count, 'disqualified_entries', w.disqualified_count,
      'prize_dollars', case when w.id is not null and w.status <> 'draft' then p.prize_dollars else null end,
      'prize_state', case when w.id is null or w.status = 'draft' then 'not_applicable'
        when w.finalization_state = 'current' then 'finalized'
        when w.finalization_state is not null then 'under_review' else 'provisional' end,
      'finalized_at', case when w.finalization_state = 'current' then w.finalized_at else null end,
      'outstanding_draft_users', w.outstanding_drafts,
      'any_selection_users', w.any_selections, 'complete_selection_users', w.complete_selections,
      'complete_without_valid_entry', w.complete_without_valid
    ) order by w.week) from weekly w left join public.pickem_contest_prize p on p.week_id = w.id),
    'retention', (select jsonb_agg(jsonb_build_object(
      'previous_week', previous_week, 'current_week', current_week,
      'previous_valid_cohort', previous_cohort, 'repeat_valid_entries', repeats,
      'measurable', measurable, 'finalized', finalized,
      'repeat_rate_pct', case when measurable then round(100.0 * repeats / previous_cohort, 1) else null end
    ) order by previous_week) from pairs)
  ) into report from totals;
  return report;
end;
$$;

revoke all on function public.admin_pickem_conversion_report(integer) from public, anon, authenticated, service_role;
grant execute on function public.admin_pickem_conversion_report(integer) to authenticated;
comment on function public.admin_pickem_conversion_report(integer) is
  'Active-admin aggregate reporting for cash-contest Weeks 6–11 only. Current surviving data; no identities or writes.';

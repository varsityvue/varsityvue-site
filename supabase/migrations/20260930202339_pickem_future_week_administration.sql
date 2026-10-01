-- Bounded 2026 setup only. Existing entries, scoring, claims and rules are unchanged.
alter table public.pickem_weeks add column configuration_revision bigint not null default 0
  check (configuration_revision >= 0);

-- Only trusted operations may write setup tables. Dedicated schedule/grading
-- RPCs already run with explicit authority; SELECT/RLS remains unchanged.
revoke insert, update, delete on public.pickem_weeks, public.pickem_games from anon, authenticated;

-- Approved real-game catalog for this administration window. Canonical kickoff
-- overrides still come from game_state and require its expected revision.
create function private.pickem_admin_catalog()
returns table(game_id text, week integer, kickoff timestamptz, away_school_slug text, home_school_slug text)
language sql immutable set search_path = '' as $$
  values
    ('stephenville-vs-canyon-west-plains-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'canyon-west-plains', 'stephenville'),
    ('lampasas-at-stephenville-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'lampasas', 'stephenville'),
    ('china-spring-at-stephenville-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'china-spring', 'stephenville'),
    ('stephenville-at-jarrell-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'stephenville', 'jarrell'),
    ('burnet-at-stephenville-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'burnet', 'stephenville'),
    ('stephenville-at-marble-falls-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'stephenville', 'marble-falls'),
    ('jacksboro-at-cisco-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'jacksboro', 'cisco'),
    ('anson-at-cisco-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'anson', 'cisco'),
    ('abilene-tlca-at-cisco-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'abilene-texas-leadership', 'cisco'),
    ('cisco-at-hico-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'cisco', 'hico'),
    ('de-leon-at-cisco-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'de-leon', 'cisco'),
    ('tolar-at-comanche-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'tolar', 'comanche'),
    ('comanche-at-millsap-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'comanche', 'millsap'),
    ('comanche-at-dublin-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'comanche', 'dublin'),
    ('rio-vista-at-comanche-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'rio-vista', 'comanche'),
    ('comanche-at-eastland-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'comanche', 'eastland'),
    ('hamilton-at-comanche-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'hamilton', 'comanche'),
    ('early-at-de-leon-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'early', 'de-leon'),
    ('hico-at-de-leon-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'hico', 'de-leon'),
    ('de-leon-at-anson-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'de-leon', 'anson'),
    ('abilene-tlca-at-de-leon-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'abilene-texas-leadership', 'de-leon'),
    ('florence-at-hico-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'florence', 'hico'),
    ('abilene-tlca-at-hico-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'abilene-texas-leadership', 'hico'),
    ('hico-at-anson-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'hico', 'anson'),
    ('hawley-at-post-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'hawley', 'post'),
    ('de-leon-at-hawley-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'de-leon', 'hawley'),
    ('cisco-at-hawley-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'cisco', 'hawley'),
    ('hawley-at-hico-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'hawley', 'hico'),
    ('anson-at-hawley-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'anson', 'hawley'),
    ('hawley-at-abilene-tlca-2026-week-11', 11, '2026-11-05T19:00:00-06:00'::timestamptz, 'hawley', 'abilene-texas-leadership'),
    ('cross-plains-at-albany-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'cross-plains', 'albany'),
    ('albany-at-winters-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'albany', 'winters'),
    ('miles-at-albany-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'miles', 'albany'),
    ('albany-at-hamlin-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'albany', 'hamlin'),
    ('miles-at-stamford-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'miles', 'stamford'),
    ('stamford-at-hamlin-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'stamford', 'hamlin'),
    ('albany-at-stamford-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'albany', 'stamford'),
    ('stamford-at-cross-plains-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'stamford', 'cross-plains'),
    ('goldthwaite-at-stamford-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'goldthwaite', 'stamford'),
    ('stamford-at-winters-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'stamford', 'winters'),
    ('winters-at-goldthwaite-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'winters', 'goldthwaite'),
    ('goldthwaite-at-miles-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'goldthwaite', 'miles'),
    ('hamlin-at-goldthwaite-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'hamlin', 'goldthwaite'),
    ('goldthwaite-at-albany-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'goldthwaite', 'albany'),
    ('cross-plains-at-goldthwaite-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'cross-plains', 'goldthwaite'),
    ('crawford-at-santo-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'crawford', 'santo'),
    ('santo-at-frost-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'santo', 'frost'),
    ('mart-at-santo-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'mart', 'santo'),
    ('santo-at-hubbard-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'santo', 'hubbard'),
    ('meridian-at-santo-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'meridian', 'santo'),
    ('santo-at-wortham-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'santo', 'wortham'),
    ('merkel-at-jacksboro-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'merkel', 'jacksboro'),
    ('jacksboro-at-breckenridge-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'jacksboro', 'breckenridge'),
    ('henrietta-at-jacksboro-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'henrietta', 'jacksboro'),
    ('jacksboro-at-holliday-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'jacksboro', 'holliday'),
    ('city-view-at-jacksboro-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'city-view', 'jacksboro'),
    ('meridian-at-hubbard-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'meridian', 'hubbard'),
    ('wortham-at-mart-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'wortham', 'mart'),
    ('hubbard-at-wortham-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'hubbard', 'wortham'),
    ('mart-at-crawford-2026-week-6', 6, '2026-10-02T19:00:00-05:00'::timestamptz, 'mart', 'crawford'),
    ('crawford-at-hubbard-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'crawford', 'hubbard'),
    ('frost-at-mart-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'frost', 'mart'),
    ('wortham-at-meridian-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'wortham', 'meridian'),
    ('hubbard-at-frost-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'hubbard', 'frost'),
    ('meridian-at-crawford-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'meridian', 'crawford'),
    ('frost-at-meridian-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'frost', 'meridian'),
    ('crawford-at-wortham-2026-week-9', 9, '2026-10-23T19:30:00-05:00'::timestamptz, 'crawford', 'wortham'),
    ('hubbard-at-mart-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'hubbard', 'mart'),
    ('wortham-at-frost-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'wortham', 'frost'),
    ('frost-at-crawford-2026-week-11', 11, '2026-11-06T19:30:00-06:00'::timestamptz, 'frost', 'crawford'),
    ('mart-at-meridian-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'mart', 'meridian'),
    ('hamlin-at-cross-plains-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'hamlin', 'cross-plains'),
    ('miles-at-winters-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'miles', 'winters'),
    ('winters-at-hamlin-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'winters', 'hamlin'),
    ('hamlin-at-miles-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'hamlin', 'miles'),
    ('winters-at-cross-plains-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'winters', 'cross-plains'),
    ('cross-plains-at-miles-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'cross-plains', 'miles'),
    ('dublin-at-millsap-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'dublin', 'millsap'),
    ('hamilton-at-eastland-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'hamilton', 'eastland'),
    ('clifton-at-rio-vista-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'clifton', 'rio-vista'),
    ('dublin-at-hamilton-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'dublin', 'hamilton'),
    ('eastland-at-clifton-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'eastland', 'clifton'),
    ('rio-vista-at-tolar-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'rio-vista', 'tolar'),
    ('tolar-at-eastland-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'tolar', 'eastland'),
    ('clifton-at-hamilton-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'clifton', 'hamilton'),
    ('millsap-at-rio-vista-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'millsap', 'rio-vista'),
    ('dublin-at-clifton-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'dublin', 'clifton'),
    ('eastland-at-millsap-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'eastland', 'millsap'),
    ('hamilton-at-tolar-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'hamilton', 'tolar'),
    ('rio-vista-at-dublin-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'rio-vista', 'dublin'),
    ('millsap-at-hamilton-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'millsap', 'hamilton'),
    ('tolar-at-clifton-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'tolar', 'clifton'),
    ('dublin-at-tolar-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'dublin', 'tolar'),
    ('eastland-at-rio-vista-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'eastland', 'rio-vista'),
    ('clifton-at-millsap-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'clifton', 'millsap'),
    ('chico-at-abilene-texas-leadership-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'chico', 'abilene-texas-leadership'),
    ('breckenridge-at-anson-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'breckenridge', 'anson'),
    ('anson-at-abilene-tlca-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'anson', 'abilene-texas-leadership'),
    ('san-angelo-texas-leadership-at-merkel-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'san-angelo-texas-leadership', 'merkel'),
    ('bridgeport-at-henrietta-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'bridgeport', 'henrietta'),
    ('holliday-at-whitesboro-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'holliday', 'whitesboro'),
    ('bowie-at-city-view-2026-week-5', 5, '2026-09-25T19:00:00-05:00'::timestamptz, 'bowie', 'city-view'),
    ('city-view-at-breckenridge-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'city-view', 'breckenridge'),
    ('henrietta-at-holliday-2026-week-7', 7, '2026-10-09T19:00:00-05:00'::timestamptz, 'henrietta', 'holliday'),
    ('merkel-at-henrietta-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'merkel', 'henrietta'),
    ('holliday-at-city-view-2026-week-8', 8, '2026-10-16T19:00:00-05:00'::timestamptz, 'holliday', 'city-view'),
    ('breckenridge-at-holliday-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'breckenridge', 'holliday'),
    ('city-view-at-merkel-2026-week-9', 9, '2026-10-23T19:00:00-05:00'::timestamptz, 'city-view', 'merkel'),
    ('merkel-at-breckenridge-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'merkel', 'breckenridge'),
    ('henrietta-at-city-view-2026-week-10', 10, '2026-10-30T19:00:00-05:00'::timestamptz, 'henrietta', 'city-view'),
    ('holliday-at-merkel-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'holliday', 'merkel'),
    ('breckenridge-at-henrietta-2026-week-11', 11, '2026-11-06T19:00:00-06:00'::timestamptz, 'breckenridge', 'henrietta');
$$;
revoke all on function private.pickem_admin_catalog() from public, anon, authenticated;

create function private.assert_pickem_setup_draft(p_week_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.pickem_weeks where id=p_week_id
      and (status<>'draft' or entry_deadline_at is not null or outcome_resolution_at is not null or opens_at is not null))
    or exists (select 1 from public.pickem_contest_entries where week_id=p_week_id)
    or exists (select 1 from public.pickem_games g where g.week_id=p_week_id and
      (g.lock_at<=clock_timestamp() or g.graded_at is not null
       or g.result_winner_school_slug is not null
       or exists (select 1 from public.pickem_picks p where p.pickem_game_id=g.id)
       or exists (select 1 from private.pickem_draft_picks p where p.pickem_game_id=g.id)
       or exists (select 1 from private.pickem_contest_game_resolution r where r.pickem_game_id=g.id)))
    or exists (select 1 from public.pickem_week_tiebreakers where week_id=p_week_id)
    or exists (select 1 from private.pickem_draft_predictions where week_id=p_week_id)
    or exists (select 1 from private.pickem_contest_finalizations where week_id=p_week_id)
    or exists (select 1 from private.pickem_contest_finalization_history where week_id=p_week_id)
    or exists (select 1 from private.pickem_winner_claims where week_id=p_week_id) then
    raise exception using errcode='55000', message='Published or participated contests are read-only in setup.';
  end if;
end; $$;
revoke all on function private.assert_pickem_setup_draft(uuid) from public, anon, authenticated;

create function public.configure_pickem_draft(
  p_season integer, p_week integer, p_expected_revision bigint,
  p_title text, p_games jsonb, p_tiebreaker_game_ids text[]
) returns public.pickem_weeks language plpgsql security definer set search_path = '' as $$
declare w public.pickem_weeks%rowtype; item record; catalog record; tb uuid;
  ids text[]; desired jsonb; stored jsonb; changed boolean;
begin
  if auth.uid() is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Pick Em setup requires an active administrator or moderator.';
  end if;
  if p_season is distinct from 2026 or p_week is null or p_week not between 5 and 11 then
    raise exception using errcode='22023', message='Setup supports 2026 Weeks 5 through 11 only.';
  end if;
  if nullif(btrim(p_title),'') is null or length(btrim(p_title))>150
    or p_games is null or jsonb_typeof(p_games)<>'array' then
    raise exception using errcode='22023', message='A title and canonical slate are required.';
  end if;
  if jsonb_array_length(p_games) not between 1 and 12 then
    raise exception using errcode='22023', message='Select between 1 and 12 canonical games.';
  end if;
  select array_agg(x.game_id order by x.ordinality) into ids
    from (select value->>'game_id' as game_id, ordinality from jsonb_array_elements(p_games) with ordinality) x;
  if cardinality(ids)<>(select count(distinct id) from unnest(ids) id) then
    raise exception using errcode='22023', message='Slate games must be unique.';
  end if;
  if cardinality(p_tiebreaker_game_ids) is distinct from 1
    or p_tiebreaker_game_ids[1] is null or not (p_tiebreaker_game_ids[1]=any(ids)) then
    raise exception using errcode='22023', message='Select exactly one Pick Em tiebreaker from the selected slate.';
  end if;
  -- Serializes both initial creation and edits; the revision rejects stale tabs.
  perform pg_advisory_xact_lock(hashtextextended('pickem-setup:'||p_season||':'||p_week,0));
  select * into w from public.pickem_weeks where season=p_season and week=p_week for update;
  if found then
    perform private.assert_pickem_setup_draft(w.id);
    if p_expected_revision is distinct from w.configuration_revision then
      raise exception using errcode='40001', message='The draft changed. Refresh before saving.';
    end if;
  else
    if p_expected_revision is distinct from -1 then
      raise exception using errcode='40001', message='The draft changed. Refresh before saving.';
    end if;
    insert into public.pickem_weeks(season,week,title,status,created_by)
      values(p_season,p_week,btrim(p_title),'draft',auth.uid()) returning * into w;
  end if;
  select coalesce(jsonb_agg(jsonb_build_array(g.game_id,g.sort_order,g.lock_at,g.lock_revision) order by g.sort_order,g.game_id),'[]')
    into stored from public.pickem_games g where g.week_id=w.id;
  -- Lock game_state in deterministic order and validate every caller-supplied ID.
  -- The RPC never accepts arbitrary matchup identity, kickoff or editorial text.
  for item in select * from jsonb_to_recordset(p_games) as x(game_id text, schedule_revision bigint) order by game_id loop
    select * into catalog from private.pickem_admin_catalog() c where c.game_id=item.game_id and c.week=p_week;
    if not found then raise exception using errcode='22023', message='A selected game is outside this canonical week.'; end if;
    if item.schedule_revision is null or item.schedule_revision < 0 then
      raise exception using errcode='22023', message='Every selected game requires an expected schedule revision.';
    end if;
    perform 1 from public.game_state where game_id=item.game_id for update;
    if exists (select 1 from public.game_state s where s.game_id=item.game_id
      and (s.status not in ('upcoming','scheduled') or s.result_type is not null)) then
      raise exception using errcode='55000', message='Only unplayed future games may be configured.';
    end if;
    perform public.sync_pickem_game_lock(w.id,item.game_id,array_position(ids,item.game_id),
      coalesce((select kickoff_override from public.game_state where game_id=item.game_id),catalog.kickoff),
      item.schedule_revision,catalog.away_school_slug,catalog.home_school_slug);
    if exists (select 1 from public.pickem_games where week_id=w.id and game_id=item.game_id and lock_at<=clock_timestamp()) then
      raise exception using errcode='55000', message='Every draft game must have a future kickoff.';
    end if;
  end loop;
  select id into tb from public.pickem_games where week_id=w.id and game_id=p_tiebreaker_game_ids[1];
  -- Move the FK before removing a former tiebreaker; the entire RPC rolls back on failure.
  changed := w.title is distinct from btrim(p_title) or w.tiebreaker_game_id is distinct from tb
    or (p_week>=6 and (w.official_rules_version is distinct from '2026-pickem-cash-v1'
      or w.official_rules_published_at is distinct from '2026-09-27T05:08:44.209029Z'::timestamptz
      or w.presenting_sponsor_name is distinct from 'Gilder Storage'))
    or exists (select 1 from public.pickem_games where week_id=w.id and not(game_id=any(ids)));
  update public.pickem_weeks set tiebreaker_game_id=tb where id=w.id and tiebreaker_game_id is distinct from tb;
  delete from public.pickem_games where week_id=w.id and not(game_id=any(ids));
  -- Detect slate changes as well as week metadata changes.
  select coalesce(jsonb_agg(jsonb_build_array(g.game_id,g.sort_order,g.lock_at,g.lock_revision) order by g.sort_order,g.game_id),'[]')
    into desired from public.pickem_games g where g.week_id=w.id;
  changed := changed or desired is distinct from stored;
  if not changed then return w; end if;
  update public.pickem_weeks set title=btrim(p_title),
    official_rules_version=case when p_week>=6 then '2026-pickem-cash-v1' else w.official_rules_version end,
    official_rules_published_at=case when p_week>=6 then '2026-09-27T05:08:44.209029Z'::timestamptz else w.official_rules_published_at end,
    presenting_sponsor_name=case when p_week>=6 then 'Gilder Storage' else w.presenting_sponsor_name end,
    configuration_revision=configuration_revision+1
    where id=w.id returning * into w;
  return w;
end; $$;
revoke all on function public.configure_pickem_draft(integer,integer,bigint,text,jsonb,text[]) from public,anon;
grant execute on function public.configure_pickem_draft(integer,integer,bigint,text,jsonb,text[]) to authenticated;

create function public.open_pickem_draft(p_week_id uuid,p_expected_revision bigint,p_schedule_revisions jsonb)
returns public.pickem_weeks language plpgsql security definer set search_path = '' as $$
declare w public.pickem_weeks%rowtype; g record; c record; s public.game_state%rowtype; n integer;
begin
  if auth.uid() is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Pick Em setup requires an active administrator or moderator.';
  end if;
  select * into w from public.pickem_weeks where id=p_week_id for update;
  if not found or w.season<>2026 or w.week not between 5 and 11 then
    raise exception using errcode='22023', message='Setup supports 2026 Weeks 5 through 11 only.';
  end if;
  perform private.assert_pickem_setup_draft(w.id);
  if p_expected_revision is distinct from w.configuration_revision then
    raise exception using errcode='40001', message='The draft changed. Refresh before opening.';
  end if;
  if p_schedule_revisions is null or jsonb_typeof(p_schedule_revisions)<>'object' then
    raise exception using errcode='22023', message='Schedule revisions are required.';
  end if;
  select count(*) into n from public.pickem_games where week_id=w.id;
  if n not between 1 and 12 or not exists(select 1 from public.pickem_games where id=w.tiebreaker_game_id and week_id=w.id)
    or (w.week>=6 and (w.official_rules_version is distinct from '2026-pickem-cash-v1'
      or w.official_rules_published_at is distinct from '2026-09-27T05:08:44.209029Z'::timestamptz
      or w.presenting_sponsor_name is distinct from 'Gilder Storage')) then
    raise exception using errcode='22023', message='Save a complete draft with approved rules, sponsor and tiebreaker first.';
  end if;
  for g in select * from public.pickem_games where week_id=w.id order by game_id loop
    select * into c from private.pickem_admin_catalog() where game_id=g.game_id and week=w.week;
    if not found then raise exception using errcode='22023', message='A selected game is outside this canonical week.'; end if;
    select * into s from public.game_state where game_id=g.game_id for update;
    if s.game_id is not null and (s.status not in ('upcoming','scheduled') or s.result_type is not null) then
      raise exception using errcode='55000', message='Only unplayed future games may be opened.';
    end if;
    if (p_schedule_revisions->>g.game_id)::bigint is distinct from coalesce(s.schedule_revision,0)
      or g.lock_at is distinct from coalesce(s.kickoff_override,c.kickoff)
      or g.away_school_slug is distinct from c.away_school_slug or g.home_school_slug is distinct from c.home_school_slug then
      raise exception using errcode='40001', message='The schedule changed. Refresh and save the draft before opening.';
    end if;
  end loop;
  update public.pickem_weeks set status='open',opens_at=now(),
    closes_at=(select max(lock_at)+interval '1 second' from public.pickem_games where week_id=w.id),
    configuration_revision=configuration_revision+1 where id=w.id returning * into w;
  return w;
end; $$;
revoke all on function public.open_pickem_draft(uuid,bigint,jsonb) from public,anon;
grant execute on function public.open_pickem_draft(uuid,bigint,jsonb) to authenticated;

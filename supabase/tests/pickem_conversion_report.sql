-- ISOLATED database only, after the Reporting V1 migration. Everything rolls back.
-- Synthetic season avoids existing 2026 weeks. No real member identities are used.
begin;
create temporary table report_users (label text primary key, id uuid);
insert into report_users
select label, ('00000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid
from (values ('admin',901),('moderator',902),('A',903),('B',904),('C',905),
  ('D',906),('E',907),('F',908),('G',909),('new',910),('inactive',911)) v(label,n);
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'report-v1-'||label||'@example.invalid','!',now(),'{}'::jsonb,
  jsonb_build_object('display_name','Private reporting fixture '||label),now(),now() from report_users;
insert into public.user_roles(user_id,role)
select id,case when label='moderator' then 'moderator'::public.user_role else 'admin'::public.user_role end
from report_users where label in ('admin','moderator','inactive');
update public.member_account_status set status='suspended',suspended_at=now()
where user_id=(select id from report_users where label='inactive');

create temporary table report_games (week integer, week_id uuid, game_number integer, id uuid);
do $$ declare w uuid; g uuid; i integer; j integer; begin
  for i in 5..8 loop
    insert into public.pickem_weeks(season,week,title,status,opens_at,closes_at,official_rules_version,official_rules_published_at)
    values(2098,i,'Reporting fixture','draft',now()-interval '1 day',now()+interval '3 days','report-fixture',now()) returning id into w;
    for j in 1..case when i=6 then 3 else 2 end loop
      insert into public.pickem_games(week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
      values(w,'__report_v1_'||i||'_'||j,j,now()+interval '2 days','report-away','report-home') returning id into g;
      insert into report_games values(i,w,j,g);
    end loop;
    if i in (5,6) then
      update public.pickem_weeks set tiebreaker_game_id=(select id from report_games where week=i and game_number=1),status='open' where id=w;
    else
      update public.pickem_weeks set tiebreaker_game_id=(select id from report_games where week=i and game_number=1) where id=w;
    end if;
  end loop;
end $$;
grant select on report_users,report_games to authenticated;

-- Real entry lifecycle produces receipts; disqualification is separate.
set local role authenticated;
do $$ declare w uuid; picks jsonb; u record; begin
  select week_id into w from report_games where week=6 limit 1;
  select jsonb_object_agg(id::text,'report-home') into picks from report_games where week=6;
  for u in select * from report_users where label in ('A','B','C') order by label loop
    perform set_config('request.jwt.claim.sub',u.id::text,true);
    perform public.submit_pickem_contest_entry(w,'2545550'||case u.label when 'A' then '903' when 'B' then '904' else '905' end,42,picks,true);
  end loop;
end $$;
reset role;
update public.pickem_contest_entries set status='disqualified',disqualification_reason='Synthetic fixture'
where week_id=(select week_id from report_games where week=6 limit 1)
  and user_id=(select id from report_users where label='C');
insert into private.pickem_contest_game_resolution(pickem_game_id,disposition,reason)
select id,'void','Synthetic VOID' from report_games where week=6 and game_number=3;

-- D is complete draft-only; E has one duplicated public/private matchup;
-- F has only a prediction; G has complete public selections without a receipt.
insert into private.pickem_draft_picks(week_id,user_id,pickem_game_id,picked_school_slug)
select g.week_id,u.id,g.id,'report-home' from report_games g cross join report_users u
where g.week=6 and g.game_number<=2 and (u.label in ('A','D') or (u.label='E' and g.game_number=1));
insert into private.pickem_draft_predictions(week_id,user_id,predicted_total)
select g.week_id,u.id,42 from (select distinct week_id from report_games where week=6) g
cross join report_users u where u.label in ('D','F');
insert into public.pickem_picks(pickem_game_id,user_id,picked_school_slug)
select g.id,u.id,'report-home' from report_games g cross join report_users u
where g.week=6 and g.game_number<=2 and (u.label='G' or (u.label='E' and g.game_number=1));
-- A historical week outside 6–11 must not affect campaign counts.
insert into public.pickem_contest_entries(week_id,user_id,attestation_text,attestation_rules_version)
select distinct g.week_id,u.id,'I confirm that I am 18 or older, a Texas resident, and agree to the Official Rules.','report-fixture'
from report_games g cross join report_users u where g.week=5 and u.label='G';

insert into public.school_follows(user_id,school_slug,source_surface,created_at)
select id,'report-school','school_hub',case when label='A' then now()-interval '1 day' else now()+interval '1 minute' end
from report_users where label in ('A','B','D');

-- The report must not write contest, draft, follow, or standing state.
create temporary table report_before as
select jsonb_build_object(
  'weeks',(select jsonb_agg(to_jsonb(w) order by w.id) from public.pickem_weeks w),
  'games',(select jsonb_agg(to_jsonb(g) order by g.id) from public.pickem_games g),
  'entries',(select jsonb_agg(to_jsonb(e) order by e.week_id,e.user_id) from public.pickem_contest_entries e),
  'picks',(select jsonb_agg(to_jsonb(p) order by p.id) from public.pickem_picks p),
  'drafts',(select jsonb_agg(to_jsonb(d) order by d.week_id,d.user_id,d.pickem_game_id) from private.pickem_draft_picks d),
  'predictions',(select jsonb_agg(to_jsonb(d) order by d.week_id,d.user_id) from private.pickem_draft_predictions d),
  'follows',(select jsonb_agg(to_jsonb(f) order by f.user_id,f.school_slug) from public.school_follows f),
  'standings',(select jsonb_agg(to_jsonb(s) order by s.season,s.user_id) from public.pickem_standings s)
) state;
grant select on report_before to authenticated;

set local role authenticated;
do $$ declare r jsonb; w jsonb; pair jsonb; actor text; begin
  foreach actor in array array['A','moderator','inactive'] loop
    perform set_config('request.jwt.claim.sub',(select id::text from report_users where label=actor),true);
    begin
      perform public.admin_pickem_conversion_report(2098);
      raise exception 'Unauthorized reporting actor allowed: %',actor;
    exception when insufficient_privilege then
      if sqlerrm <> 'Active administrator access required' then raise; end if;
    end;
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
  begin
    perform public.admin_pickem_conversion_report(2098);
    raise exception 'Missing identity allowed';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  if not (public.admin_conversion_dashboard(30)->'summary' ? 'new_accounts') then
    raise exception 'Existing member conversion RPC failed'; end if;
  begin
    perform public.admin_pickem_conversion_report(2025);
    raise exception 'Pre-cash season allowed';
  exception when invalid_parameter_value then null; end;
  r:=public.admin_pickem_conversion_report(2098);
  select value into w from jsonb_array_elements(r->'weeks') where (value->>'week')::integer=6;
  if (w->>'valid_accepted_entries')::integer<>2 or (w->>'disqualified_entries')::integer<>1
    or (w->>'outstanding_draft_users')::integer<>3 or (w->>'any_selection_users')::integer<>6
    or (w->>'complete_selection_users')::integer<>5 or (w->>'complete_without_valid_entry')::integer<>3
    or (w->>'required_game_count')::integer<>2 or (w->>'game_count')::integer<>3
    or (w->>'prize_dollars')::integer<>2 or w->>'prize_state'<>'provisional' then
    raise exception 'Weekly aggregation mismatch: %',w;
  end if;
  if r#>>'{summary,unique_valid_participants}'<>'2' or r#>>'{summary,total_valid_entries}'<>'2'
    or r#>>'{summary,currently_following}'<>'2' or r#>>'{summary,no_current_follows}'<>'0'
    or r#>>'{summary,follow_adoption_pct}'<>'100.0'
    or r#>>'{summary,surviving_follow_before_or_at_first_entry}'<>'1'
    or r#>>'{summary,earliest_surviving_follow_after_first_entry}'<>'1' then
    raise exception 'Campaign/follow mismatch: %',r->'summary';
  end if;
  select value into pair from jsonb_array_elements(r->'retention') where value->>'previous_week'='6';
  if pair->>'measurable'<>'false' or pair->'repeat_rate_pct'<>'null'::jsonb
    or pair->>'previous_valid_cohort'<>'2' then raise exception 'Draft retention mislabeled'; end if;
  if jsonb_array_length(r->'weeks')<>6 or jsonb_array_length(r->'retention')<>5
    or exists(select 1 from jsonb_array_elements(r->'weeks') where (value->>'week')::integer=5) then
    raise exception 'Week 5 leaked into cash report'; end if;
  if r::text ~* 'user_id|email|phone|username|attestation|00000000-|example.invalid|Private reporting fixture' then
    raise exception 'Private identity data returned'; end if;
end $$;
reset role;
do $$ begin
  if has_function_privilege('anon','public.admin_pickem_conversion_report(integer)','execute')
    or has_function_privilege('service_role','public.admin_pickem_conversion_report(integer)','execute')
    or not has_function_privilege('authenticated','public.admin_pickem_conversion_report(integer)','execute') then
    raise exception 'Reporting execution grants too broad'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.admin_pickem_conversion_report(2098); raise exception 'Anonymous allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare after_state jsonb; begin
  select jsonb_build_object(
    'weeks',(select jsonb_agg(to_jsonb(w) order by w.id) from public.pickem_weeks w),
    'games',(select jsonb_agg(to_jsonb(g) order by g.id) from public.pickem_games g),
    'entries',(select jsonb_agg(to_jsonb(e) order by e.week_id,e.user_id) from public.pickem_contest_entries e),
    'picks',(select jsonb_agg(to_jsonb(p) order by p.id) from public.pickem_picks p),
    'drafts',(select jsonb_agg(to_jsonb(d) order by d.week_id,d.user_id,d.pickem_game_id) from private.pickem_draft_picks d),
    'predictions',(select jsonb_agg(to_jsonb(d) order by d.week_id,d.user_id) from private.pickem_draft_predictions d),
    'follows',(select jsonb_agg(to_jsonb(f) order by f.user_id,f.school_slug) from public.school_follows f),
    'standings',(select jsonb_agg(to_jsonb(s) order by s.season,s.user_id) from public.pickem_standings s)
  ) into after_state;
  if after_state is distinct from (select state from report_before) then raise exception 'Report changed underlying state'; end if;
end $$;

-- Open later week without entries: still not measurable.
update public.pickem_weeks set status='open' where id=(select week_id from report_games where week=7 limit 1);
set local role authenticated;
do $$ declare r jsonb; pair jsonb; w uuid; picks jsonb; begin
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  r:=public.admin_pickem_conversion_report(2098);
  select value into pair from jsonb_array_elements(r->'retention') where value->>'previous_week'='6';
  if pair->>'measurable'<>'false' or pair->'repeat_rate_pct'<>'null'::jsonb then raise exception 'Empty open week retention mislabeled'; end if;
  select week_id into w from report_games where week=7 limit 1;
  select jsonb_object_agg(id::text,'report-home') into picks from report_games where week=7;
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='A'),true);
  perform public.submit_pickem_contest_entry(w,'2545550903',42,picks,true);
  -- A second save edits the same receipt, not another participant/entry.
  perform public.submit_pickem_contest_entry(w,null,44,picks,true);
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='new'),true);
  perform public.submit_pickem_contest_entry(w,'2545550910',42,picks,true);
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  r:=public.admin_pickem_conversion_report(2098);
  select value into pair from jsonb_array_elements(r->'retention') where value->>'previous_week'='6';
  if pair->>'measurable'<>'true' or pair->>'previous_valid_cohort'<>'2'
    or pair->>'repeat_valid_entries'<>'1' or pair->>'repeat_rate_pct'<>'50.0'
    or r#>>'{summary,unique_valid_participants}'<>'3' or r#>>'{summary,total_valid_entries}'<>'4'
    or r#>>'{summary,average_entries_per_participant}'<>'1.33'
    or r#>>'{summary,no_current_follows}'<>'1' then raise exception 'Repeat/unique counts incorrect: %',r; end if;
end $$;
reset role;
-- Prize finalization derives from the existing ledger, not status/selection guesses.
insert into private.pickem_contest_finalizations(week_id,finalized_at,actor_id,state)
select distinct g.week_id,now(),u.id,'current' from report_games g cross join report_users u
where g.week in(6,7) and u.label='admin';
set local role authenticated;
do $$ declare r jsonb; w jsonb; pair jsonb; begin
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  r:=public.admin_pickem_conversion_report(2098);
  select value into w from jsonb_array_elements(r->'weeks') where value->>'week'='6';
  select value into pair from jsonb_array_elements(r->'retention') where value->>'previous_week'='6';
  if w->>'prize_state'<>'finalized' or w->'finalized_at'='null'::jsonb or pair->>'finalized'<>'true' then
    raise exception 'Finalization ledger ignored'; end if;
end $$;
reset role;
update private.pickem_contest_finalizations set state='superseded'
where week_id=(select week_id from report_games where week=6 limit 1);
set local role authenticated;
do $$ declare r jsonb; w jsonb; begin
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  r:=public.admin_pickem_conversion_report(2098);
  select value into w from jsonb_array_elements(r->'weeks') where value->>'week'='6';
  if w->>'prize_state'<>'under_review' or w->'finalized_at'<>'null'::jsonb then
    raise exception 'Superseded finalization shown as final'; end if;
end $$;
reset role;
-- Unfollow removes current evidence; first-ever follow history is not invented.
delete from public.school_follows where user_id=(select id from report_users where label='B');
set local role authenticated;
do $$ declare r jsonb; begin
  perform set_config('request.jwt.claim.sub',(select id::text from report_users where label='admin'),true);
  r:=public.admin_pickem_conversion_report(2098);
  if r#>>'{summary,currently_following}'<>'1' or r#>>'{summary,no_current_follows}'<>'2'
    or r#>>'{summary,earliest_surviving_follow_after_first_entry}'<>'0' then raise exception 'Deleted follow history invented'; end if;
end $$;
reset role;
select 'PASS: reporting authority, privacy, cohorts, drafts, VOID completeness, retention, follow timing, and read-only regression' as result;
rollback;

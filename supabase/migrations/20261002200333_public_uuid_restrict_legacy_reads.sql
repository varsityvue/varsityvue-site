-- Stage C: STOP before applying until Stage A and migrated application are live.
-- Privileged full configuration snapshots remain possible without public creator reads.
create view public.internal_pickem_weeks with(security_barrier=true) as
 select id,season,week,title,status,opens_at,closes_at,created_by,created_at,updated_at,tiebreaker_game_id,
 entry_deadline_at,outcome_resolution_at,official_rules_version,official_rules_published_at,
 presenting_sponsor_name,configuration_revision from public.pickem_weeks where private.can_moderate_scores();
revoke all on public.internal_pickem_weeks from public,anon,authenticated;
grant select on public.internal_pickem_weeks to authenticated;
-- Release must use --include-all only if independently needed; never push both stages together.
drop policy "Profiles are publicly readable" on public.profiles;
create policy "Profiles readable by self or trusted reviewers" on public.profiles for select to authenticated
 using(id=auth.uid() or private.can_moderate_scores());
revoke select on public.profiles from public,anon;
revoke select on public.pickem_standings,public.pickem_week_standings from public,anon,authenticated;
drop policy "Pickem totals are publicly readable" on public.pickem_member_totals;
create policy "Pickem totals readable by active owner or reviewers" on public.pickem_member_totals for select to authenticated
 using(private.is_active_member(auth.uid()) and (user_id=auth.uid() or private.can_moderate_scores()));
revoke select on public.pickem_member_totals from public,anon;
drop policy "Entrants read own prediction and locked GOTW predictions" on public.pickem_week_tiebreakers;
create policy "Predictions readable by active owner or reviewers" on public.pickem_week_tiebreakers for select to authenticated
 using(private.is_active_member(auth.uid()) and (user_id=auth.uid() or private.can_moderate_scores()));
drop policy "Active users can read events for visible submissions" on public.score_submission_events;
create policy "Raw scoring events readable by trusted reviewers" on public.score_submission_events for select to authenticated
 using(private.can_moderate_scores());
revoke all on public.score_submission_events from public,anon,authenticated;
grant select on public.score_submission_events to authenticated;
-- Operators retain full state reads, including invoker Score Scout lock/invariant reads.
-- Ordinary members use the verified, explicitly sanitized public_game_state projection.
drop policy "Verified game state is readable to members" on public.game_state;
create policy "Game state base reads restricted to trusted reviewers" on public.game_state for select to authenticated
 using(private.can_moderate_scores());
revoke select on public.game_state from public,anon;
grant select(game_id,status,home_score,away_score,period,clock,verified,verified_at,created_at,updated_at,
 kickoff_override,result_type,official_winner_school_slug,away_school_slug,home_school_slug,
 schedule_revision,schedule_revised_at,outcome_revision,score_revision) on public.game_state to anon;
-- No owner need for reviewer UUID, source context, review notes or authorization tokens.
-- id/status remain selectable for the unchanged invoker community INSERT RETURNING contract.
revoke select on public.score_submissions from public,anon,authenticated;
grant select(id,game_id,submitted_by,home_score,away_score,game_status,period,clock,status,created_at,updated_at,reviewed_at)
 on public.score_submissions to authenticated;
revoke select on public.team_feed_posts,public.school_roster_players,public.pickem_weeks from public,anon,authenticated;
grant select(id,primary_school_id,secondary_school_id,game_id,source_type,status,caption,published_at,created_at,updated_at)
 on public.team_feed_posts to anon,authenticated;
grant select(id,school_slug,season,first_name,last_name,jersey_number,position,grade,active,created_at,updated_at,player_profile_id)
 on public.school_roster_players to anon,authenticated;
grant select(id,season,week,title,status,opens_at,closes_at,created_at,updated_at,tiebreaker_game_id,entry_deadline_at,
 outcome_resolution_at,official_rules_version,official_rules_published_at,presenting_sponsor_name,configuration_revision)
 on public.pickem_weeks to anon,authenticated;

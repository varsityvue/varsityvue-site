-- Register the twelve newly reconciled Week 5 games that were not present in
-- the original reviewed final-score notification catalog. Registration alone
-- does not create a notification event or delivery; those remain gated on the
-- first verified numeric-final transition and an eligible follower.

insert into private.final_score_notification_games (
  game_id,
  game_date,
  kickoff,
  away_team_name,
  home_team_name,
  away_school_slug,
  home_school_slug
) values
  ('bowie-at-city-view-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Bowie', 'City View', 'bowie', 'city-view'),
  ('breckenridge-at-anson-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Breckenridge', 'Anson', 'breckenridge', 'anson'),
  ('bridgeport-at-henrietta-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Bridgeport', 'Henrietta', 'bridgeport', 'henrietta'),
  ('chico-at-abilene-texas-leadership-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Chico', 'Abilene Texas Leadership', 'chico', 'abilene-texas-leadership'),
  ('clifton-at-rio-vista-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Clifton', 'Rio Vista', 'clifton', 'rio-vista'),
  ('dublin-at-millsap-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Dublin', 'Millsap', 'dublin', 'millsap'),
  ('hamilton-at-eastland-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Hamilton', 'Eastland', 'hamilton', 'eastland'),
  ('hamlin-at-cross-plains-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Hamlin', 'Cross Plains', 'hamlin', 'cross-plains'),
  ('holliday-at-whitesboro-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Holliday', 'Whitesboro', 'holliday', 'whitesboro'),
  ('meridian-at-hubbard-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Meridian', 'Hubbard', 'meridian', 'hubbard'),
  ('san-angelo-texas-leadership-at-merkel-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'San Angelo Texas Leadership Charter Academy', 'Merkel', 'san-angelo-texas-leadership', 'merkel'),
  ('wortham-at-mart-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Wortham', 'Mart', 'wortham', 'mart')
on conflict (game_id) do nothing;

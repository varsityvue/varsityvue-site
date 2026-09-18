-- Normalize the original De Leon static roster into the managed roster table.
-- player_profile_id preserves each existing canonical VarsityVue player identity.

insert into public.school_roster_players
  (school_slug, season, first_name, last_name, jersey_number, position, grade, player_profile_id, active)
select v.*
from (values
  ('de-leon', 2026, 'Keegan', 'Bostic', 0, 'TE / DL', 'Jr', 'de-leon-keegan-bostic-2026', true),
  ('de-leon', 2026, 'Lane', 'Couch', 1, 'RB / LB', 'Jr', 'de-leon-lane-couch-2026', true),
  ('de-leon', 2026, 'Bentley', 'Lingle', 2, 'WR / DB', 'Jr', 'de-leon-bentley-lingle-2026', true),
  ('de-leon', 2026, 'Trenton', 'Zmeskal', 3, 'WR / LB', 'Sr', 'de-leon-trenton-zmeskal-2026', true),
  ('de-leon', 2026, 'Andrew', 'Campbell', 4, 'WR / DB', 'Sr', 'de-leon-andrew-campbell-2026', true),
  ('de-leon', 2026, 'Bryce', 'Burkeen', 5, 'WR / DB', 'Sr', 'de-leon-bryce-burkeen-2026', true),
  ('de-leon', 2026, 'Kayden', 'Tobar', 6, 'WR / LB', 'Sr', 'de-leon-kayden-tobar-2026', true),
  ('de-leon', 2026, 'Collin', 'Mathews', 7, 'WR / LB', 'Jr', 'de-leon-collin-mathews-2026', true),
  ('de-leon', 2026, 'Beau', 'Morris', 8, 'QB / CB', 'Jr', 'de-leon-beau-morris-2026', true),
  ('de-leon', 2026, 'Jayden', 'Lindley', 9, 'WR / DB', 'Sr', 'de-leon-jayden-lindley-2026', true),
  ('de-leon', 2026, 'Samuel', 'Martinez', 10, 'TE / OLB', 'Jr', 'de-leon-samuel-martinez-2026', true),
  ('de-leon', 2026, 'Caden', 'Morganstean', 11, 'WR / DB', 'Sr', 'de-leon-caden-morganstean-2026', true),
  ('de-leon', 2026, 'Hud', 'Price', 12, 'QB / DB', 'Sr', 'de-leon-hud-price-2026', true),
  ('de-leon', 2026, 'Alex', 'Reyna', 14, 'TE / DL', 'Sr', 'de-leon-alex-reyna-2026', true),
  ('de-leon', 2026, 'Andrew', 'Otwell', 15, 'WR / DB', 'Jr', 'de-leon-andrew-otwell-2026', true),
  ('de-leon', 2026, 'Dominic', 'Gonzales', 20, 'RB / LB', 'Jr', 'de-leon-dominic-gonzales-2026', true),
  ('de-leon', 2026, 'Ed', 'Garcia', 21, 'RB / LB', 'Sr', 'de-leon-ed-garcia-2026', true),
  ('de-leon', 2026, 'Alex', 'Silva', 23, 'WR / CB', 'Sr', 'de-leon-alex-silva-2026', true),
  ('de-leon', 2026, 'Harley', 'Pinckard', 25, 'WR / DB', 'Sr', 'de-leon-harley-pinckard-2026', true),
  ('de-leon', 2026, 'AJ', 'Stewart', 35, 'TE / LB', 'Jr', 'de-leon-aj-stewart-2026', true),
  ('de-leon', 2026, 'Ethan', 'Tepetate', 50, 'OL / DL', 'Jr', 'de-leon-ethan-tepetate-2026', true),
  ('de-leon', 2026, 'Gage', 'Heinz', 51, 'OL / DL', 'Sr', 'de-leon-gage-heinz-2026', true),
  ('de-leon', 2026, 'Eli', 'Garza', 52, 'OL / DL', 'Sr', 'de-leon-eli-garza-2026', true),
  ('de-leon', 2026, 'Hunter', 'Hatch', 53, 'OL / DL', 'So', 'de-leon-hunter-hatch-2026', true),
  ('de-leon', 2026, 'Jack', 'Thompson', 54, 'OL / DL', 'Sr', 'de-leon-jack-thompson-2026', true),
  ('de-leon', 2026, 'Ben', 'Leal', 55, 'OL / DL', 'Jr', 'de-leon-ben-leal-2026', true),
  ('de-leon', 2026, 'Blayne', 'Sides', 58, 'OL / DL', 'Sr', 'de-leon-blayne-sides-2026', true),
  ('de-leon', 2026, 'Silas', 'Winegeart', 62, 'OL / DL', 'Sr', 'de-leon-silas-winegeart-2026', true),
  ('de-leon', 2026, 'Juan', 'Garcia', 65, 'OL / DL', 'Sr', 'de-leon-juan-garcia-2026', true),
  ('de-leon', 2026, 'Baylor', 'Whiteley', 73, 'OL / DL', 'Sr', 'de-leon-baylor-whiteley-2026', true),
  ('de-leon', 2026, 'Hagen', 'Hare', 78, 'OL / DL', 'Sr', 'de-leon-hagen-hare-2026', true)
) as v(school_slug, season, first_name, last_name, jersey_number, position, grade, player_profile_id, active)
where not exists (
  select 1
  from public.school_roster_players existing
  where existing.school_slug = v.school_slug
    and existing.season = v.season
    and (
      existing.player_profile_id = v.player_profile_id
      or (
        lower(trim(existing.first_name)) = lower(trim(v.first_name))
        and lower(trim(existing.last_name)) = lower(trim(v.last_name))
      )
    )
);

create unique index if not exists school_roster_players_unique_active_profile_idx
on public.school_roster_players (school_slug, season, player_profile_id)
where player_profile_id is not null and active = true;

-- Verified Cisco 2026 roster transcribed from the roster supplied to VarsityVue.
insert into public.school_roster_players
  (school_slug, season, first_name, last_name, jersey_number, position, grade, active)
select v.*
from (values
  ('cisco', 2026, 'Corbin', 'Harrison', 3, 'WR / DB', 'Jr', true),
  ('cisco', 2026, 'Gage', 'Johnson', 6, 'WR / DB', 'Jr', true),
  ('cisco', 2026, 'Cannon', 'Harris', 7, 'WR / DB', 'Sr', true),
  ('cisco', 2026, 'Fabian', 'Silva', 9, 'RB / LB', 'Sr', true),
  ('cisco', 2026, 'Landry', 'Vosburg', 10, 'RB / LB', 'Jr', true),
  ('cisco', 2026, 'July', 'Johnson', 11, 'RB / DB', 'Jr', true),
  ('cisco', 2026, 'Colby', 'McIlroy', 14, 'QB / LB', 'Jr', true),
  ('cisco', 2026, 'Carter', 'Toof', 15, 'WR / DB', 'Sr', true),
  ('cisco', 2026, 'Kai', 'Eubank', 17, 'WR / DB', 'Sr', true),
  ('cisco', 2026, 'Casey', 'Holton', 20, 'WR / DB', 'Sr', true),
  ('cisco', 2026, 'Kreed', 'Gorr', 25, 'RB / LB', 'Jr', true),
  ('cisco', 2026, 'Jayen', 'Brackeen', 30, 'WR / DB', 'Sr', true),
  ('cisco', 2026, 'Caleb', 'Ward', 33, 'TE / LB', 'Jr', true),
  ('cisco', 2026, 'Taj', 'Moore', 40, 'RB / LB', 'So', true),
  ('cisco', 2026, 'Hudson', 'Hernandez', 44, 'RB / LB', 'Sr', true),
  ('cisco', 2026, 'River', 'Frankfort', 50, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Cy', 'Mathews', 51, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Camden', 'Fyock', 52, 'OL / DL', 'Sr', true),
  ('cisco', 2026, 'Ryder', 'Slagle', 53, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Garrett', 'Offutt', 54, 'OL / DL', 'Sr', true),
  ('cisco', 2026, 'Logan', 'Green', 66, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Payton', 'Riley', 73, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Toby', 'Thompson', 75, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Ryder', 'Boykin', 77, 'OL / DL', 'Jr', true),
  ('cisco', 2026, 'Terrick', 'Hernandez', 88, 'WR / DB', 'Sr', true)
) as v(school_slug, season, first_name, last_name, jersey_number, position, grade, active)
where not exists (
  select 1
  from public.school_roster_players existing
  where existing.school_slug = v.school_slug
    and existing.season = v.season
    and existing.active = true
    and (
      existing.jersey_number = v.jersey_number
      or (
        lower(trim(existing.first_name)) = lower(trim(v.first_name))
        and lower(trim(existing.last_name)) = lower(trim(v.last_name))
      )
    )
);

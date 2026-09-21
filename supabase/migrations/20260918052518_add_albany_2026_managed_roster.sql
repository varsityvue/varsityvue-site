-- Verified Albany 2026 roster transcribed from the roster supplied to VarsityVue.
insert into public.school_roster_players
  (school_slug, season, first_name, last_name, jersey_number, position, grade, active)
select v.*
from (values
  ('albany', 2026, 'Blake', 'Britting', 1, 'WR / DB', 'So', true),
  ('albany', 2026, 'Aiden', 'Vickers', 2, 'WR / DB', 'Jr', true),
  ('albany', 2026, 'Lyle', 'Wheeler', 3, 'QB / OLB', 'So', true),
  ('albany', 2026, 'Wesley', 'Gleitz', 4, 'DE / TE', 'Sr', true),
  ('albany', 2026, 'Bennett', 'Neece', 5, 'MLB / FB', 'Jr', true),
  ('albany', 2026, 'Jakobi', 'Roberson', 7, 'RB / OLB', 'Jr', true),
  ('albany', 2026, 'Clay', 'Chapman', 10, 'QB / DB', 'Jr', true),
  ('albany', 2026, 'Ace', 'Townson', 11, 'WR / S', 'So', true),
  ('albany', 2026, 'Rylan', 'Wade', 22, 'WR / OLB', 'So', true),
  ('albany', 2026, 'Sam', 'Tidwell', 29, 'LB / OL / FB', 'So', true),
  ('albany', 2026, 'Ben', 'Russell', 30, 'TE / ILB', 'So', true),
  ('albany', 2026, 'Judson', 'Rogers', 44, null, 'Sr', true),
  ('albany', 2026, 'Jaime', 'Barrera', 50, 'OL / DL', 'So', true),
  ('albany', 2026, 'Josh', 'Thurman', 52, 'DL / OL', 'So', true),
  ('albany', 2026, 'Cash', 'Edgar', 55, 'ILB / OL', 'Jr', true),
  ('albany', 2026, 'Jathan', 'Perez', 60, 'DT / OL', 'So', true),
  ('albany', 2026, 'Ryland', 'Parsons', 61, 'DE / OL', 'Jr', true),
  ('albany', 2026, 'Landrin', 'Rodriguez', 65, 'OLB / OL', 'Jr', true),
  ('albany', 2026, 'Casey', 'Estridge', 66, 'DE / OL', 'Sr', true),
  ('albany', 2026, 'Colter', 'Edgar', 68, 'OL / DL', 'Jr', true),
  ('albany', 2026, 'Jacob', 'Thurman', 72, 'ILB / OL', 'So', true),
  ('albany', 2026, 'Zane', 'Green', 75, 'G / DE', 'Sr', true),
  ('albany', 2026, 'Rush', 'Kidd', 78, 'DE / OL', 'Jr', true),
  ('albany', 2026, 'Levi', 'Murphy', 80, 'WR / C', 'So', true),
  ('albany', 2026, 'Christian', 'Hernandez', 85, 'CB / WR', 'Sr', true)
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

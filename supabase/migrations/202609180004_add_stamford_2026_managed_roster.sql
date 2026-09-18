-- Verified Stamford 2026 roster transcribed from the roster supplied to VarsityVue.
insert into public.school_roster_players
  (school_slug, season, first_name, last_name, jersey_number, position, grade, active)
select v.*
from (values
  ('stamford', 2026, 'Karsten', 'Hall', 1, 'WR / CB', 'Jr', true),
  ('stamford', 2026, 'C''nai', 'Whitfield', 2, 'CB / WR', 'Sr', true),
  ('stamford', 2026, 'Trey', 'Dippel', 3, 'WR / DB', 'Sr', true),
  ('stamford', 2026, 'Miles', 'Follis', 4, 'QB / ILB', 'Jr', true),
  ('stamford', 2026, 'Baylor', 'Flow', 5, 'RB / DE', 'Sr', true),
  ('stamford', 2026, 'Carlos', 'Vega', 6, 'TE / MLB', 'Sr', true),
  ('stamford', 2026, 'Brennan', 'Armstrong', 7, 'WR / CB', 'Jr', true),
  ('stamford', 2026, 'Dallas', 'Sanchez', 8, 'WR / CB', 'Jr', true),
  ('stamford', 2026, 'Josh', 'Andruch', 10, 'RB / OLB', 'Sr', true),
  ('stamford', 2026, 'Slayden', 'Young', 11, 'WR / SS', 'Jr', true),
  ('stamford', 2026, 'Levi', 'Vahlenkamp', 12, 'WR / CB', 'Sr', true),
  ('stamford', 2026, 'Aiden', 'Sarmiento', 13, 'WR / DB', 'Sr', true),
  ('stamford', 2026, 'Julian', 'Silguero', 20, 'WR / LB', 'Jr', true),
  ('stamford', 2026, 'Ace', 'Martinez', 22, 'RB / OLB', 'Jr', true),
  ('stamford', 2026, 'Christopher', 'McCann', 28, 'FB / RB', 'Sr', true),
  ('stamford', 2026, 'Brenham', 'Walker', 40, 'RB / ILB', 'Sr', true),
  ('stamford', 2026, 'Everett', 'Ekdahl', 50, 'DE / T', 'Sr', true),
  ('stamford', 2026, 'Pablo', 'Ledesma', 51, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Cooper', 'Wilhelm', 53, 'OL / DL', 'Jr', true),
  ('stamford', 2026, 'Wade', 'Wright', 55, 'OL / ILB', 'Jr', true),
  ('stamford', 2026, 'Jordan', 'Burns', 56, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Ian', 'Perkins', 60, 'OL / DL', 'Jr', true),
  ('stamford', 2026, 'Ethan', 'Finley', 62, 'OL / ILB', 'Fr', true),
  ('stamford', 2026, 'Brody', 'Becknal', 64, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Braeden', 'Becknal', 65, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Cutter', 'Caddell', 66, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Wyatt', 'Walburg', 74, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Jaxon', 'Reed', 75, 'OL / DL', 'Fr', true),
  ('stamford', 2026, 'Tristan', 'Brooks', 78, 'OL / DL', 'Sr', true),
  ('stamford', 2026, 'Kree', 'McCright', 88, 'DE / TE', 'Sr', true)
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

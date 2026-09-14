create table public.school_roster_players (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null,
  season integer not null default 2026 check (season between 2000 and 2100),
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  jersey_number integer check (jersey_number between 0 and 99),
  position text check (position is null or char_length(trim(position)) between 1 and 40),
  grade text check (grade is null or grade in ('Fr', 'So', 'Jr', 'Sr')),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index school_roster_players_school_season_idx
  on public.school_roster_players (school_slug, season, active);

create unique index school_roster_players_unique_number_idx
  on public.school_roster_players (school_slug, season, jersey_number)
  where jersey_number is not null and active = true;

alter table public.school_roster_players enable row level security;

create policy "Public can read active roster players"
  on public.school_roster_players
  for select
  using (active = true);

create policy "Admins and assigned coaches can add roster players"
  on public.school_roster_players
  for insert
  to authenticated
  with check (
    private.has_role('admin'::public.user_role)
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  );

create policy "Admins and assigned coaches can update roster players"
  on public.school_roster_players
  for update
  to authenticated
  using (
    private.has_role('admin'::public.user_role)
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
  with check (
    private.has_role('admin'::public.user_role)
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  );

create policy "Admins and assigned coaches can remove roster players"
  on public.school_roster_players
  for delete
  to authenticated
  using (
    private.has_role('admin'::public.user_role)
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  );
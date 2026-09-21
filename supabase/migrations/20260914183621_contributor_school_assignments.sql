create table public.contributor_school_assignments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_slug text not null,
  assignment_role text not null default 'scorekeeper'
    check (assignment_role in ('scorekeeper', 'coach')),
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, school_slug)
);

create index contributor_school_assignments_school_idx
  on public.contributor_school_assignments(school_slug)
  where active = true;

create trigger contributor_school_assignments_set_updated_at
before update on public.contributor_school_assignments
for each row execute procedure public.set_updated_at();

alter table public.contributor_school_assignments enable row level security;

create policy "Contributors can read own school assignments"
on public.contributor_school_assignments for select
to authenticated
using (user_id = auth.uid() or private.can_moderate_scores());

create policy "Moderators manage contributor school assignments"
on public.contributor_school_assignments for all
to authenticated
using (private.can_moderate_scores())
with check (private.can_moderate_scores());

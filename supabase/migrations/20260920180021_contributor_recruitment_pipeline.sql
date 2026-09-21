create table public.contributor_recruitment_pipeline (
  school_slug text primary key,
  recruitment_status text not null default 'uncovered'
    check (recruitment_status in ('uncovered', 'researching', 'contacted', 'interested', 'onboarding', 'paused')),
  candidate_name text check (candidate_name is null or char_length(candidate_name) <= 120),
  candidate_contact text check (candidate_contact is null or char_length(candidate_contact) <= 240),
  recruitment_note text check (recruitment_note is null or char_length(recruitment_note) <= 1000),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contributor_recruitment_status_idx
  on public.contributor_recruitment_pipeline(recruitment_status, updated_at desc);

alter table public.contributor_recruitment_pipeline enable row level security;
revoke all on public.contributor_recruitment_pipeline from public, anon, authenticated;
grant select, insert, update, delete on public.contributor_recruitment_pipeline to authenticated;

create policy "Admins read contributor recruitment pipeline"
on public.contributor_recruitment_pipeline for select to authenticated
using ((select private.has_role('admin'::public.user_role)));

create policy "Admins add contributor recruitment pipeline"
on public.contributor_recruitment_pipeline for insert to authenticated
with check (
  (select private.has_role('admin'::public.user_role))
  and updated_by = (select auth.uid())
);

create policy "Admins update contributor recruitment pipeline"
on public.contributor_recruitment_pipeline for update to authenticated
using ((select private.has_role('admin'::public.user_role)))
with check (
  (select private.has_role('admin'::public.user_role))
  and updated_by = (select auth.uid())
);

create policy "Admins remove contributor recruitment pipeline"
on public.contributor_recruitment_pipeline for delete to authenticated
using ((select private.has_role('admin'::public.user_role)));

-- Authenticated members may follow canonical, repository-backed school slugs.
-- The application validates that a slug exists in the repository school catalog.

create table public.school_follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_slug text not null,
  source_surface text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, school_slug),
  constraint school_follows_school_slug_format
    check (
      char_length(school_slug) between 1 and 100
      and school_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  constraint school_follows_source_surface_format
    check (
      char_length(source_surface) between 1 and 64
      and source_surface ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    )
);

alter table public.school_follows enable row level security;

create policy "Members can read own school follows"
on public.school_follows for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Members can create own school follows"
on public.school_follows for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Members can delete own school follows"
on public.school_follows for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.school_follows from public, anon, authenticated;
grant select, insert, delete on table public.school_follows to authenticated;

begin;
-- Existing associations retain their exact editorial placement. Adding the
-- constant default avoids per-row updates (and the updated_at trigger).
alter table public.team_feed_posts
  add column show_on_secondary_school boolean not null default true;
-- New posts are primary-only unless an administrator explicitly chooses both.
alter table public.team_feed_posts alter column show_on_secondary_school set default false;
-- This table uses column-level SELECT grants; preserve its restricted contract.
grant select(show_on_secondary_school) on public.team_feed_posts to anon, authenticated;
comment on column public.team_feed_posts.show_on_secondary_school is
  'Editorial feed placement only. Related school and game associations are preserved independently.';
commit;

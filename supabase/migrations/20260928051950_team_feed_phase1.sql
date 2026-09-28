-- School and game IDs refer to the canonical repository catalog, validated by server actions.
create table public.team_feed_posts (
  id uuid primary key default gen_random_uuid(),
  primary_school_id text not null,
  secondary_school_id text check (secondary_school_id is null or secondary_school_id <> primary_school_id),
  game_id text,
  source_type text not null default 'varsityvue' check (source_type in ('varsityvue','community')),
  status text not null default 'draft' check (status in ('draft','published','unpublished','pending','rejected')),
  caption text check (char_length(caption) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_feed_publication_state check ((status = 'published' and published_at is not null) or status <> 'published')
);
create trigger team_feed_posts_updated before update on public.team_feed_posts
for each row execute function public.set_updated_at();
create index team_feed_primary_public_idx on public.team_feed_posts(primary_school_id,published_at desc,id desc) where status = 'published';
create index team_feed_secondary_public_idx on public.team_feed_posts(secondary_school_id,published_at desc,id desc) where status = 'published';

create table public.team_feed_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_feed_posts(id) on delete cascade,
  public_path text unique,
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  width integer not null check (width between 1 and 10000),
  height integer not null check (height between 1 and 10000),
  byte_size integer not null check (byte_size between 1 and 10485760),
  mime_type text not null check (mime_type = 'image/webp'),
  created_at timestamptz not null default now()
);
create index team_feed_media_post_idx on public.team_feed_media(post_id);

alter table public.team_feed_posts enable row level security;
alter table public.team_feed_media enable row level security;
grant select on public.team_feed_posts, public.team_feed_media to anon;
grant select, insert, update on public.team_feed_posts, public.team_feed_media to authenticated;
create policy "Published feed posts are public" on public.team_feed_posts for select
to anon,authenticated using (status = 'published' and published_at <= now());
create policy "Admins read all feed posts" on public.team_feed_posts for select
to authenticated using (public.has_role('admin'));
create policy "Admins create feed posts" on public.team_feed_posts for insert
to authenticated with check (public.has_role('admin') and created_by = (select auth.uid()) and source_type = 'varsityvue');
create policy "Admins update feed posts" on public.team_feed_posts for update
to authenticated using (public.has_role('admin')) with check (public.has_role('admin') and source_type = 'varsityvue');
create policy "Published media are public" on public.team_feed_media for select
to anon,authenticated using (exists (select 1 from public.team_feed_posts p where p.id = post_id and p.status = 'published' and p.published_at <= now()));
create policy "Admins read all feed media" on public.team_feed_media for select
to authenticated using (public.has_role('admin'));
create policy "Admins insert feed media" on public.team_feed_media for insert
to authenticated with check (public.has_role('admin'));
create policy "Admins update feed media" on public.team_feed_media for update
to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Private object keys are derived server-side from opaque post/media IDs and never stored in a public row.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('team-feed-private','team-feed-private',false,10485760,array['image/webp']),
       ('team-feed-public','team-feed-public',true,10485760,array['image/webp']);
create policy "Admins manage private team feed objects" on storage.objects for all
to authenticated using (bucket_id = 'team-feed-private' and public.has_role('admin'))
with check (bucket_id = 'team-feed-private' and public.has_role('admin'));
create policy "Admins create public team feed objects" on storage.objects for insert
to authenticated with check (bucket_id = 'team-feed-public' and public.has_role('admin'));
create policy "Admins read public team feed objects for upsert" on storage.objects for select
to authenticated using (bucket_id = 'team-feed-public' and public.has_role('admin'));
create policy "Admins replace public team feed objects" on storage.objects for update
to authenticated using (bucket_id = 'team-feed-public' and public.has_role('admin'))
with check (bucket_id = 'team-feed-public' and public.has_role('admin'));
create policy "Admins remove public team feed objects" on storage.objects for delete
to authenticated using (bucket_id = 'team-feed-public' and public.has_role('admin'));

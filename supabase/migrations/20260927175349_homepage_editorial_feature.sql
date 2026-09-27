create table public.homepage_editorial_features (
  id bigint generated always as identity primary key,
  season integer not null check (season between 2020 and 2100),
  week integer not null check (week between 0 and 30),
  feature_type text not null check (feature_type in ('game_of_the_week', 'district_preview', 'district_predictions', 'rivalry_week', 'playoff_preview', 'rankings', 'general_feature')),
  eyebrow text not null check (char_length(eyebrow) between 1 and 70),
  headline text not null check (char_length(headline) between 1 and 160),
  description text not null check (char_length(description) between 1 and 500),
  image_path text,
  article_slug text,
  destination_path text,
  cta_label text not null check (char_length(cta_label) between 1 and 70),
  game_id text,
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (season, week),
  constraint feature_game_required check (feature_type <> 'game_of_the_week' or game_id is not null),
  constraint feature_single_destination check (article_slug is null or destination_path is null),
  constraint feature_local_image check (image_path is null or (image_path ~ '^/[A-Za-z0-9/_#?.=&%-]*$' and image_path not like '//%')),
  constraint feature_local_destination check (destination_path is null or (destination_path ~ '^/[A-Za-z0-9/_#?.=&%-]*$' and destination_path not like '//%'))
);

create unique index one_active_homepage_feature on public.homepage_editorial_features (active) where active;
alter table public.homepage_editorial_features enable row level security;
grant select on public.homepage_editorial_features to anon, authenticated;
grant insert, update, delete on public.homepage_editorial_features to authenticated;
grant usage, select on sequence public.homepage_editorial_features_id_seq to authenticated;
create policy "Public reads active editorial feature" on public.homepage_editorial_features
  for select to anon using (active);
create policy "Members read active or admins read drafts" on public.homepage_editorial_features
  for select to authenticated using (active or private.has_role('admin'));
create policy "Admins insert editorial features" on public.homepage_editorial_features
  for insert to authenticated with check (private.has_role('admin'));
create policy "Admins update editorial features" on public.homepage_editorial_features
  for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));
create policy "Admins delete editorial features" on public.homepage_editorial_features
  for delete to authenticated using (private.has_role('admin'));

insert into public.homepage_editorial_features
  (season, week, feature_type, eyebrow, headline, description, game_id, cta_label, active)
values
  (2026, 5, 'game_of_the_week', 'Game of the Week', 'Jacksboro at Cisco', 'Visit the matchup center for the final result and coverage.', 'jacksboro-at-cisco-2026-week-5', 'View Final Result', true),
  (2026, 6, 'district_preview', 'Week 6 Spotlight', 'District Races Take Center Stage', 'With several featured programs on bye, VarsityVue is turning its attention to the district races, contenders, predictions, and games that will shape October.', null, 'View District Previews →', false);

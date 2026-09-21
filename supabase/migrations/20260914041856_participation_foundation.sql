-- VarsityVue participation foundation
--
-- This migration intentionally leaves current schedules, schools, stats, and
-- editorial content in the existing repository data files. Supabase becomes
-- the source of truth for dynamic/member-generated state first.

create extension if not exists pgcrypto;

create type public.user_role as enum ('member','scorekeeper','moderator','admin');
create type public.score_submission_status as enum ('pending','approved','rejected','superseded');
create type public.score_submission_event_type as enum ('submitted','approved','rejected','superseded','note_added');
create type public.pickem_week_status as enum ('draft','open','locked','graded');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  favorite_school_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$')
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(coalesce(new.raw_user_meta_data ->> 'display_name', ''), ''));
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

create table public.game_state (
  game_id text primary key,
  status text not null default 'upcoming' check (status in ('scheduled','upcoming','live','final','postponed','cancelled')),
  home_score integer check (home_score is null or home_score >= 0),
  away_score integer check (away_score is null or away_score >= 0),
  period text,
  clock text,
  source_submission_id uuid,
  verified boolean not null default false,
  verified_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_state_scores_together check ((home_score is null) = (away_score is null))
);
create trigger game_state_set_updated_at before update on public.game_state for each row execute procedure public.set_updated_at();

create table public.score_submissions (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  game_status text not null default 'live' check (game_status in ('upcoming','live','final','postponed','cancelled')),
  period text,
  clock text,
  source_note text,
  source_url text,
  status public.score_submission_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_state add constraint game_state_source_submission_fkey foreign key (source_submission_id) references public.score_submissions(id) on delete set null;
create index score_submissions_game_id_idx on public.score_submissions(game_id, created_at desc);
create index score_submissions_status_idx on public.score_submissions(status, created_at asc);
create index score_submissions_submitter_idx on public.score_submissions(submitted_by, created_at desc);
create trigger score_submissions_set_updated_at before update on public.score_submissions for each row execute procedure public.set_updated_at();

create table public.score_submission_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.score_submissions(id) on delete cascade,
  event_type public.score_submission_event_type not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index score_submission_events_submission_idx on public.score_submission_events(submission_id, created_at asc);

create or replace function public.log_score_submission_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.score_submission_events (submission_id,event_type,actor_id,payload)
  values (new.id,'submitted',new.submitted_by,jsonb_build_object('game_id',new.game_id,'home_score',new.home_score,'away_score',new.away_score,'game_status',new.game_status,'period',new.period,'clock',new.clock));
  return new;
end;
$$;
create trigger score_submission_created_event after insert on public.score_submissions for each row execute procedure public.log_score_submission_created();

create table public.pickem_weeks (
  id uuid primary key default gen_random_uuid(),
  season integer not null check (season >= 2000),
  week integer not null check (week >= 0),
  title text not null,
  status public.pickem_week_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season, week)
);
create trigger pickem_weeks_set_updated_at before update on public.pickem_weeks for each row execute procedure public.set_updated_at();

create table public.pickem_games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  game_id text not null,
  sort_order integer not null default 0,
  lock_at timestamptz not null,
  result_winner_school_slug text,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (week_id, game_id)
);
create index pickem_games_week_idx on public.pickem_games(week_id, sort_order);

create table public.pickem_picks (
  id uuid primary key default gen_random_uuid(),
  pickem_game_id uuid not null references public.pickem_games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  picked_school_slug text not null,
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pickem_game_id, user_id)
);
create index pickem_picks_user_idx on public.pickem_picks(user_id, submitted_at desc);
create trigger pickem_picks_set_updated_at before update on public.pickem_picks for each row execute procedure public.set_updated_at();

create or replace view public.pickem_standings as
select p.user_id, pr.display_name, pr.username,
  count(*) filter (where p.is_correct is not null) as graded_picks,
  count(*) filter (where p.is_correct = true) as correct_picks,
  count(*) filter (where p.is_correct = false) as incorrect_picks,
  case when count(*) filter (where p.is_correct is not null) = 0 then 0::numeric
       else round(100.0 * count(*) filter (where p.is_correct = true) / count(*) filter (where p.is_correct is not null),1) end as accuracy_pct
from public.pickem_picks p join public.profiles pr on pr.id = p.user_id
group by p.user_id, pr.display_name, pr.username;

create or replace function public.has_role(required_role public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = required_role);
$$;

create or replace function public.can_moderate_scores()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('moderator') or public.has_role('admin');
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.game_state enable row level security;
alter table public.score_submissions enable row level security;
alter table public.score_submission_events enable row level security;
alter table public.pickem_weeks enable row level security;
alter table public.pickem_games enable row level security;
alter table public.pickem_picks enable row level security;

create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Users can read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.can_moderate_scores());
create policy "Game state is publicly readable" on public.game_state for select using (true);
create policy "Moderators can insert game state" on public.game_state for insert to authenticated with check (public.can_moderate_scores());
create policy "Moderators can update game state" on public.game_state for update to authenticated using (public.can_moderate_scores()) with check (public.can_moderate_scores());
create policy "Authenticated users can submit scores" on public.score_submissions for insert to authenticated with check (submitted_by = auth.uid() and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "Users can read own score submissions" on public.score_submissions for select to authenticated using (submitted_by = auth.uid() or public.can_moderate_scores());
create policy "Moderators can update score submissions" on public.score_submissions for update to authenticated using (public.can_moderate_scores()) with check (public.can_moderate_scores());
create policy "Users can read events for visible submissions" on public.score_submission_events for select to authenticated using (exists (select 1 from public.score_submissions s where s.id = submission_id and (s.submitted_by = auth.uid() or public.can_moderate_scores())));
create policy "Pickem weeks are publicly readable" on public.pickem_weeks for select using (true);
create policy "Pickem games are publicly readable" on public.pickem_games for select using (true);
create policy "Moderators manage pickem weeks" on public.pickem_weeks for all to authenticated using (public.can_moderate_scores()) with check (public.can_moderate_scores());
create policy "Moderators manage pickem games" on public.pickem_games for all to authenticated using (public.can_moderate_scores()) with check (public.can_moderate_scores());
create policy "Users can read own picks" on public.pickem_picks for select to authenticated using (user_id = auth.uid() or public.can_moderate_scores());
create policy "Users can create own picks" on public.pickem_picks for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own ungraded picks" on public.pickem_picks for update to authenticated using (user_id = auth.uid() and is_correct is null) with check (user_id = auth.uid() and is_correct is null);

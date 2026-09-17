-- Durable member lifecycle enforcement and scalable admin member queries.

create table public.member_account_status (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  suspended_at timestamptz,
  suspended_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint member_account_status_suspension_shape check (
    (status = 'active' and suspended_at is null and suspended_by is null)
    or (status = 'suspended' and suspended_at is not null)
  )
);

insert into public.member_account_status (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create index member_account_status_status_idx
  on public.member_account_status(status, updated_at desc);

create table public.admin_member_lifecycle_events (
  id bigint generated always as identity primary key,
  action text not null check (action in ('suspend', 'restore', 'permanent_delete')),
  target_user_id uuid not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  prior_status text check (prior_status is null or prior_status in ('active', 'suspended')),
  resulting_status text check (resulting_status is null or resulting_status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create index admin_member_lifecycle_events_target_idx
  on public.admin_member_lifecycle_events(target_user_id, created_at desc);

alter table public.member_account_status enable row level security;
alter table public.admin_member_lifecycle_events enable row level security;

revoke all on table public.member_account_status from public, anon, authenticated;
grant select on table public.member_account_status to authenticated;
revoke all on table public.admin_member_lifecycle_events from public, anon, authenticated;
grant select on table public.admin_member_lifecycle_events to authenticated;

create or replace function private.is_active_member(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member_account_status account_status
    where account_status.user_id = check_user_id
      and account_status.status = 'active'
  );
$$;

revoke all on function private.is_active_member(uuid) from public, anon;
grant execute on function private.is_active_member(uuid) to authenticated;

create or replace function private.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_active_member(auth.uid()) and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create policy "Members can read own account status"
on public.member_account_status for select
to authenticated
using (user_id = auth.uid() or private.has_role('admin'::public.user_role));

create policy "Active admins can read lifecycle events"
on public.admin_member_lifecycle_events for select
to authenticated
using (private.has_role('admin'::public.user_role));

-- A suspended JWT may still be cryptographically valid until its normal
-- expiry. Enforce suspension at the data boundary for every member mutation.
drop policy "Users can update their own profile" on public.profiles;
create policy "Active users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() and private.is_active_member())
with check (id = auth.uid() and private.is_active_member());

drop policy "Authenticated users can submit scores" on public.score_submissions;
create policy "Active users can submit scores"
on public.score_submissions for insert
to authenticated
with check (
  private.is_active_member()
  and submitted_by = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy "Users can create own picks" on public.pickem_picks;
create policy "Active users can create own picks"
on public.pickem_picks for insert
to authenticated
with check (private.is_active_member() and user_id = auth.uid());

drop policy "Users can update own ungraded picks" on public.pickem_picks;
create policy "Active users can update own ungraded picks"
on public.pickem_picks for update
to authenticated
using (private.is_active_member() and user_id = auth.uid() and is_correct is null)
with check (private.is_active_member() and user_id = auth.uid() and is_correct is null);

drop policy "Members can create own school follows" on public.school_follows;
create policy "Active members can create own school follows"
on public.school_follows for insert
to authenticated
with check (private.is_active_member() and (select auth.uid()) = user_id);

drop policy "Members can delete own school follows" on public.school_follows;
create policy "Active members can delete own school follows"
on public.school_follows for delete
to authenticated
using (private.is_active_member() and (select auth.uid()) = user_id);

drop policy "Admins moderators and assigned coaches can add roster players" on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can add roster players"
on public.school_roster_players for insert
to authenticated
with check (
  private.is_active_member()
  and (
    private.has_role('admin'::public.user_role)
    or private.has_role('moderator'::public.user_role)
    or exists (
      select 1 from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

drop policy "Admins moderators and assigned coaches can update roster player" on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can update roster player"
on public.school_roster_players for update
to authenticated
using (
  private.is_active_member()
  and (
    private.has_role('admin'::public.user_role)
    or private.has_role('moderator'::public.user_role)
    or exists (
      select 1 from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
)
with check (
  private.is_active_member()
  and (
    private.has_role('admin'::public.user_role)
    or private.has_role('moderator'::public.user_role)
    or exists (
      select 1 from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

drop policy "Admins moderators and assigned coaches can remove roster player" on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can remove roster player"
on public.school_roster_players for delete
to authenticated
using (
  private.is_active_member()
  and (
    private.has_role('admin'::public.user_role)
    or private.has_role('moderator'::public.user_role)
    or exists (
      select 1 from public.contributor_school_assignments csa
      where csa.user_id = auth.uid()
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

-- Preserve score history while removing personally identifying attribution.
alter table public.score_submissions
  alter column submitted_by drop not null;
alter table public.score_submissions
  drop constraint score_submissions_submitted_by_fkey;
alter table public.score_submissions
  add constraint score_submissions_submitted_by_fkey
  foreign key (submitted_by) references public.profiles(id) on delete set null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', ''), '')
  );

  insert into public.member_account_status (user_id)
  values (new.id);

  insert into public.user_roles (user_id, role)
  values (new.id, 'member'::public.user_role);

  return new;
end;
$$;

create or replace function public.admin_member_view_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  select jsonb_build_object(
    'all', count(*),
    'general', count(*) filter (where not exists (
      select 1 from public.user_roles elevated
      where elevated.user_id = profiles.id
        and elevated.role in ('scorekeeper'::public.user_role, 'moderator'::public.user_role, 'admin'::public.user_role)
    )),
    'scorekeepers', count(*) filter (where exists (
      select 1 from public.user_roles scoped
      where scoped.user_id = profiles.id and scoped.role = 'scorekeeper'::public.user_role
    )),
    'moderators', count(*) filter (where exists (
      select 1 from public.user_roles scoped
      where scoped.user_id = profiles.id and scoped.role = 'moderator'::public.user_role
    )),
    'admins', count(*) filter (where exists (
      select 1 from public.user_roles scoped
      where scoped.user_id = profiles.id and scoped.role = 'admin'::public.user_role
    )),
    'suspended', count(*) filter (where account_status.status = 'suspended')
  ) into result
  from public.profiles profiles
  join public.member_account_status account_status on account_status.user_id = profiles.id;

  return result;
end;
$$;

create or replace function public.admin_list_members(
  member_filter text default 'all',
  search_query text default '',
  page_size integer default 25,
  page_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  username text,
  created_at timestamptz,
  account_status text,
  roles text[],
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_filter text := lower(coalesce(member_filter, 'all'));
  normalized_query text := lower(left(trim(coalesce(search_query, '')), 100));
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  if normalized_filter not in ('all', 'general', 'scorekeepers', 'moderators', 'admins', 'suspended') then
    normalized_filter := 'all';
  end if;

  page_size := greatest(1, least(coalesce(page_size, 25), 100));
  page_offset := greatest(0, coalesce(page_offset, 0));

  return query
  with role_sets as (
    select
      role_rows.user_id,
      array_agg(role_rows.role::text order by role_rows.role::text) as roles
    from public.user_roles role_rows
    group by role_rows.user_id
  ), filtered as (
    select
      profiles.id as user_id,
      auth_users.email::text,
      profiles.display_name,
      profiles.username,
      profiles.created_at,
      account_status.status as account_status,
      coalesce(role_sets.roles, array[]::text[]) as roles
    from public.profiles profiles
    join auth.users auth_users on auth_users.id = profiles.id
    join public.member_account_status account_status on account_status.user_id = profiles.id
    left join role_sets on role_sets.user_id = profiles.id
    where (
      normalized_query = ''
      or lower(coalesce(profiles.display_name, '')) like '%' || normalized_query || '%'
      or lower(coalesce(profiles.username, '')) like '%' || normalized_query || '%'
      or lower(coalesce(auth_users.email, '')) like '%' || normalized_query || '%'
    )
    and case normalized_filter
      when 'general' then not (coalesce(role_sets.roles, array[]::text[]) && array['scorekeeper', 'moderator', 'admin'])
      when 'scorekeepers' then 'scorekeeper' = any(coalesce(role_sets.roles, array[]::text[]))
      when 'moderators' then 'moderator' = any(coalesce(role_sets.roles, array[]::text[]))
      when 'admins' then 'admin' = any(coalesce(role_sets.roles, array[]::text[]))
      when 'suspended' then account_status.status = 'suspended'
      else true
    end
  )
  select
    filtered.user_id,
    filtered.email,
    filtered.display_name,
    filtered.username,
    filtered.created_at,
    filtered.account_status,
    filtered.roles,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.user_id
  limit page_size
  offset page_offset;
end;
$$;

create or replace function public.admin_set_member_suspension(
  target_user_id uuid,
  suspend boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  target_is_admin boolean;
  active_admin_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('varsityvue_admin_member_lifecycle'));

  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  if target_user_id is null then
    raise exception 'Member not found';
  end if;

  if suspend and target_user_id = auth.uid() then
    raise exception 'You cannot suspend your own account';
  end if;

  select status into current_status
  from public.member_account_status
  where user_id = target_user_id
  for update;

  if current_status is null then
    raise exception 'Member not found';
  end if;

  if suspend and current_status = 'suspended' then
    return 'already_suspended';
  elsif not suspend and current_status = 'active' then
    return 'already_active';
  end if;

  select exists (
    select 1 from public.user_roles
    where user_id = target_user_id and role = 'admin'::public.user_role
  ) into target_is_admin;

  if suspend and target_is_admin then
    select count(*) into active_admin_count
    from public.user_roles roles
    join public.member_account_status statuses on statuses.user_id = roles.user_id
    where roles.role = 'admin'::public.user_role
      and statuses.status = 'active';

    if active_admin_count <= 1 then
      raise exception 'The final active administrator cannot be suspended';
    end if;
  end if;

  if suspend then
    update public.member_account_status
    set status = 'suspended',
        suspended_at = now(),
        suspended_by = auth.uid(),
        updated_at = now()
    where user_id = target_user_id;

    insert into public.admin_member_lifecycle_events (
      action, target_user_id, actor_user_id, prior_status, resulting_status
    ) values ('suspend', target_user_id, auth.uid(), current_status, 'suspended');

    return 'suspended';
  end if;

  update public.member_account_status
  set status = 'active',
      suspended_at = null,
      suspended_by = null,
      updated_at = now()
  where user_id = target_user_id;

  insert into public.admin_member_lifecycle_events (
    action, target_user_id, actor_user_id, prior_status, resulting_status
  ) values ('restore', target_user_id, auth.uid(), current_status, 'active');

  return 'restored';
end;
$$;

create or replace function public.admin_permanently_delete_member(
  target_user_id uuid,
  confirmation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
  target_status text;
  target_is_admin boolean;
  active_admin_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('varsityvue_admin_member_lifecycle'));

  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'You cannot permanently delete your own account';
  end if;

  select auth_users.email::text, account_status.status
  into target_email, target_status
  from auth.users auth_users
  join public.member_account_status account_status on account_status.user_id = auth_users.id
  where auth_users.id = target_user_id
  for update of auth_users, account_status;

  if target_email is null or target_status is null then
    raise exception 'Member not found';
  end if;

  if lower(trim(coalesce(confirmation, ''))) <> lower(target_email) then
    raise exception 'Type the member email exactly to confirm permanent deletion';
  end if;

  select exists (
    select 1 from public.user_roles
    where user_id = target_user_id and role = 'admin'::public.user_role
  ) into target_is_admin;

  if target_is_admin and target_status = 'active' then
    select count(*) into active_admin_count
    from public.user_roles roles
    join public.member_account_status statuses on statuses.user_id = roles.user_id
    where roles.role = 'admin'::public.user_role
      and statuses.status = 'active';

    if active_admin_count <= 1 then
      raise exception 'The final active administrator cannot be deleted';
    end if;
  end if;

  insert into public.admin_member_lifecycle_events (
    action, target_user_id, actor_user_id, prior_status, resulting_status
  ) values ('permanent_delete', target_user_id, auth.uid(), target_status, null);

  delete from auth.users where id = target_user_id;

  if not found then
    raise exception 'Member not found';
  end if;
end;
$$;

revoke all on function public.admin_member_view_counts() from public, anon;
revoke all on function public.admin_list_members(text, text, integer, integer) from public, anon;
revoke all on function public.admin_set_member_suspension(uuid, boolean) from public, anon;
revoke all on function public.admin_permanently_delete_member(uuid, text) from public, anon;
grant execute on function public.admin_member_view_counts() to authenticated;
grant execute on function public.admin_list_members(text, text, integer, integer) to authenticated;
grant execute on function public.admin_set_member_suspension(uuid, boolean) to authenticated;
grant execute on function public.admin_permanently_delete_member(uuid, text) to authenticated;

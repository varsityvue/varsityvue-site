-- Durable, idempotent admin alerts for genuinely new auth users.
-- The outbox is private. Its three public RPCs are intentionally callable only
-- by the anon role and require a high-entropy server secret whose SHA-256 hash
-- is stored here. No browser code receives that secret.

create table private.member_notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'failed', 'delivered')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_id text unique,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table private.member_notification_events enable row level security;
revoke all on table private.member_notification_events from public, anon, authenticated;

create index member_notification_events_ready_idx
  on private.member_notification_events (available_at, created_at)
  where status in ('pending', 'failed', 'processing');

create table private.member_notification_worker_config (
  singleton boolean primary key default true check (singleton),
  secret_sha256 text not null check (secret_sha256 ~ '^[0-9a-f]{64}$')
);

alter table private.member_notification_worker_config enable row level security;
revoke all on table private.member_notification_worker_config from public, anon, authenticated;

insert into private.member_notification_worker_config (singleton, secret_sha256)
values (true, '00ddcdb3f77c3ff5691bc2dd14fc3af1ee6dfb2963cd37b07beae854ebda50ec');

create or replace function private.enqueue_member_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.member_notification_events (user_id, email, display_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New member'
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.enqueue_member_notification() from public, anon, authenticated;

create trigger enqueue_member_notification_on_auth_user_created
after insert on auth.users
for each row execute function private.enqueue_member_notification();

create or replace function private.member_notification_worker_authorized(worker_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.member_notification_worker_config
    where singleton
      and secret_sha256 = encode(extensions.digest(worker_secret, 'sha256'), 'hex')
  );
$$;

revoke all on function private.member_notification_worker_authorized(text)
  from public, anon, authenticated;

create or replace function public.claim_member_notification(worker_secret text)
returns table (
  event_id uuid,
  user_id uuid,
  email text,
  display_name text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed private.member_notification_events%rowtype;
begin
  if not private.member_notification_worker_authorized(worker_secret) then
    raise exception 'invalid member notification worker credentials';
  end if;

  select event.*
  into claimed
  from private.member_notification_events event
  where (
      event.status in ('pending', 'failed')
      and event.available_at <= now()
    ) or (
      event.status = 'processing'
      and event.locked_at < now() - interval '10 minutes'
    )
  order by event.created_at
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update private.member_notification_events event
  set status = 'processing',
      attempt_count = event.attempt_count + 1,
      locked_at = now(),
      last_error = null,
      updated_at = now()
  where event.id = claimed.id
  returning event.* into claimed;

  return query
  select claimed.id, claimed.user_id, claimed.email, claimed.display_name,
         claimed.attempt_count;
end;
$$;

create or replace function public.complete_member_notification(
  worker_secret text,
  target_event_id uuid,
  resend_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.member_notification_worker_authorized(worker_secret) then
    raise exception 'invalid member notification worker credentials';
  end if;

  update private.member_notification_events event
  set status = 'delivered',
      provider_message_id = resend_message_id,
      delivered_at = coalesce(event.delivered_at, now()),
      locked_at = null,
      last_error = null,
      updated_at = now()
  where event.id = target_event_id
    and event.status in ('processing', 'delivered')
    and (event.provider_message_id is null or event.provider_message_id = resend_message_id);

  return found;
end;
$$;

create or replace function public.fail_member_notification(
  worker_secret text,
  target_event_id uuid,
  failure_detail text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.member_notification_worker_authorized(worker_secret) then
    raise exception 'invalid member notification worker credentials';
  end if;

  update private.member_notification_events event
  set status = 'failed',
      available_at = now() + make_interval(
        secs => least(3600, 30 * (2 ^ least(event.attempt_count, 7))::integer)
      ),
      locked_at = null,
      last_error = left(failure_detail, 2000),
      updated_at = now()
  where event.id = target_event_id
    and event.status = 'processing';

  return found;
end;
$$;

revoke all on function public.claim_member_notification(text)
  from public, authenticated, service_role;
revoke all on function public.complete_member_notification(text, uuid, text)
  from public, authenticated, service_role;
revoke all on function public.fail_member_notification(text, uuid, text)
  from public, authenticated, service_role;

grant execute on function public.claim_member_notification(text) to anon;
grant execute on function public.complete_member_notification(text, uuid, text) to anon;
grant execute on function public.fail_member_notification(text, uuid, text) to anon;

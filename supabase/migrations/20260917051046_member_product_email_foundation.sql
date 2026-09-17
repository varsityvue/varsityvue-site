-- Growth Phase 1, Phase 6: durable member product-email foundation.
--
-- This subsystem is intentionally separate from private.member_notification_events,
-- which remains the internal owner-alert outbox. No game or article trigger is
-- installed here. Only an active administrator can create a controlled test event.

create table private.product_notification_events (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('final_score', 'new_coverage')),
  source_key text not null,
  relevant_school_slugs text[] not null,
  occurred_at timestamptz not null,
  content_snapshot jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'materialized', 'no_recipients')),
  test_only boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_notification_events_source_key_shape check (
    char_length(source_key) between 1 and 300
  ),
  constraint product_notification_events_school_count check (
    cardinality(relevant_school_slugs) between 1 and 20
  ),
  constraint product_notification_events_snapshot_object check (
    jsonb_typeof(content_snapshot) = 'object'
  ),
  unique (category, source_key)
);

create table private.product_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references private.product_notification_events(id) on delete restrict,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  category text not null check (category in ('final_score', 'new_coverage')),
  channel text not null default 'email' check (channel = 'email'),
  status text not null default 'pending' check (
    status in (
      'pending',
      'processing',
      'retryable',
      'provider_accepted',
      'delivered',
      'cancelled',
      'terminal_failed',
      'bounced',
      'complained',
      'suppressed'
    )
  ),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  claimed_at timestamptz,
  claim_token uuid,
  provider_message_id text unique,
  provider_accepted_at timestamptz,
  provider_sent_at timestamptz,
  provider_delivered_at timestamptz,
  provider_delayed_at timestamptz,
  provider_bounced_at timestamptz,
  provider_complained_at timestamptz,
  provider_failed_at timestamptz,
  cancelled_at timestamptz,
  last_error text,
  last_provider_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_email_deliveries_recipient_shape check (
    recipient_user_id is not null or recipient_email is null
  ),
  unique (event_id, recipient_user_id, channel)
);

create table private.product_email_suppressions (
  email_sha256 text primary key check (email_sha256 ~ '^[0-9a-f]{64}$'),
  reason text not null check (reason in ('hard_bounce', 'complaint', 'provider_suppressed')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.product_email_webhook_events (
  svix_id text primary key,
  event_type text not null,
  provider_message_id text,
  provider_occurred_at timestamptz,
  detail text,
  received_at timestamptz not null default now()
);

create table private.product_email_worker_config (
  singleton boolean primary key default true check (singleton),
  secret_sha256 text not null check (secret_sha256 ~ '^[0-9a-f]{64}$'),
  max_provider_acceptances_per_24h integer not null default 80
    check (max_provider_acceptances_per_24h between 1 and 100)
);

insert into private.product_email_worker_config (
  singleton,
  secret_sha256,
  max_provider_acceptances_per_24h
) values (
  true,
  'b9ac5d72615a0c2032f44a1e780b8109b53979d3f0d38bf89950cdae6003cb08',
  80
);

alter table private.product_notification_events enable row level security;
alter table private.product_email_deliveries enable row level security;
alter table private.product_email_suppressions enable row level security;
alter table private.product_email_webhook_events enable row level security;
alter table private.product_email_worker_config enable row level security;

revoke all on table private.product_notification_events from public, anon, authenticated;
revoke all on table private.product_email_deliveries from public, anon, authenticated;
revoke all on table private.product_email_suppressions from public, anon, authenticated;
revoke all on table private.product_email_webhook_events from public, anon, authenticated;
revoke all on table private.product_email_worker_config from public, anon, authenticated;

create index product_email_deliveries_ready_idx
  on private.product_email_deliveries (next_attempt_at, created_at)
  where status in ('pending', 'retryable', 'processing');

create index product_email_deliveries_event_idx
  on private.product_email_deliveries (event_id, created_at);

create index product_email_deliveries_status_idx
  on private.product_email_deliveries (status, updated_at desc);

create index product_notification_events_status_idx
  on private.product_notification_events (status, created_at);

create or replace function private.product_email_worker_authorized(worker_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.product_email_worker_config
    where singleton
      and secret_sha256 = encode(extensions.digest(worker_secret, 'sha256'), 'hex')
  );
$$;

create or replace function private.valid_product_school_slugs(school_slugs text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    cardinality(school_slugs) between 1 and 20
    and not exists (
      select 1
      from unnest(school_slugs) school_slug
      where char_length(school_slug) not between 1 and 100
        or school_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    )
    and cardinality(school_slugs) = (
      select count(distinct school_slug)::integer
      from unnest(school_slugs) school_slug
    );
$$;

create or replace function private.materialize_product_notification_event(
  target_event_id uuid,
  target_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event private.product_notification_events%rowtype;
  inserted_count integer;
begin
  select event.*
  into target_event
  from private.product_notification_events event
  where event.id = target_event_id
  for update;

  if target_event.id is null then
    raise exception 'Product notification event not found';
  end if;

  if target_event.status <> 'pending' then
    select count(*)::integer into inserted_count
    from private.product_email_deliveries delivery
    where delivery.event_id = target_event.id;
    return inserted_count;
  end if;

  insert into private.product_email_deliveries (
    event_id,
    recipient_user_id,
    recipient_email,
    category
  )
  select distinct
    target_event.id,
    auth_user.id,
    lower(btrim(auth_user.email)),
    target_event.category
  from auth.users auth_user
  join public.member_account_status account_status
    on account_status.user_id = auth_user.id
   and account_status.status = 'active'
  join public.member_notification_preferences preferences
    on preferences.user_id = auth_user.id
  where (target_user_id is null or auth_user.id = target_user_id)
    and auth_user.email is not null
    and auth_user.email_confirmed_at is not null
    and char_length(btrim(auth_user.email)) between 3 and 320
    and btrim(auth_user.email) like '%@%'
    and case target_event.category
      when 'final_score' then preferences.final_score_email
      when 'new_coverage' then preferences.new_coverage_email
      else false
    end
    and exists (
      select 1
      from public.school_follows follow
      where follow.user_id = auth_user.id
        and follow.school_slug = any(target_event.relevant_school_slugs)
    )
    and not exists (
      select 1
      from private.product_email_suppressions suppression
      where suppression.email_sha256 = encode(
        extensions.digest(lower(btrim(auth_user.email)), 'sha256'),
        'hex'
      )
    )
  on conflict (event_id, recipient_user_id, channel) do nothing;

  get diagnostics inserted_count = row_count;

  update private.product_notification_events
  set status = case when inserted_count = 0 then 'no_recipients' else 'materialized' end,
      updated_at = now()
  where id = target_event.id;

  return inserted_count;
end;
$$;

create or replace function public.admin_create_product_email_test_event(
  event_category text,
  school_slug text,
  headline text,
  body_text text,
  cta_path text
)
returns table (event_id uuid, delivery_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_event_id uuid;
  new_delivery_count integer;
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  if event_category not in ('final_score', 'new_coverage') then
    raise exception 'Unsupported product email category';
  end if;

  if not private.valid_product_school_slugs(array[school_slug]) then
    raise exception 'Invalid school slug';
  end if;

  if char_length(btrim(headline)) not between 1 and 120
     or char_length(btrim(body_text)) not between 1 and 600 then
    raise exception 'Test email content is invalid';
  end if;

  if char_length(cta_path) not between 1 and 300
     or left(cta_path, 1) <> '/'
     or left(cta_path, 2) = '//'
     or cta_path ~ '[[:cntrl:]]' then
    raise exception 'Test email CTA must be a local VarsityVue path';
  end if;

  insert into private.product_notification_events (
    category,
    source_key,
    relevant_school_slugs,
    occurred_at,
    content_snapshot,
    test_only,
    created_by
  ) values (
    event_category,
    'controlled-test:' || gen_random_uuid()::text,
    array[school_slug],
    now(),
    jsonb_build_object(
      'headline', btrim(headline),
      'body', btrim(body_text),
      'cta_path', cta_path,
      'school_slug', school_slug,
      'controlled_test', true
    ),
    true,
    auth.uid()
  ) returning id into new_event_id;

  new_delivery_count := private.materialize_product_notification_event(
    new_event_id,
    auth.uid()
  );

  return query select new_event_id, new_delivery_count;
end;
$$;

create or replace function public.claim_product_email_delivery(worker_secret text)
returns table (
  delivery_id uuid,
  claim_token uuid,
  event_id uuid,
  category text,
  recipient_user_id uuid,
  recipient_email text,
  attempt_count integer,
  relevant_school_slugs text[],
  content_snapshot jsonb,
  occurred_at timestamptz,
  test_only boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate private.product_email_deliveries%rowtype;
  event_row private.product_notification_events%rowtype;
  current_email text;
  eligible boolean;
  acceptance_count integer;
  acceptance_limit integer;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  select config.max_provider_acceptances_per_24h into acceptance_limit
  from private.product_email_worker_config config
  where config.singleton;

  select count(*)::integer into acceptance_count
  from private.product_email_deliveries delivery
  where delivery.provider_accepted_at >= now() - interval '24 hours';

  if acceptance_count >= acceptance_limit then
    return;
  end if;

  loop
    select delivery.*
    into candidate
    from private.product_email_deliveries delivery
    where (
        delivery.status in ('pending', 'retryable')
        and delivery.next_attempt_at <= now()
      ) or (
        delivery.status = 'processing'
        and delivery.claimed_at < now() - interval '10 minutes'
      )
    order by delivery.created_at, delivery.id
    for update skip locked
    limit 1;

    if candidate.id is null then
      return;
    end if;

    -- Resend retains idempotency keys for 24 hours. If a provider request may
    -- have succeeded but our acceptance write was lost, do not resend after
    -- that window and risk a duplicate. Preserve it for manual reconciliation.
    if candidate.status = 'processing'
       and candidate.first_attempt_at is not null
       and candidate.first_attempt_at < now() - interval '23 hours' then
      update private.product_email_deliveries delivery
      set status = 'terminal_failed',
          claimed_at = null,
          claim_token = null,
          last_error = 'Ambiguous provider acceptance exceeded the safe idempotency retry window',
          updated_at = now()
      where delivery.id = candidate.id;
      candidate := null;
      continue;
    end if;

    select event.* into event_row
    from private.product_notification_events event
    where event.id = candidate.event_id;

    select lower(btrim(auth_user.email)) into current_email
    from auth.users auth_user
    where auth_user.id = candidate.recipient_user_id
      and auth_user.email is not null
      and auth_user.email_confirmed_at is not null;

    select
      candidate.recipient_user_id is not null
      and current_email is not null
      and exists (
        select 1
        from public.member_account_status account_status
        where account_status.user_id = candidate.recipient_user_id
          and account_status.status = 'active'
      )
      and exists (
        select 1
        from public.member_notification_preferences preferences
        where preferences.user_id = candidate.recipient_user_id
          and case candidate.category
            when 'final_score' then preferences.final_score_email
            when 'new_coverage' then preferences.new_coverage_email
            else false
          end
      )
      and exists (
        select 1
        from public.school_follows follow
        where follow.user_id = candidate.recipient_user_id
          and follow.school_slug = any(event_row.relevant_school_slugs)
      )
      and not exists (
        select 1
        from private.product_email_suppressions suppression
        where suppression.email_sha256 = encode(
          extensions.digest(current_email, 'sha256'),
          'hex'
        )
      )
    into eligible;

    if not coalesce(eligible, false) then
      update private.product_email_deliveries delivery
      set status = 'cancelled',
          cancelled_at = now(),
          claimed_at = null,
          claim_token = null,
          recipient_email = case
            when candidate.recipient_user_id is null then null
            else delivery.recipient_email
          end,
          last_error = 'Recipient no longer eligible before provider send',
          updated_at = now()
      where delivery.id = candidate.id;
      candidate := null;
      continue;
    end if;

    candidate.claim_token := gen_random_uuid();

    update private.product_email_deliveries delivery
    set status = 'processing',
        recipient_email = current_email,
        attempt_count = delivery.attempt_count + 1,
        first_attempt_at = coalesce(delivery.first_attempt_at, now()),
        claimed_at = now(),
        claim_token = candidate.claim_token,
        last_error = null,
        updated_at = now()
    where delivery.id = candidate.id
    returning delivery.* into candidate;

    return query
    select
      candidate.id,
      candidate.claim_token,
      event_row.id,
      candidate.category,
      candidate.recipient_user_id,
      current_email,
      candidate.attempt_count,
      event_row.relevant_school_slugs,
      event_row.content_snapshot,
      event_row.occurred_at,
      event_row.test_only;
    return;
  end loop;
end;
$$;

create or replace function public.accept_product_email_delivery(
  worker_secret text,
  target_delivery_id uuid,
  target_claim_token uuid,
  resend_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  update private.product_email_deliveries delivery
  set status = 'provider_accepted',
      provider_message_id = resend_message_id,
      provider_accepted_at = coalesce(delivery.provider_accepted_at, now()),
      claimed_at = null,
      claim_token = null,
      last_error = null,
      updated_at = now()
  where delivery.id = target_delivery_id
    and delivery.status = 'processing'
    and delivery.claim_token = target_claim_token
    and (delivery.provider_message_id is null or delivery.provider_message_id = resend_message_id);

  return found;
end;
$$;

create or replace function public.fail_product_email_delivery(
  worker_secret text,
  target_delivery_id uuid,
  target_claim_token uuid,
  failure_detail text,
  retryable boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_delivery private.product_email_deliveries%rowtype;
  retry_delay interval;
  next_status text;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  select delivery.* into target_delivery
  from private.product_email_deliveries delivery
  where delivery.id = target_delivery_id
    and delivery.status = 'processing'
    and delivery.claim_token = target_claim_token
  for update;

  if target_delivery.id is null then
    return 'state_changed';
  end if;

  retry_delay := case target_delivery.attempt_count
    when 1 then interval '1 minute'
    when 2 then interval '5 minutes'
    when 3 then interval '15 minutes'
    when 4 then interval '1 hour'
    else interval '4 hours'
  end;

  next_status := case
    when retryable
      and target_delivery.attempt_count < 5
      and now() + retry_delay < target_delivery.first_attempt_at + interval '23 hours'
      then 'retryable'
    else 'terminal_failed'
  end;

  update private.product_email_deliveries delivery
  set status = next_status,
      next_attempt_at = case
        when next_status = 'retryable' then now() + retry_delay
        else delivery.next_attempt_at
      end,
      claimed_at = null,
      claim_token = null,
      last_error = left(coalesce(failure_detail, 'Unknown provider error'), 2000),
      updated_at = now()
  where delivery.id = target_delivery.id;

  return next_status;
end;
$$;

create or replace function public.record_product_email_webhook(
  worker_secret text,
  webhook_id text,
  webhook_event_type text,
  resend_message_id text,
  provider_event_at timestamptz,
  event_detail text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  target_delivery private.product_email_deliveries%rowtype;
  suppression_reason text;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  if webhook_event_type not in (
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.bounced',
    'email.complained',
    'email.failed',
    'email.suppressed'
  ) then
    return false;
  end if;

  insert into private.product_email_webhook_events (
    svix_id,
    event_type,
    provider_message_id,
    provider_occurred_at,
    detail
  ) values (
    left(webhook_id, 300),
    webhook_event_type,
    resend_message_id,
    provider_event_at,
    left(event_detail, 1000)
  ) on conflict (svix_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    return false;
  end if;

  select delivery.* into target_delivery
  from private.product_email_deliveries delivery
  where delivery.provider_message_id = resend_message_id
  for update;

  if target_delivery.id is null then
    return true;
  end if;

  update private.product_email_deliveries delivery
  set status = case webhook_event_type
        when 'email.delivered' then case
          when delivery.status in ('complained', 'bounced', 'suppressed') then delivery.status
          else 'delivered'
        end
        when 'email.bounced' then 'bounced'
        when 'email.complained' then 'complained'
        when 'email.suppressed' then 'suppressed'
        when 'email.failed' then case
          when delivery.status in ('delivered', 'complained', 'bounced', 'suppressed') then delivery.status
          else 'terminal_failed'
        end
        else delivery.status
      end,
      provider_sent_at = case
        when webhook_event_type = 'email.sent' then coalesce(delivery.provider_sent_at, provider_event_at, now())
        else delivery.provider_sent_at
      end,
      provider_delivered_at = case
        when webhook_event_type = 'email.delivered' then coalesce(delivery.provider_delivered_at, provider_event_at, now())
        else delivery.provider_delivered_at
      end,
      provider_delayed_at = case
        when webhook_event_type = 'email.delivery_delayed' then coalesce(provider_event_at, now())
        else delivery.provider_delayed_at
      end,
      provider_bounced_at = case
        when webhook_event_type = 'email.bounced' then coalesce(delivery.provider_bounced_at, provider_event_at, now())
        else delivery.provider_bounced_at
      end,
      provider_complained_at = case
        when webhook_event_type = 'email.complained' then coalesce(delivery.provider_complained_at, provider_event_at, now())
        else delivery.provider_complained_at
      end,
      provider_failed_at = case
        when webhook_event_type in ('email.failed', 'email.suppressed') then coalesce(delivery.provider_failed_at, provider_event_at, now())
        else delivery.provider_failed_at
      end,
      last_error = case
        when webhook_event_type in ('email.bounced', 'email.failed', 'email.suppressed')
          then left(coalesce(event_detail, webhook_event_type), 2000)
        else delivery.last_error
      end,
      last_provider_event = webhook_event_type,
      updated_at = now()
  where delivery.id = target_delivery.id;

  suppression_reason := case webhook_event_type
    when 'email.bounced' then 'hard_bounce'
    when 'email.complained' then 'complaint'
    when 'email.suppressed' then 'provider_suppressed'
    else null
  end;

  if suppression_reason is not null and target_delivery.recipient_email is not null then
    insert into private.product_email_suppressions (
      email_sha256,
      reason,
      provider_message_id
    ) values (
      encode(extensions.digest(lower(btrim(target_delivery.recipient_email)), 'sha256'), 'hex'),
      suppression_reason,
      resend_message_id
    ) on conflict (email_sha256) do update
    set reason = case
          when product_email_suppressions.reason = 'complaint' then product_email_suppressions.reason
          else excluded.reason
        end,
        provider_message_id = excluded.provider_message_id,
        updated_at = now();
  end if;

  return true;
end;
$$;

create or replace function public.unsubscribe_member_product_email(
  worker_secret text,
  target_user_id uuid,
  unsubscribe_category text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_exists boolean;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  if unsubscribe_category not in ('final_score', 'new_coverage', 'all') then
    raise exception 'Unsupported unsubscribe category';
  end if;

  select exists (
    select 1 from auth.users where id = target_user_id
  ) into member_exists;

  if not member_exists then
    return false;
  end if;

  update public.member_notification_preferences preferences
  set final_score_email = case
        when unsubscribe_category in ('final_score', 'all') then false
        else preferences.final_score_email
      end,
      new_coverage_email = case
        when unsubscribe_category in ('new_coverage', 'all') then false
        else preferences.new_coverage_email
      end,
      updated_at = now()
  where preferences.user_id = target_user_id;

  update private.product_email_deliveries delivery
  set status = 'cancelled',
      cancelled_at = now(),
      claimed_at = null,
      claim_token = null,
      last_error = 'Member unsubscribed before provider send',
      updated_at = now()
  where delivery.recipient_user_id = target_user_id
    and delivery.status in ('pending', 'retryable')
    and (unsubscribe_category = 'all' or delivery.category = unsubscribe_category);

  return true;
end;
$$;

create or replace function public.admin_product_email_diagnostics()
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
    'pending', count(*) filter (where status in ('pending', 'retryable')),
    'processing', count(*) filter (where status = 'processing'),
    'provider_accepted', count(*) filter (where status = 'provider_accepted'),
    'delivered', count(*) filter (where status = 'delivered'),
    'failed', count(*) filter (where status in ('terminal_failed', 'bounced', 'complained', 'suppressed')),
    'cancelled', count(*) filter (where status = 'cancelled'),
    'stale_processing', count(*) filter (
      where status = 'processing' and claimed_at < now() - interval '10 minutes'
    )
  ) into result
  from private.product_email_deliveries;

  return result;
end;
$$;

create or replace function private.scrub_deleted_member_product_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.product_email_deliveries delivery
  set recipient_email = null,
      status = case
        when delivery.status in ('pending', 'processing', 'retryable') then 'cancelled'
        else delivery.status
      end,
      cancelled_at = case
        when delivery.status in ('pending', 'processing', 'retryable') then now()
        else delivery.cancelled_at
      end,
      claimed_at = null,
      claim_token = null,
      last_error = case
        when delivery.status in ('pending', 'processing', 'retryable') then 'Member account permanently deleted'
        else delivery.last_error
      end,
      updated_at = now()
  where delivery.recipient_user_id = old.id;

  return old;
end;
$$;

create trigger scrub_product_email_before_auth_user_delete
before delete on auth.users
for each row execute function private.scrub_deleted_member_product_email();

revoke all on function private.product_email_worker_authorized(text)
  from public, anon, authenticated;
revoke all on function private.valid_product_school_slugs(text[])
  from public, anon, authenticated;
revoke all on function private.materialize_product_notification_event(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.scrub_deleted_member_product_email()
  from public, anon, authenticated;

revoke all on function public.admin_create_product_email_test_event(text, text, text, text, text)
  from public, anon;
grant execute on function public.admin_create_product_email_test_event(text, text, text, text, text)
  to authenticated;

revoke all on function public.admin_product_email_diagnostics()
  from public, anon;
grant execute on function public.admin_product_email_diagnostics()
  to authenticated;

revoke all on function public.claim_product_email_delivery(text)
  from public, authenticated, service_role;
revoke all on function public.accept_product_email_delivery(text, uuid, uuid, text)
  from public, authenticated, service_role;
revoke all on function public.fail_product_email_delivery(text, uuid, uuid, text, boolean)
  from public, authenticated, service_role;
revoke all on function public.record_product_email_webhook(text, text, text, text, timestamptz, text)
  from public, authenticated, service_role;
revoke all on function public.unsubscribe_member_product_email(text, uuid, text)
  from public, authenticated, service_role;

grant execute on function public.claim_product_email_delivery(text) to anon;
grant execute on function public.accept_product_email_delivery(text, uuid, uuid, text) to anon;
grant execute on function public.fail_product_email_delivery(text, uuid, uuid, text, boolean) to anon;
grant execute on function public.record_product_email_webhook(text, text, text, text, timestamptz, text) to anon;
grant execute on function public.unsubscribe_member_product_email(text, uuid, text) to anon;

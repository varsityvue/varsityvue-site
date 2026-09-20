-- Opt-in Pick 'Em reminders. The existing product-email cron invokes the
-- scheduler and worker; one delivery per member/week is enforced in storage.

alter table public.member_notification_preferences
  add column if not exists pickem_reminder_email boolean not null default false;

drop function if exists public.set_own_member_notification_preference(text, boolean);

create or replace function public.set_own_member_notification_preference(
  preference_category text,
  enabled boolean
)
returns table (
  final_score_email boolean,
  new_coverage_email boolean,
  pickem_reminder_email boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if preference_category not in ('final_score', 'new_coverage', 'pickem_reminder') then
    raise exception 'Unsupported notification preference';
  end if;

  insert into public.member_notification_preferences (
    user_id, final_score_email, new_coverage_email, pickem_reminder_email
  ) values (
    current_user_id,
    preference_category = 'final_score' and enabled,
    preference_category = 'new_coverage' and enabled,
    preference_category = 'pickem_reminder' and enabled
  )
  on conflict (user_id) do update
  set final_score_email = case when preference_category = 'final_score' then enabled else member_notification_preferences.final_score_email end,
      new_coverage_email = case when preference_category = 'new_coverage' then enabled else member_notification_preferences.new_coverage_email end,
      pickem_reminder_email = case when preference_category = 'pickem_reminder' then enabled else member_notification_preferences.pickem_reminder_email end,
      updated_at = now();

  return query
  select preferences.final_score_email, preferences.new_coverage_email, preferences.pickem_reminder_email
  from public.member_notification_preferences preferences
  where preferences.user_id = current_user_id;
end;
$$;

revoke all on function public.set_own_member_notification_preference(text, boolean)
  from public, anon;
grant execute on function public.set_own_member_notification_preference(text, boolean)
  to authenticated;

create table if not exists private.pickem_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'retryable', 'provider_accepted', 'cancelled', 'terminal_failed'
  )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  claimed_at timestamptz,
  claim_token uuid,
  provider_message_id text unique,
  provider_accepted_at timestamptz,
  cancelled_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, recipient_user_id)
);

alter table private.pickem_reminder_deliveries enable row level security;
revoke all on table private.pickem_reminder_deliveries from public, anon, authenticated;

create index if not exists pickem_reminder_deliveries_ready_idx
  on private.pickem_reminder_deliveries (next_attempt_at, created_at)
  where status in ('pending', 'retryable', 'processing');

create or replace function public.enqueue_pickem_email_reminders(worker_secret text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  -- Friday-morning behavior in Texas: do not enqueue overnight. A week becomes
  -- eligible when its next unlocked kickoff is 1-12 hours away.
  if extract(hour from now() at time zone 'America/Chicago') < 8 then return 0; end if;

  insert into private.pickem_reminder_deliveries (week_id, recipient_user_id, recipient_email)
  select week.id, auth_user.id, lower(btrim(auth_user.email))
  from public.pickem_weeks week
  join auth.users auth_user on auth_user.email is not null and auth_user.email_confirmed_at is not null
  join public.member_account_status account_status
    on account_status.user_id = auth_user.id and account_status.status = 'active'
  join public.member_notification_preferences preferences
    on preferences.user_id = auth_user.id and preferences.pickem_reminder_email
  where week.status = 'open'
    and exists (
      select 1 from public.pickem_games game
      where game.week_id = week.id
        and game.lock_at > now() + interval '1 hour'
        and game.lock_at <= now() + interval '12 hours'
    )
    and (
      select count(*) from public.pickem_games game where game.week_id = week.id
    ) > (
      select count(*) from public.pickem_picks pick
      join public.pickem_games game on game.id = pick.pickem_game_id
      where game.week_id = week.id and pick.user_id = auth_user.id
    )
    and not exists (
      select 1 from private.product_email_suppressions suppression
      where suppression.email_sha256 = encode(extensions.digest(lower(btrim(auth_user.email)), 'sha256'), 'hex')
    )
  on conflict (week_id, recipient_user_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.claim_pickem_email_reminder(worker_secret text)
returns table (
  delivery_id uuid,
  claim_token uuid,
  recipient_user_id uuid,
  recipient_email text,
  season integer,
  week_number integer,
  week_title text,
  lock_at timestamptz,
  picked_count integer,
  game_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate private.pickem_reminder_deliveries%rowtype;
  new_claim_token uuid;
  eligible boolean;
  accepted_count integer;
  acceptance_limit integer;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  select config.max_provider_acceptances_per_24h into acceptance_limit
  from private.product_email_worker_config config where config.singleton;

  select
    (select count(*) from private.product_email_deliveries where provider_accepted_at >= now() - interval '24 hours')
    + (select count(*) from private.pickem_reminder_deliveries where provider_accepted_at >= now() - interval '24 hours')
  into accepted_count;
  if accepted_count >= acceptance_limit then return; end if;

  loop
    select delivery.* into candidate
    from private.pickem_reminder_deliveries delivery
    where (delivery.status in ('pending', 'retryable') and delivery.next_attempt_at <= now())
       or (delivery.status = 'processing' and delivery.claimed_at < now() - interval '10 minutes')
    order by delivery.created_at, delivery.id
    for update skip locked limit 1;
    if candidate.id is null then return; end if;

    select exists (
      select 1
      from auth.users auth_user
      join public.member_account_status account_status on account_status.user_id = auth_user.id and account_status.status = 'active'
      join public.member_notification_preferences preferences on preferences.user_id = auth_user.id and preferences.pickem_reminder_email
      join public.pickem_weeks week on week.id = candidate.week_id and week.status = 'open'
      where auth_user.id = candidate.recipient_user_id
        and lower(btrim(auth_user.email)) = candidate.recipient_email
        and auth_user.email_confirmed_at is not null
        and (select count(*) from public.pickem_games game where game.week_id = week.id)
          > (select count(*) from public.pickem_picks pick join public.pickem_games game on game.id = pick.pickem_game_id where game.week_id = week.id and pick.user_id = auth_user.id)
        and not exists (
          select 1 from private.product_email_suppressions suppression
          where suppression.email_sha256 = encode(extensions.digest(candidate.recipient_email, 'sha256'), 'hex')
        )
    ) into eligible;

    if not eligible then
      update private.pickem_reminder_deliveries set status = 'cancelled', cancelled_at = now(), claimed_at = null, claim_token = null,
        last_error = 'Member or slate no longer eligible', updated_at = now() where id = candidate.id;
      candidate := null;
      continue;
    end if;

    new_claim_token := gen_random_uuid();
    update private.pickem_reminder_deliveries
    set status = 'processing', claim_token = new_claim_token, claimed_at = now(),
        first_attempt_at = coalesce(first_attempt_at, now()), attempt_count = attempt_count + 1, updated_at = now()
    where id = candidate.id;

    return query
    select candidate.id, new_claim_token, candidate.recipient_user_id, candidate.recipient_email,
      week.season, week.week, week.title, min(game.lock_at),
      (select count(*)::integer from public.pickem_picks pick join public.pickem_games picked_game on picked_game.id = pick.pickem_game_id where picked_game.week_id = week.id and pick.user_id = candidate.recipient_user_id),
      count(game.id)::integer
    from public.pickem_weeks week join public.pickem_games game on game.week_id = week.id
    where week.id = candidate.week_id group by week.id;
    return;
  end loop;
end;
$$;

create or replace function public.accept_pickem_email_reminder(worker_secret text, target_delivery_id uuid, target_claim_token uuid, resend_message_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  update private.pickem_reminder_deliveries set status = 'provider_accepted', provider_message_id = resend_message_id,
    provider_accepted_at = now(), claimed_at = null, claim_token = null, updated_at = now()
  where id = target_delivery_id and status = 'processing' and claim_token = target_claim_token;
  return found;
end;
$$;

create or replace function public.fail_pickem_email_reminder(worker_secret text, target_delivery_id uuid, target_claim_token uuid, failure_detail text, retryable boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare new_status text;
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  select case when retryable and attempt_count < 5 then 'retryable' else 'terminal_failed' end into new_status
  from private.pickem_reminder_deliveries where id = target_delivery_id and status = 'processing' and claim_token = target_claim_token;
  if new_status is null then return null; end if;
  update private.pickem_reminder_deliveries set status = new_status, next_attempt_at = case when new_status = 'retryable' then now() + interval '15 minutes' else next_attempt_at end,
    last_error = left(failure_detail, 1000), claimed_at = null, claim_token = null, updated_at = now() where id = target_delivery_id;
  return new_status;
end;
$$;

create or replace function public.unsubscribe_member_product_email(worker_secret text, target_user_id uuid, unsubscribe_category text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid product email worker credentials'; end if;
  if unsubscribe_category not in ('final_score', 'new_coverage', 'pickem_reminder', 'all') then raise exception 'Unsupported unsubscribe category'; end if;
  if not exists (select 1 from auth.users where id = target_user_id) then return false; end if;

  update public.member_notification_preferences preferences
  set final_score_email = case when unsubscribe_category in ('final_score', 'all') then false else preferences.final_score_email end,
      new_coverage_email = case when unsubscribe_category in ('new_coverage', 'all') then false else preferences.new_coverage_email end,
      pickem_reminder_email = case when unsubscribe_category in ('pickem_reminder', 'all') then false else preferences.pickem_reminder_email end,
      updated_at = now() where preferences.user_id = target_user_id;

  update private.product_email_deliveries set status = 'cancelled', cancelled_at = now(), claimed_at = null, claim_token = null,
    last_error = 'Member unsubscribed before provider send', updated_at = now()
  where recipient_user_id = target_user_id and status in ('pending', 'retryable')
    and (unsubscribe_category = 'all' or category = unsubscribe_category);
  update private.pickem_reminder_deliveries set status = 'cancelled', cancelled_at = now(), claimed_at = null, claim_token = null,
    last_error = 'Member unsubscribed before provider send', updated_at = now()
  where recipient_user_id = target_user_id and status in ('pending', 'retryable') and unsubscribe_category in ('pickem_reminder', 'all');
  return true;
end;
$$;

revoke all on function public.enqueue_pickem_email_reminders(text) from public, anon, authenticated;
revoke all on function public.claim_pickem_email_reminder(text) from public, anon, authenticated;
revoke all on function public.accept_pickem_email_reminder(text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.fail_pickem_email_reminder(text, uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.enqueue_pickem_email_reminders(text) to anon, authenticated;
grant execute on function public.claim_pickem_email_reminder(text) to anon, authenticated;
grant execute on function public.accept_pickem_email_reminder(text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.fail_pickem_email_reminder(text, uuid, uuid, text, boolean) to anon, authenticated;

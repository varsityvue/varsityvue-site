alter table public.member_notification_preferences
  add column pickem_reminder_email boolean not null default false;

drop function public.set_own_member_notification_preference(text, boolean);

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

create table private.pickem_reminder_deliveries (
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

create index pickem_reminder_deliveries_ready_idx
  on private.pickem_reminder_deliveries (next_attempt_at, created_at)
  where status in ('pending', 'retryable', 'processing');

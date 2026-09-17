-- Explicit member consent for future product-email categories.
-- Absence of a row means every preference is OFF.

create table public.member_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  final_score_email boolean not null default false,
  new_coverage_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_notification_preferences enable row level security;

revoke all on table public.member_notification_preferences from public, anon, authenticated;
grant select, insert, update on table public.member_notification_preferences to authenticated;

create policy "Active members can read own notification preferences"
on public.member_notification_preferences for select
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

create policy "Active members can create own notification preferences"
on public.member_notification_preferences for insert
to authenticated
with check (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

create policy "Active members can update own notification preferences"
on public.member_notification_preferences for update
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
)
with check (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

create or replace function public.set_own_member_notification_preference(
  preference_category text,
  enabled boolean
)
returns table (
  final_score_email boolean,
  new_coverage_email boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if preference_category not in ('final_score', 'new_coverage') then
    raise exception 'Unsupported notification preference';
  end if;

  insert into public.member_notification_preferences (
    user_id,
    final_score_email,
    new_coverage_email
  ) values (
    current_user_id,
    case when preference_category = 'final_score' then enabled else false end,
    case when preference_category = 'new_coverage' then enabled else false end
  )
  on conflict (user_id) do update
  set final_score_email = case
        when preference_category = 'final_score' then enabled
        else member_notification_preferences.final_score_email
      end,
      new_coverage_email = case
        when preference_category = 'new_coverage' then enabled
        else member_notification_preferences.new_coverage_email
      end,
      updated_at = now();

  return query
  select preferences.final_score_email, preferences.new_coverage_email
  from public.member_notification_preferences preferences
  where preferences.user_id = current_user_id;
end;
$$;

revoke all on function public.set_own_member_notification_preference(text, boolean)
  from public, anon;
grant execute on function public.set_own_member_notification_preference(text, boolean)
  to authenticated;

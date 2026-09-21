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

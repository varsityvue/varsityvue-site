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

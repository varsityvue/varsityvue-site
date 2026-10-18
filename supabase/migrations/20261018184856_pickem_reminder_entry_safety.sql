begin;
-- Saved choices are never an acceptance receipt. Keep private progress private.
create or replace function private.pickem_reminder_progress(target_week uuid, target_user uuid)
returns table (entry_state text, picked_count integer, game_count integer)
language sql volatile security definer set search_path = '' as $$
  with required as (
    select g.* from public.pickem_games g where g.week_id=target_week
      and not exists (select 1 from private.pickem_contest_game_resolution r
        where r.pickem_game_id=g.id and r.disposition='void')
  ), counts as (
    select count(*)::integer total, count(*) filter (where exists (
      select 1 from private.pickem_draft_picks p where p.week_id=target_week
        and p.user_id=target_user and p.pickem_game_id=g.id
        and p.picked_school_slug in (g.home_school_slug,g.away_school_slug)
      union all
      select 1 from public.pickem_picks p where p.user_id=target_user
        and p.pickem_game_id=g.id and p.picked_school_slug in (g.home_school_slug,g.away_school_slug)
    ))::integer picked from required g
  )
  select case
    when exists (select 1 from public.pickem_contest_entries e where e.week_id=target_week
      and e.user_id=target_user and e.status='valid') then 'accepted'
    when exists (select 1 from public.pickem_contest_entries e where e.week_id=target_week
      and e.user_id=target_user) then 'disqualified'
    when not exists (select 1 from public.member_account_status a where a.user_id=target_user and a.status='active')
      or exists (select 1 from public.user_roles r where r.user_id=target_user and r.role in ('admin','moderator')) then 'ineligible'
    when not exists (select 1 from public.pickem_weeks w where w.id=target_week and w.status='open'
      and w.opens_at <= clock_timestamp() and w.closes_at > clock_timestamp()
      and w.entry_deadline_at > clock_timestamp() and w.tiebreaker_game_id is not null
      and exists (select 1 from public.pickem_games g where g.id=w.tiebreaker_game_id and g.week_id=w.id)
      and (w.season>2026 or (w.season=2026 and w.week>=6))) or total=0 then 'closed'
    when picked=0 then 'none'
    when picked<total then 'partial'
    else 'complete_draft' end, picked,total from counts;
$$;
revoke all on function private.pickem_reminder_progress(uuid,uuid) from public,anon,authenticated;

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

  -- Preserve Texas daytime restriction and 1–12 hour window, using the frozen deadline.
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
    and week.entry_deadline_at > clock_timestamp() + interval '1 hour'
    and week.entry_deadline_at <= clock_timestamp() + interval '12 hours'
    and exists (select 1 from private.pickem_reminder_progress(week.id,auth_user.id) p
      where p.entry_state in ('none','partial','complete_draft'))
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
        and week.entry_deadline_at > clock_timestamp()
        and exists (select 1 from private.pickem_reminder_progress(week.id,auth_user.id) p
          where p.entry_state in ('none','partial','complete_draft'))
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
    select candidate.id,new_claim_token,candidate.recipient_user_id,candidate.recipient_email,
      week.season,week.week,week.title,week.entry_deadline_at,p.picked_count,p.game_count
    from public.pickem_weeks week
    cross join lateral private.pickem_reminder_progress(week.id,candidate.recipient_user_id) p
    where week.id=candidate.week_id and week.entry_deadline_at > clock_timestamp()
      and p.entry_state in ('none','partial','complete_draft');
    if found then return; end if;
    update private.pickem_reminder_deliveries set status='cancelled',cancelled_at=clock_timestamp(),
      claimed_at=null,claim_token=null,last_error='Entry reminder no longer eligible',updated_at=clock_timestamp()
      where id=candidate.id;
    candidate := null;
  end loop;
end;
$$;

-- Recheck immediately before provider dispatch: queued/claimed work is not consent.
create or replace function public.authorize_pickem_email_reminder_send(
  worker_secret text,target_delivery_id uuid,target_claim_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare eligible boolean;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;
  select exists (
    select 1 from private.pickem_reminder_deliveries d
    join auth.users u on u.id=d.recipient_user_id
    join public.member_notification_preferences pref on pref.user_id=u.id and pref.pickem_reminder_email
    join public.pickem_weeks w on w.id=d.week_id
    cross join lateral private.pickem_reminder_progress(w.id,u.id) p
    where d.id=target_delivery_id and d.claim_token=target_claim_token and d.status='processing'
      and d.claimed_at > clock_timestamp()-interval '10 minutes'
      and u.email_confirmed_at is not null and lower(btrim(u.email))=d.recipient_email
      and w.entry_deadline_at > clock_timestamp()
      and p.entry_state in ('none','partial','complete_draft')
      and not exists (select 1 from private.product_email_suppressions s
        where s.email_sha256=encode(extensions.digest(d.recipient_email,'sha256'),'hex'))
  ) into eligible;
  if not eligible then
    update private.pickem_reminder_deliveries set status='cancelled',cancelled_at=clock_timestamp(),
      claimed_at=null,claim_token=null,last_error='Entry reminder no longer eligible',updated_at=clock_timestamp()
      where id=target_delivery_id and claim_token=target_claim_token and status='processing';
  end if;
  return eligible;
end; $$;
revoke all on function public.authorize_pickem_email_reminder_send(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_pickem_email_reminder_send(text,uuid,uuid) to anon,authenticated;
-- Preserve the API-role worker entry points; never inherit default PUBLIC execute.
revoke all on function public.enqueue_pickem_email_reminders(text) from public,anon,authenticated;
revoke all on function public.claim_pickem_email_reminder(text) from public,anon,authenticated;
grant execute on function public.enqueue_pickem_email_reminders(text) to anon,authenticated;
grant execute on function public.claim_pickem_email_reminder(text) to anon,authenticated;
commit;

-- Authoritative, admin-only conversion reporting. Traffic/page-view analytics
-- remain in Vercel; this function reports durable account and Pick 'Em state.

create or replace function public.admin_conversion_dashboard(range_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  bounded_days integer := greatest(7, least(coalesce(range_days, 30), 90));
  result jsonb;
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception 'Admin access required';
  end if;

  with cohort as (
    select
      auth_user.id,
      auth_user.created_at,
      auth_user.email_confirmed_at,
      case
        when auth_user.raw_user_meta_data ->> 'signup_intent' in ('account', 'follow', 'score_report', 'pickem')
          then auth_user.raw_user_meta_data ->> 'signup_intent'
        else 'unknown'
      end as signup_intent,
      case
        when auth_user.raw_user_meta_data ->> 'signup_source' in ('home', 'scoreboard')
          then auth_user.raw_user_meta_data ->> 'signup_source'
        else 'direct_or_other'
      end as signup_source,
      exists (
        select 1 from public.member_account_status account_status
        where account_status.user_id = auth_user.id and account_status.status = 'active'
      ) as is_active,
      exists (
        select 1 from public.pickem_picks pick where pick.user_id = auth_user.id
      ) as has_pick
    from auth.users auth_user
    where auth_user.created_at >= now() - make_interval(days => bounded_days)
  ),
  summary as (
    select jsonb_build_object(
      'total_members', (select count(*) from auth.users),
      'new_accounts', count(*),
      'confirmed_accounts', count(*) filter (where email_confirmed_at is not null),
      'active_accounts', count(*) filter (where is_active),
      'pickem_participants', count(*) filter (where has_pick),
      'complete_slate_members', (
        select count(*) from cohort member
        where exists (
          select 1
          from public.pickem_picks pick
          join public.pickem_games game on game.id = pick.pickem_game_id
          where pick.user_id = member.id
          group by game.week_id
          having count(*) = (select count(*) from public.pickem_games all_game where all_game.week_id = game.week_id)
        )
      )
    ) value from cohort
  ),
  intent_breakdown as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'intent', signup_intent,
      'accounts', accounts,
      'confirmed', confirmed,
      'pickem_participants', participants
    ) order by accounts desc, signup_intent), '[]'::jsonb) value
    from (
      select signup_intent, count(*) accounts,
        count(*) filter (where email_confirmed_at is not null) confirmed,
        count(*) filter (where has_pick) participants
      from cohort group by signup_intent
    ) grouped
  ),
  source_breakdown as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'source', signup_source,
      'accounts', accounts,
      'confirmed', confirmed
    ) order by accounts desc, signup_source), '[]'::jsonb) value
    from (
      select signup_source, count(*) accounts,
        count(*) filter (where email_confirmed_at is not null) confirmed
      from cohort group by signup_source
    ) grouped
  ),
  daily as (
    select jsonb_agg(jsonb_build_object(
      'date', series.day::date,
      'accounts', coalesce(created.accounts, 0)
    ) order by series.day) value
    from generate_series(
      current_date - (bounded_days - 1),
      current_date,
      interval '1 day'
    ) as series(day)
    left join (
      select created_at::date account_day, count(*) accounts from cohort group by created_at::date
    ) created on created.account_day = series.day::date
  ),
  pickem as (
    select jsonb_build_object(
      'participants', count(distinct pick.user_id),
      'saved_picks', count(pick.id),
      'complete_slates', (
        select count(*) from (
          select game.week_id, pick2.user_id
          from public.pickem_picks pick2
          join public.pickem_games game on game.id = pick2.pickem_game_id
          group by game.week_id, pick2.user_id
          having count(*) = (select count(*) from public.pickem_games all_game where all_game.week_id = game.week_id)
        ) completed
      )
    ) value from public.pickem_picks pick
  )
  select jsonb_build_object(
    'generated_at', now(),
    'range_days', bounded_days,
    'summary', summary.value,
    'intent_breakdown', intent_breakdown.value,
    'source_breakdown', source_breakdown.value,
    'daily_accounts', daily.value,
    'pickem', pickem.value
  ) into result
  from summary, intent_breakdown, source_breakdown, daily, pickem;

  return result;
end;
$$;

revoke all on function public.admin_conversion_dashboard(integer) from public, anon;
grant execute on function public.admin_conversion_dashboard(integer) to authenticated;

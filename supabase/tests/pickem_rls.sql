-- Pick ownership/privacy regression test. All fixtures are rolled back.

begin;

create temporary table pickem_audit_ids (
  key text primary key,
  value uuid not null
) on commit drop;

insert into pickem_audit_ids
select 'member_a', user_id
from public.member_account_status
where status = 'active'
order by user_id
limit 1;

insert into pickem_audit_ids
select 'member_b', user_id
from public.member_account_status
where status = 'active'
  and user_id <> (select value from pickem_audit_ids where key = 'member_a')
order by user_id
limit 1;

with inserted as (
  insert into public.pickem_weeks (season, week, title, status)
  values (2094, 1, '__pickem_rls_audit__', 'open')
  returning id
)
insert into pickem_audit_ids select 'week', id from inserted;

with inserted as (
  insert into public.pickem_games (
    week_id, game_id, lock_at, away_school_slug, home_school_slug
  ) values (
    (select value from pickem_audit_ids where key = 'week'),
    '__pickem_rls_audit_game__',
    now() + interval '1 hour',
    'rls-away',
    'rls-home'
  ) returning id
)
insert into pickem_audit_ids select 'game', id from inserted;

insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
values
  ((select value from pickem_audit_ids where key = 'game'), (select value from pickem_audit_ids where key = 'member_a'), 'rls-away'),
  ((select value from pickem_audit_ids where key = 'game'), (select value from pickem_audit_ids where key = 'member_b'), 'rls-home');

grant select on pickem_audit_ids to authenticated, anon;
select set_config(
  'request.jwt.claim.sub',
  (select value::text from pickem_audit_ids where key = 'member_a'),
  true
);

set local role authenticated;

do $audit$
declare
  visible_rows integer;
  changed_rows integer;
  blocked boolean := false;
begin
  select count(*) into visible_rows
  from public.pickem_picks
  where pickem_game_id = (select value from pickem_audit_ids where key = 'game');
  if visible_rows <> 1 then raise exception 'Cross-member pick read leaked'; end if;

  update public.pickem_picks set picked_school_slug = 'rls-away'
  where pickem_game_id = (select value from pickem_audit_ids where key = 'game')
    and user_id = (select value from pickem_audit_ids where key = 'member_b');
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'Cross-member pick update succeeded'; end if;

  begin
    insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
    values (
      (select value from pickem_audit_ids where key = 'game'),
      (select value from pickem_audit_ids where key = 'member_b'),
      'rls-away'
    )
    on conflict (pickem_game_id, user_id) do update
    set picked_school_slug = excluded.picked_school_slug;
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'Cross-member pick upsert succeeded'; end if;
end
$audit$;

reset role;
set local role anon;

do $audit$
declare visible_rows integer;
begin
  select count(*) into visible_rows
  from public.pickem_picks
  where pickem_game_id = (select value from pickem_audit_ids where key = 'game');
  if visible_rows <> 0 then raise exception 'Guest pick read leaked'; end if;
end
$audit$;

reset role;
select 'pickem_rls' as suite, true as passed;

rollback;

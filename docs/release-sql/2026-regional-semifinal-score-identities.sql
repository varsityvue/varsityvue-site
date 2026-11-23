-- Score-slot registration for the published 2026 Regional schedules.
-- All prerequisites and collisions are checked in the same transaction as the insert.
begin;
set local lock_timeout = '5s';
create temporary table regional_schedule (
  game_id text primary key, away_slug text not null, home_slug text not null,
  away_parent text not null, home_parent text not null
) on commit drop;
insert into regional_schedule values
  ('2026-regional-semifinal-2a-d1-i-1', 'panhandle', 'ballinger', '2026-area-2a-d1-i-1', '2026-area-2a-d1-i-2'),
  ('2026-regional-semifinal-2a-d1-i-2', 'ozona', 'spearman', '2026-area-2a-d1-i-3', '2026-area-2a-d1-i-4'),
  ('2026-regional-semifinal-2a-d1-ii-1', 'muenster', 'cisco', '2026-area-2a-d1-ii-2', '2026-area-2a-d1-ii-1'),
  ('2026-regional-semifinal-2a-d1-ii-2', 'mason', 'de-leon', '2026-area-2a-d1-ii-3', '2026-area-2a-d1-ii-4'),
  ('2026-regional-semifinal-2a-d1-iii-1', 'cooper', 'price-carlisle', '2026-area-2a-d1-iii-1', '2026-area-2a-d1-iii-2'),
  ('2026-regional-semifinal-2a-d1-iii-2', 'joaquin', 'san-augustine', '2026-area-2a-d1-iii-3', '2026-area-2a-d1-iii-4'),
  ('2026-regional-semifinal-2a-d1-iv-1', 'thorndale', 'ganado', '2026-area-2a-d1-iv-1', '2026-area-2a-d1-iv-2'),
  ('2026-regional-semifinal-2a-d1-iv-2', 'shiner', 'rosebud-lott', '2026-area-2a-d1-iv-3', '2026-area-2a-d1-iv-4'),
  ('2026-regional-semifinal-2a-d2-i-1', 'gruver', 'ropes', '2026-area-2a-d2-i-1', '2026-area-2a-d2-i-2'),
  ('2026-regional-semifinal-2a-d2-i-2', 'roscoe', 'wink', '2026-area-2a-d2-i-3', '2026-area-2a-d2-i-4'),
  ('2026-regional-semifinal-2a-d2-ii-1', 'wellington', 'windthorst', '2026-area-2a-d2-ii-1', '2026-area-2a-d2-ii-2'),
  ('2026-regional-semifinal-2a-d2-ii-2', 'goldthwaite', 'santo', '2026-area-2a-d2-ii-3', '2026-area-2a-d2-ii-4'),
  ('2026-regional-semifinal-2a-d2-iii-1', 'collinsville', 'clarksville', '2026-area-2a-d2-iii-1', '2026-area-2a-d2-iii-2'),
  ('2026-regional-semifinal-2a-d2-iii-2', 'overton', 'lindsay', '2026-area-2a-d2-iii-3', '2026-area-2a-d2-iii-4'),
  ('2026-regional-semifinal-2a-d2-iv-1', 'bremond', 'junction', '2026-area-2a-d2-iv-1', '2026-area-2a-d2-iv-2'),
  ('2026-regional-semifinal-2a-d2-iv-2', 'falls-city', 'la-villa', '2026-area-2a-d2-iv-3', '2026-area-2a-d2-iv-4'),
  ('2026-regional-semifinal-3a-d1-i-1', 'vernon', 'peaster', '2026-area-3a-d1-i-2', '2026-area-3a-d1-i-1'),
  ('2026-regional-semifinal-3a-d1-i-2', 'wall', 'paradise', '2026-area-3a-d1-i-3', '2026-area-3a-d1-i-4'),
  ('2026-regional-semifinal-3a-d1-ii-1', 'whitney', 'gunter', '2026-area-3a-d1-ii-2', '2026-area-3a-d1-ii-1'),
  ('2026-regional-semifinal-3a-d1-ii-2', 'malakoff', 'atlanta', '2026-area-3a-d1-ii-3', '2026-area-3a-d1-ii-4'),
  ('2026-regional-semifinal-3a-d1-iii-1', 'lorena', 'cameron-yoe', '2026-area-3a-d1-iii-1', '2026-area-3a-d1-iii-2'),
  ('2026-regional-semifinal-3a-d1-iii-2', 'columbus', 'franklin', '2026-area-3a-d1-iii-3', '2026-area-3a-d1-iii-4'),
  ('2026-regional-semifinal-3a-d1-iv-1', 'yoakum', 'devine', '2026-area-3a-d1-iv-1', '2026-area-3a-d1-iv-2'),
  ('2026-regional-semifinal-3a-d1-iv-2', 'hallettsville', 'san-diego', '2026-area-3a-d1-iv-3', '2026-area-3a-d1-iv-4'),
  ('2026-regional-semifinal-3a-d2-i-1', 'canadian', 'idalou', '2026-area-3a-d2-i-1', '2026-area-3a-d2-i-2'),
  ('2026-regional-semifinal-3a-d2-i-2', 'slaton', 'jacksboro', '2026-area-3a-d2-i-3', '2026-area-3a-d2-i-4'),
  ('2026-regional-semifinal-3a-d2-ii-1', 'millsap', 'maypearl', '2026-area-3a-d2-ii-1', '2026-area-3a-d2-ii-2'),
  ('2026-regional-semifinal-3a-d2-ii-2', 'bells', 'tolar', '2026-area-3a-d2-ii-3', '2026-area-3a-d2-ii-4'),
  ('2026-regional-semifinal-3a-d2-iii-1', 'jefferson', 'arp', '2026-area-3a-d2-iii-2', '2026-area-3a-d2-iii-1'),
  ('2026-regional-semifinal-3a-d2-iii-2', 'new-london-west-rusk', 'newton', '2026-area-3a-d2-iii-3', '2026-area-3a-d2-iii-4'),
  ('2026-regional-semifinal-3a-d2-iv-1', 'blanco', 'east-bernard', '2026-area-3a-d2-iv-1', '2026-area-3a-d2-iv-2'),
  ('2026-regional-semifinal-3a-d2-iv-2', 'poth', 'boling', '2026-area-3a-d2-iv-3', '2026-area-3a-d2-iv-4'),
  ('2026-regional-semifinal-4a-d1-i-1', 'decatur', 'canyon-randall', '2026-area-4a-d1-i-1', '2026-area-4a-d1-i-2'),
  ('2026-regional-semifinal-4a-d1-i-2', 'springtown', 'canyon', '2026-area-4a-d1-i-3', '2026-area-4a-d1-i-4'),
  ('2026-regional-semifinal-4a-d1-ii-1', 'longview-pine-tree', 'paris', '2026-area-4a-d1-ii-1', '2026-area-4a-d1-ii-2'),
  ('2026-regional-semifinal-4a-d1-ii-2', 'henderson', 'lindale', '2026-area-4a-d1-ii-3', '2026-area-4a-d1-ii-4'),
  ('2026-regional-semifinal-4a-d1-iii-1', 'stafford', 'el-campo', '2026-area-4a-d1-iii-2', '2026-area-4a-d1-iii-1'),
  ('2026-regional-semifinal-4a-d1-iii-2', 'stephenville', 'bay-city', '2026-area-4a-d1-iii-4', '2026-area-4a-d1-iii-3'),
  ('2026-regional-semifinal-4a-d1-iv-1', 'comal-canyon-lake', 'comal-davenport', '2026-area-4a-d1-iv-1', '2026-area-4a-d1-iv-2'),
  ('2026-regional-semifinal-4a-d1-iv-2', 'corpus-christi-calallen', 'la-vernia', '2026-area-4a-d1-iv-3', '2026-area-4a-d1-iv-4'),
  ('2026-regional-semifinal-4a-d2-i-1', 'graham', 'seminole', '2026-area-4a-d2-i-1', '2026-area-4a-d2-i-2'),
  ('2026-regional-semifinal-4a-d2-i-2', 'lubbock-cooper-liberty', 'brock', '2026-area-4a-d2-i-3', '2026-area-4a-d2-i-4'),
  ('2026-regional-semifinal-4a-d2-ii-1', 'carthage', 'van-alstyne', '2026-area-4a-d2-ii-1', '2026-area-4a-d2-ii-2'),
  ('2026-regional-semifinal-4a-d2-ii-2', 'sunnyvale', 'gilmer', '2026-area-4a-d2-ii-3', '2026-area-4a-d2-ii-4'),
  ('2026-regional-semifinal-4a-d2-iii-1', 'la-marque', 'west-orange-stark', '2026-area-4a-d2-iii-1', '2026-area-4a-d2-iii-2'),
  ('2026-regional-semifinal-4a-d2-iii-2', 'madisonville', 'hamshire-fannett', '2026-area-4a-d2-iii-3', '2026-area-4a-d2-iii-4'),
  ('2026-regional-semifinal-4a-d2-iv-1', 'wimberley', 'waco-la-vega', '2026-area-4a-d2-iv-2', '2026-area-4a-d2-iv-1'),
  ('2026-regional-semifinal-4a-d2-iv-2', 'brownwood', 'robinson', '2026-area-4a-d2-iv-3', '2026-area-4a-d2-iv-4');

lock table private.canonical_game_identity in share row exclusive mode;
do $$
declare
  matched integer;
begin
  -- Lock the exact Area rows until commit. A later score correction is a separate transaction.
  perform 1 from public.game_state s
  where s.game_id in (select away_parent from regional_schedule union all select home_parent from regional_schedule)
  for share;
  with required(parent, winner) as (
    select away_parent, away_slug from regional_schedule
    union all select home_parent, home_slug from regional_schedule
  )
  select count(*) into matched from required r
  join public.game_state s on s.game_id = r.parent
  join private.canonical_game_identity c on c.game_id = s.game_id
    and c.home_school_slug = s.home_school_slug and c.away_school_slug = s.away_school_slug
  where s.verified and s.status = 'final' and s.result_type = 'played'
    and s.home_score <> s.away_score
    and r.winner = case when s.home_score > s.away_score then s.home_school_slug else s.away_school_slug end;
  if matched <> 96 then raise exception 'Area winners or score identities changed'; end if;

  if exists (
    select 1 from regional_schedule r join private.canonical_game_identity c on c.game_id = r.game_id
    where (c.away_school_slug, c.home_school_slug) is distinct from (r.away_slug, r.home_slug)
  ) or exists (
    select 1 from regional_schedule r join private.canonical_game_identity c
      on c.game_id like '2026-%' and c.game_id <> r.game_id
      and least(c.away_school_slug,c.home_school_slug) = least(r.away_slug,r.home_slug)
      and greatest(c.away_school_slug,c.home_school_slug) = greatest(r.away_slug,r.home_slug)
  ) then raise exception 'Existing canonical identity conflicts with Regional schedule'; end if;

  if exists (
    select 1 from regional_schedule r
    where not exists (select 1 from private.canonical_game_identity c where c.game_id = r.game_id)
    and (exists (select 1 from public.game_state s where s.game_id = r.game_id)
      or exists (select 1 from public.score_submissions s where s.game_id = r.game_id)
      or exists (select 1 from public.internal_score_submissions s where s.game_id = r.game_id))
  ) then raise exception 'Regional scoring activity predates registration'; end if;

  insert into private.canonical_game_identity (game_id, away_school_slug, home_school_slug)
    select game_id, away_slug, home_slug from regional_schedule
    on conflict (game_id) do nothing;
end $$;
commit;

-- Identity-only. No score, schedule, permission or schema changes.
begin;
create temporary table d3d2_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into d3d2_identities values
('2026-bi-district-3a-d2-i-3','dimmitt','idalou'),
('2026-bi-district-3a-d2-i-4','holliday','coahoma'),
('2026-bi-district-3a-d2-i-5','henrietta','stanton'),
('2026-bi-district-3a-d2-i-8','littlefield','childress'),
('2026-bi-district-3a-d2-ii-2','valley-view','edgewood'),
('2026-bi-district-3a-d2-ii-3','clifton','maypearl'),
('2026-bi-district-3a-d2-ii-4','quitman','howe'),
('2026-bi-district-3a-d2-iii-1','arp','hooks'),
('2026-bi-district-3a-d2-iii-2','buffalo','new-waverly'),
('2026-bi-district-3a-d2-iii-3','redwater','jefferson'),
('2026-bi-district-3a-d2-iii-4','hardin','teague'),
('2026-bi-district-3a-d2-iii-5','woodville','mildred'),
('2026-bi-district-3a-d2-iii-6','new-boston','new-london-west-rusk'),
('2026-bi-district-3a-d2-iii-7','elkhart','newton'),
('2026-bi-district-3a-d2-iii-8','troup','de-kalb'),
('2026-bi-district-3a-d2-iv-2','blanco','hebbronville'),
('2026-bi-district-3a-d2-iv-3','anderson-shiro','east-bernard'),
('2026-bi-district-3a-d2-iv-4','cotulla','stockdale'),
('2026-bi-district-3a-d2-iv-5','santa-rosa','poth'),
('2026-bi-district-3a-d2-iv-6','rogers','altair-rice'),
('2026-bi-district-3a-d2-iv-7','nixon-smiley','george-west'),
('2026-bi-district-3a-d2-iv-8','boling','lexington'),
('2026-area-3a-d2-i-1','merkel','canadian'),
('2026-area-3a-d2-i-2','holliday','idalou'),
('2026-area-3a-d2-i-3','slaton','henrietta'),
('2026-area-3a-d2-i-4','childress','jacksboro'),
('2026-area-3a-d2-ii-1','edgewood','millsap'),
('2026-area-3a-d2-ii-2','howe','maypearl'),
('2026-area-3a-d2-ii-3','dallas-madison','bells'),
('2026-area-3a-d2-iii-1','buffalo','arp'),
('2026-area-3a-d2-iii-2','hardin','jefferson'),
('2026-area-3a-d2-iii-3','new-london-west-rusk','mildred'),
('2026-area-3a-d2-iii-4','troup','newton'),
('2026-area-3a-d2-iv-1','blanco','thrall'),
('2026-area-3a-d2-iv-2','stockdale','east-bernard'),
('2026-area-3a-d2-iv-3','altair-rice','poth'),
('2026-area-3a-d2-iv-4','boling','george-west');
do $$ begin
 if exists(select 1 from d3d2_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Canonical identity conflict'; end if;
 if exists(select 1 from d3d2_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from d3d2_identities on conflict(game_id) do nothing;
select count(*) as registered,37 as expected from d3d2_identities n join private.canonical_game_identity c using(game_id);
commit;

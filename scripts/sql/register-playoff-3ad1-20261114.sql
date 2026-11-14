-- Identity-only, idempotent registration. No scores, schedules, roles or RLS are changed.
begin;
create temporary table d3_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into d3_identities values
('2026-bi-district-3a-d1-i-3','denver-city','clyde'),
('2026-bi-district-3a-d1-i-5','bowie','wall'),
('2026-bi-district-3a-d1-i-8','tuscola-jim-ned','bushland'),
('2026-bi-district-3a-d1-ii-3','dallas-life-oak-cliff','whitney'),
('2026-bi-district-3a-d1-ii-4','tatum','winnsboro'),
('2026-bi-district-3a-d1-ii-5','gladewater','malakoff'),
('2026-bi-district-3a-d1-ii-6','pilot-point','mexia'),
('2026-bi-district-3a-d1-ii-7','mount-vernon','atlanta'),
('2026-bi-district-3a-d1-iii-1','buna','diboll'),
('2026-bi-district-3a-d1-iii-2','sweeny','lorena'),
('2026-bi-district-3a-d1-iii-3','trinity','orangefield'),
('2026-bi-district-3a-d1-iii-4','cameron-yoe','edna'),
('2026-bi-district-3a-d1-iii-5','little-river-academy','columbus'),
('2026-bi-district-3a-d1-iii-6','palestine-westwood','anahuac'),
('2026-bi-district-3a-d1-iii-7','hempstead','franklin'),
('2026-bi-district-3a-d1-iii-8','east-chambers','fairfield'),
('2026-bi-district-3a-d1-iv-1','carrizo-springs','yoakum'),
('2026-bi-district-3a-d1-iv-2','goliad','rio-hondo'),
('2026-bi-district-3a-d1-iv-4','raymondville','orange-grove'),
('2026-bi-district-3a-d1-iv-5','lyford','sinton'),
('2026-bi-district-3a-d1-iv-7','mathis','san-diego'),
('2026-bi-district-3a-d1-iv-8','hondo','marion'),
('2026-area-3a-d1-i-1','peaster','shallowater'),
('2026-area-3a-d1-i-2','vernon','clyde'),
('2026-area-3a-d1-i-3','sweetwater','wall'),
('2026-area-3a-d1-i-4','bushland','paradise'),
('2026-area-3a-d1-ii-1','texarkana-liberty-eylau','gunter'),
('2026-area-3a-d1-ii-2','tatum','whitney'),
('2026-area-3a-d1-ii-3','pilot-point','malakoff'),
('2026-area-3a-d1-ii-4','whitesboro','atlanta'),
('2026-area-3a-d1-iii-1','lorena','diboll'),
('2026-area-3a-d1-iii-2','cameron-yoe','orangefield'),
('2026-area-3a-d1-iii-3','palestine-westwood','columbus'),
('2026-area-3a-d1-iii-4','east-chambers','franklin'),
('2026-area-3a-d1-iv-1','goliad','yoakum'),
('2026-area-3a-d1-iv-2','orange-grove','devine'),
('2026-area-3a-d1-iv-3','hallettsville','sinton'),
('2026-area-3a-d1-iv-4','marion','san-diego');
do $$ begin
 if exists(select 1 from d3_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Canonical identity conflict'; end if;
 if exists(select 1 from d3_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from d3_identities on conflict(game_id) do nothing;
select count(*) as registered,38 as expected from d3_identities n join private.canonical_game_identity c using(game_id);
commit;

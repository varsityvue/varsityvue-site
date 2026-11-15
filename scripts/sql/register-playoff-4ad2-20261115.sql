-- Identity-only. No score, permission or schema changes.
begin;
create temporary table d4d2_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into d4d2_identities values
('2026-bi-district-4a-d2-i-1','pecos','el-paso-irvin'),
('2026-bi-district-4a-d2-i-2','lubbock-estacado','graham'),
('2026-bi-district-4a-d2-i-3','el-paso-bowie','seminole'),
('2026-bi-district-4a-d2-i-4','levelland','mineral-wells'),
('2026-bi-district-4a-d2-i-5','burkburnett','lubbock-cooper-liberty'),
('2026-bi-district-4a-d2-i-6','clint','monahans'),
('2026-bi-district-4a-d2-i-7','perryton','brock'),
('2026-bi-district-4a-d2-i-8','big-spring','clint-mountain-view'),
('2026-bi-district-4a-d2-ii-1','ponder','glen-rose'),
('2026-bi-district-4a-d2-ii-2','quinlan-ford','carthage'),
('2026-bi-district-4a-d2-ii-3','venus','van-alstyne'),
('2026-bi-district-4a-d2-ii-4','texarkana-pleasant-grove','farmersville'),
('2026-bi-district-4a-d2-ii-5','pittsburg','sunnyvale'),
('2026-bi-district-4a-d2-ii-6','kemp','krum'),
('2026-bi-district-4a-d2-ii-7','paris-north-lamar','gilmer'),
('2026-bi-district-4a-d2-ii-8','sanger','hillsboro'),
('2026-bi-district-4a-d2-iii-1','shepherd','canton'),
('2026-bi-district-4a-d2-iii-2','houston-north-forest','la-marque'),
('2026-bi-district-4a-d2-iii-3','van','west-orange-stark'),
('2026-bi-district-4a-d2-iii-4','hitchcock','houston-wheatley'),
('2026-bi-district-4a-d2-iii-5','la-grange','houston-yates'),
('2026-bi-district-4a-d2-iii-6','madisonville','silsbee'),
('2026-bi-district-4a-d2-iii-7','houston-worthing','bellville'),
('2026-bi-district-4a-d2-iii-8','hamshire-fannett','athens'),
('2026-bi-district-4a-d2-iv-1','manor-new-tech','waco-la-vega'),
('2026-bi-district-4a-d2-iv-2','geronimo-navarro','corpus-christi-london'),
('2026-bi-district-4a-d2-iv-3','salado','wimberley'),
('2026-bi-district-4a-d2-iv-4','kingsville-king','bandera'),
('2026-bi-district-4a-d2-iv-5','ingleside','cuero'),
('2026-bi-district-4a-d2-iv-6','brownwood','lago-vista'),
('2026-bi-district-4a-d2-iv-7','gonzales','rockport-fulton'),
('2026-bi-district-4a-d2-iv-8','giddings','robinson'),
('2026-area-4a-d2-i-1','graham','pecos'),
('2026-area-4a-d2-i-2','mineral-wells','seminole'),
('2026-area-4a-d2-i-3','monahans','lubbock-cooper-liberty'),
('2026-area-4a-d2-i-4','big-spring','brock'),
('2026-area-4a-d2-ii-1','carthage','glen-rose'),
('2026-area-4a-d2-ii-2','texarkana-pleasant-grove','van-alstyne'),
('2026-area-4a-d2-ii-3','krum','sunnyvale'),
('2026-area-4a-d2-ii-4','sanger','gilmer'),
('2026-area-4a-d2-iii-1','la-marque','canton'),
('2026-area-4a-d2-iii-2','hitchcock','west-orange-stark'),
('2026-area-4a-d2-iii-3','madisonville','houston-yates'),
('2026-area-4a-d2-iii-4','hamshire-fannett','bellville'),
('2026-area-4a-d2-iv-1','geronimo-navarro','waco-la-vega'),
('2026-area-4a-d2-iv-2','kingsville-king','wimberley'),
('2026-area-4a-d2-iv-3','brownwood','cuero'),
('2026-area-4a-d2-iv-4','robinson','rockport-fulton');
do $$ begin
 if exists(select 1 from d4d2_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Canonical identity conflict'; end if;
 if exists(select 1 from d4d2_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from d4d2_identities on conflict(game_id) do nothing;
select count(*) as registered,48 as expected from d4d2_identities n join private.canonical_game_identity c using(game_id);
commit;

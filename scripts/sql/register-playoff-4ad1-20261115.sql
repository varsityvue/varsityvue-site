-- Identity-only. No score, schedule, permission or schema changes.
begin;
create temporary table d4d1_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into d4d1_identities values
('2026-bi-district-4a-d1-i-1','dumas','el-paso-andress'),
('2026-bi-district-4a-d1-i-2','san-angelo-lake-view','decatur'),
('2026-bi-district-4a-d1-i-3','el-paso-austin','canyon-randall'),
('2026-bi-district-4a-d1-i-4','lake-dallas','plainview'),
('2026-bi-district-4a-d1-i-5','springtown','midland-greenwood'),
('2026-bi-district-4a-d1-i-6','el-paso-ysleta','canyon-west-plains'),
('2026-bi-district-4a-d1-i-7','andrews','aubrey'),
('2026-bi-district-4a-d1-i-8','canyon','el-paso-riverside'),
('2026-bi-district-4a-d1-ii-1','dallas-carter','kennedale'),
('2026-bi-district-4a-d1-ii-2','caddo-mills','longview-pine-tree'),
('2026-bi-district-4a-d1-ii-3','fort-worth-southwest','dallas-lincoln'),
('2026-bi-district-4a-d1-ii-4','kilgore','paris'),
('2026-bi-district-4a-d1-ii-5','henderson','sulphur-springs'),
('2026-bi-district-4a-d1-ii-6','fort-worth-benbrook','dallas-kimball'),
('2026-bi-district-4a-d1-ii-7','kaufman','lindale'),
('2026-bi-district-4a-d1-ii-8','dallas-hutchins','fort-worth-eastern-hills'),
('2026-bi-district-4a-d1-iii-1','houston-austin','orange-little-cypress-mauriceville'),
('2026-bi-district-4a-d1-iii-2','el-campo','jarrell'),
('2026-bi-district-4a-d1-iii-3','bridge-city','stafford'),
('2026-bi-district-4a-d1-iii-4','china-spring','sealy'),
('2026-bi-district-4a-d1-iii-5','lampasas','bay-city'),
('2026-bi-district-4a-d1-iii-6','huffman-hargrave','fort-bend-willowridge'),
('stephenville-vs-navasota-2026-bi-district','navasota','stephenville'),
('2026-bi-district-4a-d1-iii-8','houston-sterling','vidor'),
('2026-bi-district-4a-d1-iv-1','pleasanton','comal-canyon-lake'),
('2026-bi-district-4a-d1-iv-2','port-lavaca-calhoun','edcouch-elsa'),
('2026-bi-district-4a-d1-iv-3','comal-davenport','somerset'),
('2026-bi-district-4a-d1-iv-4','corpus-christi-miller','zapata'),
('2026-bi-district-4a-d1-iv-5','hidalgo-early-college','corpus-christi-calallen'),
('2026-bi-district-4a-d1-iv-6','fredericksburg','floresville'),
('2026-bi-district-4a-d1-iv-7','corpus-christi-tuloso-midway','alice'),
('2026-bi-district-4a-d1-iv-8','la-vernia','kerrville-tivy'),
('2026-area-4a-d1-i-1','decatur','el-paso-andress'),
('2026-area-4a-d1-i-2','lake-dallas','canyon-randall'),
('2026-area-4a-d1-i-3','canyon-west-plains','springtown'),
('2026-area-4a-d1-i-4','canyon','aubrey'),
('2026-area-4a-d1-ii-1','longview-pine-tree','kennedale'),
('2026-area-4a-d1-ii-2','paris','dallas-lincoln'),
('2026-area-4a-d1-ii-3','dallas-kimball','henderson'),
('2026-area-4a-d1-ii-4','dallas-hutchins','lindale'),
('2026-area-4a-d1-iii-1','el-campo','orange-little-cypress-mauriceville'),
('2026-area-4a-d1-iii-2','china-spring','stafford'),
('2026-area-4a-d1-iii-3','huffman-hargrave','bay-city'),
('2026-area-4a-d1-iii-4','vidor','stephenville'),
('2026-area-4a-d1-iv-1','port-lavaca-calhoun','comal-canyon-lake'),
('2026-area-4a-d1-iv-2','corpus-christi-miller','comal-davenport'),
('2026-area-4a-d1-iv-3','floresville','corpus-christi-calallen'),
('2026-area-4a-d1-iv-4','la-vernia','corpus-christi-tuloso-midway');
do $$ begin
 if exists(select 1 from d4d1_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Canonical identity conflict'; end if;
 if exists(select 1 from d4d1_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from d4d1_identities on conflict(game_id) do nothing;
select count(*) as registered,48 as expected from d4d1_identities n join private.canonical_game_identity c using(game_id);
commit;

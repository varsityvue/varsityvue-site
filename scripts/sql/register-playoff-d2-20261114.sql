-- Identity-only, idempotent registration. No scores, schedules, roles or RLS are changed.
begin;
create temporary table d2_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into d2_identities values
('2026-bi-district-2a-d2-i-1','plains','gruver'),
('2026-bi-district-2a-d2-i-2','tahoka','mccamey'),
('2026-bi-district-2a-d2-i-4','iraan','lockney'),
('2026-bi-district-2a-d2-i-5','eldorado','roscoe'),
('2026-bi-district-2a-d2-i-6','stinnett-west-texas','sudan'),
('2026-bi-district-2a-d2-i-8','seagraves','stratford'),
('2026-bi-district-2a-d2-iii-1','maud','collinsville'),
('2026-bi-district-2a-d2-iii-2','cushing','colmesneil'),
('2026-bi-district-2a-d2-iii-3','quinlan-boles','clarksville'),
('2026-bi-district-2a-d2-iii-4','saratoga-west-hardin','grapeland'),
('2026-bi-district-2a-d2-iii-5','evadale','overton'),
('2026-bi-district-2a-d2-iii-6','era','detroit'),
('2026-bi-district-2a-d2-iii-7','tenaha','west-sabine'),
('2026-bi-district-2a-d2-iii-8','simms-bowie','lindsay'),
('2026-bi-district-2a-d2-iv-1','dhanis','bremond'),
('2026-bi-district-2a-d2-iv-2','three-rivers','ben-bolt-palito-blanco'),
('2026-bi-district-2a-d2-iv-3','bartlett','junction'),
('2026-bi-district-2a-d2-iv-4','santa-maria','yorktown'),
('2026-bi-district-2a-d2-iv-5','agua-dulce','falls-city'),
('2026-bi-district-2a-d2-iv-6','burton','harper'),
('2026-bi-district-2a-d2-iv-7','pettus','la-villa'),
('2026-bi-district-2a-d2-iv-8','brackettville-brackett','chilton'),
('2026-area-2a-d2-i-1','mccamey','gruver'),
('2026-area-2a-d2-i-2','iraan','ropes'),
('2026-area-2a-d2-i-3','sudan','roscoe'),
('2026-area-2a-d2-i-4','stratford','wink'),
('2026-area-2a-d2-ii-1','crawford','wellington'),
('2026-area-2a-d2-ii-2','stamford','windthorst'),
('2026-area-2a-d2-ii-3','haskell','goldthwaite'),
('2026-area-2a-d2-ii-4','wheeler','santo'),
('2026-area-2a-d2-iii-1','colmesneil','collinsville'),
('2026-area-2a-d2-iii-2','grapeland','clarksville'),
('2026-area-2a-d2-iii-3','era','overton'),
('2026-area-2a-d2-iii-4','lindsay','west-sabine'),
('2026-area-2a-d2-iv-1','three-rivers','bremond'),
('2026-area-2a-d2-iv-2','yorktown','junction'),
('2026-area-2a-d2-iv-3','harper','falls-city');
do $$ begin
 if exists(select 1 from d2_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Canonical identity conflict'; end if;
 if exists(select 1 from d2_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from d2_identities on conflict(game_id) do nothing;
select count(*) as registered,37 as expected from d2_identities n join private.canonical_game_identity c using(game_id);
commit;

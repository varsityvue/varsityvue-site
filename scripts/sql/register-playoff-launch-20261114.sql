-- Identity-only registration. No score, permissions, or schedule mutations.
begin;
create temporary table launch_identities(game_id text,away_school_slug text,home_school_slug text) on commit drop;
insert into launch_identities values
('2026-bi-district-2a-d1-i-1','floydada','panhandle'),
('2026-bi-district-2a-d1-i-2','abernathy','forsan'),
('2026-bi-district-2a-d1-i-3','sanford-fritch','tulia'),
('2026-bi-district-2a-d1-i-4','ballinger','new-home'),
('2026-bi-district-2a-d1-i-7','new-deal','sonora'),
('2026-bi-district-2a-d1-i-8','farwell','spearman'),
('2026-area-2a-d1-i-1','forsan','panhandle'),
('2026-area-2a-d1-i-2','ballinger','tulia'),
('2026-area-2a-d1-i-3','olton','ozona'),
('2026-area-2a-d1-i-4','spearman','new-deal'),
('2026-area-2a-d1-ii-1','johnson-city-lbj','cisco'),
('2026-area-2a-d1-ii-2','san-saba','muenster'),
('2026-area-2a-d1-ii-3','tioga','mason'),
('2026-area-2a-d1-ii-4','de-leon','axtell'),
('2026-bi-district-2a-d1-iii-4','garrison','beckville'),
('2026-bi-district-2a-d1-iii-5','joaquin','omaha-pewitt'),
('2026-bi-district-2a-d1-iii-6','whitewright','frankston'),
('2026-bi-district-2a-d1-iii-8','hawkins','tom-bean'),
('2026-area-2a-d1-iii-1','shelbyville','cooper'),
('2026-area-2a-d1-iii-2','beckville','price-carlisle'),
('2026-area-2a-d1-iii-3','frankston','joaquin'),
('2026-area-2a-d1-iii-4','tom-bean','san-augustine'),
('2026-bi-district-2a-d1-iv-2','weimar','refugio'),
('2026-bi-district-2a-d1-iv-5','freer','shiner'),
('2026-bi-district-2a-d1-iv-7','flatonia','dilley'),
('2026-area-2a-d1-iv-1','weimar','thorndale'),
('2026-area-2a-d1-iv-2','ganado','jewett-leon'),
('2026-area-2a-d1-iv-3','lovelady','shiner'),
('2026-area-2a-d1-iv-4','rosebud-lott','flatonia'),
('2026-bi-district-3a-d2-ii-7','leonard','grand-saline'),
('2026-area-3a-d2-ii-4','tolar','grand-saline'),
('2026-bi-district-4a-d2-iv-6','brownwood','lago-vista'),
('2026-bi-district-4a-d2-iv-5','ingleside','cuero'),
('2026-area-4a-d2-iv-3','brownwood','cuero');
do $$ begin
 if exists(select 1 from launch_identities n join private.canonical_game_identity c using(game_id) where c.home_school_slug<>n.home_school_slug or c.away_school_slug<>n.away_school_slug) then raise exception 'Existing canonical identity conflict'; end if;
 if exists(select 1 from launch_identities n join private.canonical_game_identity c on c.game_id<>n.game_id and c.game_id like '%2026%' and ((c.game_id like '%area%' and n.game_id like '%area%') or (c.game_id like '%bi-district%' and n.game_id like '%bi-district%')) and ((c.home_school_slug=n.home_school_slug and c.away_school_slug=n.away_school_slug) or (c.home_school_slug=n.away_school_slug and c.away_school_slug=n.home_school_slug))) then raise exception 'Duplicate playoff identity'; end if;
end $$;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug) select game_id,away_school_slug,home_school_slug from launch_identities on conflict(game_id) do nothing;
select count(*) as registered from launch_identities n join private.canonical_game_identity c using(game_id);
commit;

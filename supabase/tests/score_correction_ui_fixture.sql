-- Disposable CI database only; synthetic administrator and canonical games.
insert into public.user_roles(user_id,role)
select id,'admin' from auth.users where email='score-ui-admin@example.invalid';
insert into public.game_state(game_id,status,away_score,home_score,period,clock,verified,verified_at,away_school_slug,home_school_slug,result_type)
values ('jacksboro-at-cisco-2026-week-5','final',28,21,'Q4','00:00',true,now(),'jacksboro','cisco','played'),
('de-leon-at-goldthwaite-2026-week-4','live',3,7,'Q2','04:15',true,now(),'de-leon','goldthwaite',null);

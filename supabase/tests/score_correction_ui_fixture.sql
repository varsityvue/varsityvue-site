-- Disposable CI database only; synthetic administrator and canonical games.
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('00000000-0000-4000-8000-00000000a001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-ui-admin@example.invalid',extensions.crypt('synthetic-only-password',extensions.gen_salt('bf')),now(),'{}'::jsonb,'{"display_name":"Score UI admin"}'::jsonb,now(),now());
insert into public.user_roles(user_id,role) values ('00000000-0000-4000-8000-00000000a001','admin');
insert into public.game_state(game_id,status,away_score,home_score,period,clock,verified,verified_at,away_school_slug,home_school_slug,result_type)
values ('jacksboro-at-cisco-2026-week-5','final',28,21,'Q4','00:00',true,now(),'jacksboro','cisco','played'),
('de-leon-at-goldthwaite-2026-week-4','live',3,7,'Q2','04:15',true,now(),'de-leon','goldthwaite',null);

-- Disposable CI database only; synthetic administrator and canonical games.
insert into public.user_roles(user_id,role)
select id,'admin' from auth.users where email='score-ui-admin@example.invalid';
insert into public.game_state(game_id,status,away_score,home_score,period,clock,verified,verified_at,away_school_slug,home_school_slug,result_type)
values ('jacksboro-at-cisco-2026-week-5','final',28,21,'Q4','00:00',true,now(),'jacksboro','cisco','played'),
('de-leon-at-goldthwaite-2026-week-4','live',3,7,'Q2','04:15',true,now(),'de-leon','goldthwaite',null);
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('00000000-0000-4000-8000-00000000a002','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','score-ui-challenger@example.invalid','!',now(),'{}'::jsonb,
 '{"display_name":"UI challenger"}'::jsonb,now(),now());
do $$ declare w uuid;g uuid;admin_id uuid;begin
 select id into admin_id from auth.users where email='score-ui-admin@example.invalid';
 select id into w from public.pickem_weeks where season=2026 and week=5;
 update public.pickem_weeks set status='graded',closes_at=now()-interval '1 day' where id=w;
 select id into g from public.pickem_games where week_id=w and game_id='jacksboro-at-cisco-2026-week-5';
 if g is null then
   insert into public.pickem_games(week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
   values(w,'jacksboro-at-cisco-2026-week-5',1,now()-interval '1 day','jacksboro','cisco') returning id into g;
 end if;
 insert into public.pickem_picks(pickem_game_id,user_id,picked_school_slug)
 values(g,admin_id,'jacksboro'),(g,'00000000-0000-4000-8000-00000000a002','cisco');
 update public.game_state set period='Q4' where game_id='jacksboro-at-cisco-2026-week-5';
end $$;

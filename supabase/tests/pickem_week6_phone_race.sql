-- Synthetic one-game fixture in disposable local CI database only.
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'@example.invalid','!',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
from (values ('00000000-0000-4000-8000-000000006001'::uuid,'race-one'),('00000000-0000-4000-8000-000000006002'::uuid,'race-two')) fixture(id,label);
insert into public.pickem_weeks (id,season,week,title,status,opens_at,closes_at)
values ('00000000-0000-4000-8000-000000006006',2099,7,'Race fixture','open',now()-interval '1 hour',now()+interval '10 minutes');
insert into public.pickem_games (id,week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
values ('00000000-0000-4000-8000-000000006007','00000000-0000-4000-8000-000000006006','__race_game__',1,now()+interval '5 minutes','race-away','race-home');
update public.pickem_weeks set tiebreaker_game_id='00000000-0000-4000-8000-000000006007' where id='00000000-0000-4000-8000-000000006006';

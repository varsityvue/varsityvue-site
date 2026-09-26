-- Disposable database only. This combined fixture follows the actual Week 6+
-- draft/open/complete-entry path and rolls every identity and game back.
begin;
create temp table integration_ids (label text primary key,id uuid,phone text) on commit preserve rows;
insert into integration_ids values
 ('A','00000000-0000-4000-8000-000000000601','2545550601'),
 ('B','00000000-0000-4000-8000-000000000602','2545550602'),
 ('admin','00000000-0000-4000-8000-000000000603','2545550603');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 label||'-integration@example.invalid','!',now(),'{}'::jsonb,
 jsonb_build_object('display_name','Integrated '||label),now(),now() from integration_ids;
insert into public.user_roles(user_id,role) select id,'admin'::public.user_role
 from integration_ids where label='admin';
create temp table integration_week (id uuid,game uuid) on commit preserve rows;
do $$ declare w uuid;g uuid;begin
 insert into public.pickem_weeks(season,week,title,status,opens_at,closes_at,
 official_rules_version,official_rules_published_at)
 values(2098,6,'Integrated correction test','draft',now()-interval '1 minute',
 now()+interval '5 seconds','isolated-test',now()) returning id into w;
 insert into public.pickem_games(week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
 values(w,'__integrated_gotw__',1,now()+interval '3 seconds','int-away','int-home') returning id into g;
 update public.pickem_weeks set tiebreaker_game_id=g,status='open' where id=w;
 insert into integration_week values(w,g);
end $$;
grant select on integration_ids,integration_week to authenticated;
set local role authenticated;
do $$ declare w uuid;g uuid;r record;begin
 select id,game into w,g from integration_week;
 for r in select * from integration_ids where label in ('A','B') order by label loop
   perform set_config('request.jwt.claim.sub',r.id::text,true);
   perform public.submit_pickem_contest_entry(w,r.phone,
     case when r.label='A' then 60 else 70 end,
     jsonb_build_object(g::text,'int-home'),true);
 end loop;
end $$;
reset role;
do $$ begin
 if (select valid_entries from public.pickem_contest_prize where week_id=(select id from integration_week))<>2
 or (select prize_dollars from public.pickem_contest_prize where week_id=(select id from integration_week))<>2
 then raise exception 'Complete entries or prize count incorrect';end if;
end $$;
commit;
select pg_sleep(greatest(0,extract(epoch from ((select closes_at from public.pickem_weeks
 where id=(select id from integration_week))-clock_timestamp()))+0.15));
begin;
insert into private.final_score_notification_games
 (game_id,game_date,kickoff,away_team_name,home_team_name,away_school_slug,home_school_slug)
 values('__integrated_gotw__',current_date,now(),'Int Away','Int Home','int-away','int-home');
update private.final_score_email_activation set activated_at=now()-interval '1 hour',
 minimum_game_date=current_date,
 baseline_verified_final_game_ids=array_remove(baseline_verified_final_game_ids,'__integrated_gotw__')
 where singleton;
insert into public.game_state(game_id,status,away_score,home_score,verified,verified_at,
 result_type,away_school_slug,home_school_slug)
 values('__integrated_gotw__','final',25,35,true,now(),'played','int-away','int-home');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from integration_ids where label='admin'),true);
do $$ declare w uuid;actual uuid;begin
 select id into w from integration_week;
 perform public.admin_finalize_pickem_contest_results(w);
 select user_id into actual from public.admin_pickem_provisional_winner_contact(w);
 if actual is distinct from (select id from integration_ids where label='A')
 then raise exception 'A not initial leader';end if;
end $$;
-- A: correction before notice changes the leader and voids the first receipt.
select public.correct_game_score('__integrated_gotw__',
 (select updated_at from public.game_state where game_id='__integrated_gotw__'),0,
 'final',28,42,'Q4','00:00','A: corrected played total');
do $$ declare w uuid;begin
 select id into w from integration_week;
 if (select state from public.admin_pickem_correction_review_status(w))<>'superseded'
 or exists(select 1 from public.admin_pickem_provisional_winner_contact(w))
 or (select actual_total from public.pickem_week_standings where week_id=w limit 1)<>70
 or (select distance from public.pickem_week_standings s join integration_ids i on i.id=s.user_id
     where s.week_id=w and i.label='B')<>0
 then raise exception 'A: corrected total, error, or supersession failed';end if;
 perform public.admin_finalize_pickem_contest_results(w);
 if (select user_id from public.admin_pickem_provisional_winner_contact(w)) is distinct from
    (select id from integration_ids where label='B') then raise exception 'A: B not new leader';end if;
end $$;
-- B: notice B; correction moves A ahead, preserving B's old notification.
select public.admin_record_pickem_winner_notice((select id from integration_week));
select public.correct_game_score('__integrated_gotw__',
 (select updated_at from public.game_state where game_id='__integrated_gotw__'),1,
 'final',25,35,'Q4','00:00','B: revised official total');
do $$ declare w uuid;begin
 select id into w from integration_week;
 if not exists(select 1 from private.pickem_winner_claims c join integration_ids i on i.id=c.user_id
   where c.week_id=w and i.label='B' and c.generation=2 and c.decision='superseded'
   and c.notified_at is not null and c.respond_by is not null
   and c.previous_rank=1 and c.correction_audit_id is not null)
 then raise exception 'B: notified B history not superseded';end if;
 perform public.admin_finalize_pickem_contest_results(w);
 if (select user_id from public.admin_pickem_provisional_winner_contact(w)) is distinct from
   (select id from integration_ids where label='A') then raise exception 'B: A not new leader';end if;
 perform public.admin_record_pickem_winner_notice(w);
 perform public.admin_record_pickem_winner_response(w);
 perform public.admin_decide_pickem_winner_claim(w,'confirmed','Test eligibility reviewed');
end $$;
-- C: confirmed A cannot remain payable after B retakes the lead.
select public.correct_game_score('__integrated_gotw__',
 (select updated_at from public.game_state where game_id='__integrated_gotw__'),2,
 'final',28,42,'Q4','00:00','C: official score revised');
do $$ declare w uuid;begin
 select id into w from integration_week;
 if not exists(select 1 from private.pickem_winner_claims c join integration_ids i on i.id=c.user_id
   where c.week_id=w and i.label='A' and c.generation=3 and c.decision='superseded'
   and c.responded_at is not null and c.notified_at is not null)
 then raise exception 'C: confirmed A still payable or history missing';end if;
 begin perform public.admin_record_pickem_prize_paid(w);
   raise exception 'C: stale A could be paid';
 exception when others then if sqlerrm='C: stale A could be paid' then raise;end if;end;
 perform public.admin_finalize_pickem_contest_results(w);
 perform public.admin_record_pickem_winner_notice(w);
 perform public.admin_record_pickem_winner_response(w);
 perform public.admin_decide_pickem_winner_claim(w,'confirmed','Test eligibility reviewed');
end $$;
-- E: a corrected total that leaves B first does not restart the claim.
select public.correct_game_score('__integrated_gotw__',
 (select updated_at from public.game_state where game_id='__integrated_gotw__'),3,
 'final',29,42,'Q4','00:00','E: minor official adjustment');
do $$ declare w uuid;begin
 select id into w from integration_week;
 if (select generation from public.admin_pickem_correction_review_status(w))<>4
 or (select state from public.admin_pickem_correction_review_status(w))<>'current'
 or not exists(select 1 from private.pickem_winner_claims where week_id=w
    and generation=4 and decision='confirmed')
 then raise exception 'E: unchanged leader restarted workflow';end if;
 perform public.admin_record_pickem_prize_paid(w);
end $$;
-- D: a paid record survives, and a changed leader requires manual review.
select public.correct_game_score('__integrated_gotw__',
 (select updated_at from public.game_state where game_id='__integrated_gotw__'),4,
 'final',25,35,'Q4','00:00','D: post-payment correction');
reset role;
do $$ declare w uuid;begin
 select id into w from integration_week;
 if (select state from private.pickem_contest_finalizations where week_id=w)<>'post_payment_review'
 or not exists(select 1 from private.pickem_winner_claims where week_id=w
   and generation=4 and decision='paid' and payment_recorded_at is not null)
 or (select count(*) from private.product_notification_events
     where category='final_score' and source_key='game-final:__integrated_gotw__')<>1
 or (select count(*) from private.game_score_correction_audit where game_id='__integrated_gotw__')<>5
 or (select count(*) from private.pickem_contest_finalization_history where week_id=w)<>4
 then raise exception 'D: paid history, review, audit, or FINAL event incorrect';end if;
 if (select user_id from public.pickem_week_standings where week_id=w order by weekly_rank limit 1)
   is distinct from (select id from integration_ids where label='A')
 then raise exception 'D: canonical corrected ranking not reflected';end if;
end $$;
rollback;

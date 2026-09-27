-- Disposable CI database only. The operator UUID is the confirmed real account ID;
-- synthetic users and phone numbers in this fixture never reach production.
begin;
create temporary table operator_test_ids (label text primary key, user_id uuid, phone text);
insert into operator_test_ids values
  ('operator','92d45311-2133-4694-bd03-93ce8299bed9','2545550201'),
  ('admin','00000000-0000-4000-8000-000000000201','2545550202'),
  ('moderator','00000000-0000-4000-8000-000000000202','2545550203'),
  ('member','00000000-0000-4000-8000-000000000203','2545550204'),
  ('duplicate','00000000-0000-4000-8000-000000000204','(254) 555-0202');
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select user_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'operator-exclusion-'||label||'@example.invalid','!',now(),'{}'::jsonb,'{}'::jsonb,now(),now() from operator_test_ids;
insert into public.user_roles (user_id,role)
select user_id,case label when 'moderator' then 'moderator'::public.user_role else 'admin'::public.user_role end
from operator_test_ids where label in ('operator','admin','moderator');
create temporary table operator_test_week (week_id uuid, game_id uuid);
do $$ declare w uuid; g uuid; begin
  insert into public.pickem_weeks (season,week,title,status,opens_at,closes_at,official_rules_version,official_rules_published_at)
  values (2100,6,'Operator exclusion fixture','draft',now()-interval '1 hour',now()+interval '22 seconds','isolated-test',now()) returning id into w;
  insert into public.pickem_games (week_id,game_id,lock_at,away_school_slug,home_school_slug)
  values (w,'__operator_exclusion__',now()+interval '20 seconds','fixture-away','fixture-home') returning id into g;
  update public.pickem_weeks set tiebreaker_game_id=g,status='open' where id=w;
  insert into operator_test_week values (w,g);
end $$;
grant select on operator_test_ids,operator_test_week to authenticated;
set local role authenticated;
do $$ declare w uuid; g uuid; entrant record; picks jsonb; receipt timestamptz; begin
  select week_id,game_id into w,g from operator_test_week;
  picks := jsonb_build_object(g::text,'fixture-home');
  perform set_config('request.jwt.claim.sub',(select user_id::text from operator_test_ids where label='operator'),true);
  begin
    perform public.submit_pickem_contest_entry(w,'2545550201',42,picks,true);
    raise exception 'Operator was accepted';
  exception when others then
    if sqlerrm='Operator was accepted' or sqlerrm not like '%contest operator is ineligible%' then raise; end if;
  end;
  if exists (select 1 from public.pickem_contest_entries where week_id=w and user_id=auth.uid())
     or (select valid_entries from public.pickem_contest_prize where week_id=w)<>0
     or (select prize_dollars from public.pickem_contest_prize where week_id=w)<>0 then
    raise exception 'Rejected operator gained a completed entry or prize count';
  end if;
  for entrant in select * from operator_test_ids where label in ('admin','moderator','member') order by label loop
    perform set_config('request.jwt.claim.sub',entrant.user_id::text,true);
    receipt := public.submit_pickem_contest_entry(w,entrant.phone,42,picks,true);
    if receipt is null or receipt is distinct from
      (select completed_at from public.pickem_contest_entries
       where week_id=w and user_id=entrant.user_id and status='valid') then
      raise exception '% did not receive a valid completed entry', entrant.label;
    end if;
  end loop;
  perform set_config('request.jwt.claim.sub',(select user_id::text from operator_test_ids where label='duplicate'),true);
  begin
    perform public.submit_pickem_contest_entry(w,'2545550205',42,picks,false);
    raise exception 'Missing attestation was accepted';
  exception when others then
    if sqlerrm='Missing attestation was accepted'
      or sqlerrm <> 'Eligibility and Official Rules attestation is required' then raise; end if;
  end;
  begin
    perform public.submit_pickem_contest_entry(w,'+1 254 555 0202',42,picks,true);
    raise exception 'Duplicate phone was accepted';
  exception when others then
    if sqlerrm='Duplicate phone was accepted'
      or sqlerrm <> 'This number is already used for another entrant' then raise; end if;
  end;
  if (select valid_entries from public.pickem_contest_prize where week_id=w)<>3
    or (select prize_dollars from public.pickem_contest_prize where week_id=w)<>3
    or exists (select 1 from public.pickem_contest_entries where week_id=w
      and user_id in (select user_id from operator_test_ids where label in ('operator','duplicate')))
    or (select count(*) from public.pickem_contest_entries where week_id=w and status='valid')<>3 then
    raise exception 'Rejected attempts changed completed entries or prize';
  end if;
  if (select count(*) from public.pickem_contest_entries where week_id=w
      and status='valid' and completed_at is not null and attested_at is not null
      and attestation_rules_version='isolated-test'
      and attestation_text='I confirm that I am 18 or older, a Texas resident, and agree to the Official Rules.')<>3 then
    raise exception 'Role entrant durable attestation missing';
  end if;
end $$;
reset role;
commit;
-- The standings view intentionally waits for the real close and every game lock.
select pg_sleep(greatest(0,extract(epoch from
  ((select closes_at from public.pickem_weeks where id=(select week_id from operator_test_week))
    -clock_timestamp()))+0.15));
begin;
do $$ declare w uuid; begin
  select week_id into w from operator_test_week;
  if (select count(*) from public.pickem_week_standings where week_id=w)<>3
    or exists (select 1 from public.pickem_week_standings where week_id=w
      and user_id=(select user_id from operator_test_ids where label='operator'))
    or exists (select 1 from operator_test_ids i where i.label in ('admin','moderator','member')
      and not exists (select 1 from public.pickem_week_standings s
        where s.week_id=w and s.user_id=i.user_id)) then
    raise exception 'Closed contest standings excluded an eligible entrant or included the operator';
  end if;
end $$;
rollback;

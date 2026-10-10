-- Run against a disposable database with seeded active admin, moderator and member.
-- Every synthetic row is rolled back.
begin;
insert into private.canonical_game_identity(game_id,away_school_slug,home_school_slug)
values('__friday_ops__','away-a','home-a');
create temporary table actors(role text primary key, id uuid not null) on commit drop;
insert into actors select 'admin',user_id from public.user_roles where role='admin' order by user_id limit 1;
insert into actors select 'moderator',user_id from public.user_roles where role='moderator' order by user_id limit 1;
insert into actors select 'member',r.user_id from public.user_roles r
  join public.member_account_status a on a.user_id=r.user_id and a.status='active'
  where r.role='member' and r.user_id not in(select id from actors) order by r.user_id limit 1;
do $$ begin if (select count(*) from actors)<>3 then raise exception 'Three active test actors required'; end if; end $$;
grant select on actors to authenticated;

select set_config('request.jwt.claim.sub',(select id::text from actors where role='admin'),true);
set local role authenticated;
select public.submit_trusted_score_update('__friday_ops__',0,7,'live','1st','08:00',null,null,null,true);
reset role;
do $$ begin
  if not exists(select 1 from public.game_state where game_id='__friday_ops__' and status='live'
    and away_score=7 and home_score=0 and away_school_slug='away-a' and home_school_slug='home-a') then
    raise exception 'First trusted update did not establish canonical identity'; end if;
end $$;
create temporary table first_view(updated_at timestamptz,revision bigint) on commit drop;
insert into first_view select updated_at,score_revision from public.game_state where game_id='__friday_ops__';
grant select on first_view to authenticated;

-- Editor A saves; editor B still holds the first view.
select set_config('request.jwt.claim.sub',(select id::text from actors where role='admin'),true);
set local role authenticated;
select public.submit_trusted_score_update('__friday_ops__',0,14,'live','2nd','04:00',null,
  (select updated_at from first_view),(select revision from first_view),false);
select set_config('request.jwt.claim.sub',(select id::text from actors where role='moderator'),true);
do $$ begin
  begin
    perform public.submit_trusted_score_update('__friday_ops__',7,7,'live','2nd','03:00',null,
      (select updated_at from first_view),(select revision from first_view),false);
    raise exception 'Stale live editor overwrote the newer score';
  exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from public.game_state where game_id='__friday_ops__' and away_score=14 and home_score=0) then
    raise exception 'Stale editor changed canonical state'; end if;
end $$;

-- A fresh editor may legitimately lower a live score.
select set_config('request.jwt.claim.sub',(select id::text from actors where role='moderator'),true);
set local role authenticated;
select public.submit_trusted_score_update('__friday_ops__',0,13,'live','2nd','03:00','Official correction',
  (select updated_at from public.game_state where game_id='__friday_ops__'),
  (select score_revision from public.game_state where game_id='__friday_ops__'),false);
reset role;
do $$ begin if (select away_score from public.game_state where game_id='__friday_ops__')<>13 then
  raise exception 'Fresh score decrease failed'; end if; end $$;

-- A community report is pending; a moderator sees it, then canonical state advances.
select set_config('request.jwt.claim.sub',(select id::text from actors where role='member'),true);
set local role authenticated;
select * from public.submit_score_submission('__friday_ops__',7,13,'live','2nd','02:00','At the game');
reset role;
create temporary table pending_view(id uuid,updated_at timestamptz,revision bigint) on commit drop;
insert into pending_view select s.id,g.updated_at,g.score_revision from public.score_submissions s
cross join public.game_state g where s.game_id='__friday_ops__' and s.status='pending' and g.game_id=s.game_id;
grant select on pending_view to authenticated;
select set_config('request.jwt.claim.sub',(select id::text from actors where role='admin'),true);
set local role authenticated;
select public.correct_game_score('__friday_ops__',
  (select updated_at from public.game_state where game_id='__friday_ops__'),0,
  'live',13,3,'2nd','01:30','Verified score correction after report review opened');
select set_config('request.jwt.claim.sub',(select id::text from actors where role='moderator'),true);
do $$ begin
  begin
    update public.score_submissions set status='approved',reviewed_by=(select id from actors where role='moderator'),
      expected_state_updated_at=(select updated_at from pending_view),
      expected_state_revision=(select revision from pending_view),expected_state_absent=false
    where id=(select id from pending_view);
    raise exception 'Stale report approval was accepted';
  exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
do $$ begin if not exists(select 1 from public.score_submissions where id=(select id from pending_view) and status='pending') then
  raise exception 'Rejected stale approval changed report status'; end if; end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where role='admin'),true);
set local role authenticated;
select public.submit_trusted_score_update('__friday_ops__',7,14,'live','2nd','01:00',null,
  (select updated_at from public.game_state where game_id='__friday_ops__'),
  (select score_revision from public.game_state where game_id='__friday_ops__'),false);
reset role;
-- The trusted update supersedes the old report. It cannot be approved afterward.
do $$ begin if exists(select 1 from public.score_submissions where id=(select id from pending_view) and status='pending') then
  raise exception 'Old pending report was not superseded'; end if; end $$;

-- FINAL is explicit through the trusted RPC; subsequent live and FINAL writes are blocked.
select set_config('request.jwt.claim.sub',(select id::text from actors where role='admin'),true);
set local role authenticated;
select public.submit_trusted_score_update('__friday_ops__',21,14,'final',null,null,null,
  (select updated_at from public.game_state where game_id='__friday_ops__'),
  (select score_revision from public.game_state where game_id='__friday_ops__'),false);
do $$ begin
  begin
    perform public.submit_trusted_score_update('__friday_ops__',21,21,'final',null,null,null,
      (select updated_at from public.game_state where game_id='__friday_ops__'),
      (select score_revision from public.game_state where game_id='__friday_ops__'),false);
    raise exception 'Repeated FINAL was accepted';
  exception when raise_exception then
    if sqlerrm='Repeated FINAL was accepted' then raise; end if;
  end;
  begin
    perform public.submit_trusted_score_update('__friday_ops__',21,21,'live','OT',null,null,
      (select updated_at from public.game_state where game_id='__friday_ops__'),
      (select score_revision from public.game_state where game_id='__friday_ops__'),false);
    raise exception 'Live update reopened FINAL';
  exception when raise_exception then
    if sqlerrm='Live update reopened FINAL' then raise; end if;
  end;
end $$;
reset role;

-- A community report can arrive after FINAL through the RPC, but cannot publish.
select set_config('request.jwt.claim.sub',(select id::text from actors where role='member'),true);
set local role authenticated;
select * from public.submit_score_submission('__friday_ops__',28,14,'final',null,null,'Late report');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from actors where role='moderator'),true);
set local role authenticated;
do $$ begin
  begin
    update public.score_submissions set status='approved', reviewed_by=(select id from actors where role='moderator'),
      expected_state_updated_at=(select updated_at from public.game_state where game_id='__friday_ops__'),
      expected_state_revision=(select score_revision from public.game_state where game_id='__friday_ops__'),
      expected_state_absent=false
    where game_id='__friday_ops__' and status='pending';
    raise exception 'Late report replaced FINAL';
  exception when raise_exception then
    if sqlerrm='Late report replaced FINAL' then raise; end if;
  end;
end $$;
reset role;

-- Unknown game IDs and mismatched canonical identity fail at the database boundary.
do $$ begin
  begin
    insert into public.game_state(game_id,status,verified) values('__not_registered__','upcoming',true);
    raise exception 'Unknown game accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.game_state set away_school_slug='wrong-team' where game_id='__friday_ops__';
    raise exception 'Mismatched identity accepted';
  exception when invalid_parameter_value then null; end;
end $$;
rollback;

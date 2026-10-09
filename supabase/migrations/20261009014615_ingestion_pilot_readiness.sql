-- Pilot staging controls only. Defaults closed; no canonical writes/publishers.
create table private.ingestion_pilot_control (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false
);
insert into private.ingestion_pilot_control(singleton) values(true);
alter table private.ingestion_pilot_control enable row level security;
create table private.ingestion_pilot_usage (
 actor uuid not null, minute timestamptz not null, writes integer not null check(writes between 0 and 60),
 primary key(actor,minute)
);
alter table private.ingestion_pilot_usage enable row level security;
revoke all on private.ingestion_pilot_control,private.ingestion_pilot_usage from public,anon,authenticated,service_role;

-- Preserve existing global active admin/moderator scope; add only the closed gate.
create or replace function private.ingestion_allowed(actor uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select enabled from private.ingestion_pilot_control where singleton),false)
 and private.is_active_member(actor) and exists(select 1 from public.user_roles where user_id=actor and role in ('admin','moderator'));
$$;
create function public.ingestion_pilot_access() returns boolean
language sql stable security definer set search_path='' as $$ select private.ingestion_allowed(auth.uid()); $$;
revoke all on function public.ingestion_pilot_access() from public,anon;
grant execute on function public.ingestion_pilot_access() to authenticated;

-- Trusted service wrapper: serialized quota decisions, no bypassable legacy RPC.
alter function public.ingestion_mutate(uuid,uuid,text,integer,text,uuid,jsonb,text) rename to ingestion_mutate_phase1;
revoke all on function public.ingestion_mutate_phase1(uuid,uuid,text,integer,text,uuid,jsonb,text) from public,anon,authenticated,service_role;
create function public.ingestion_mutate(p_actor uuid,p_id uuid,p_command text,p_revision integer,p_hash text,p_request uuid,
 p_payload jsonb default '{}'::jsonb,p_reason text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare enabled boolean; used integer; source_count integer;
begin
 select c.enabled into enabled from private.ingestion_pilot_control c where singleton for update;
 if not enabled or not private.ingestion_allowed(p_actor) then raise exception using errcode='42501',message='Active enabled ingestion reviewer required'; end if;
 if octet_length(p_payload::text)>1048576 or length(coalesce(p_reason,''))>2000 then raise exception 'Pilot payload/reason limit exceeded'; end if;
 -- Exact retries are checked by the original immutable event engine and are free.
 if exists(select 1 from private.ingestion_events where submission_id=p_id and request_id=p_request) then
  return public.ingestion_mutate_phase1(p_actor,p_id,p_command,p_revision,p_hash,p_request,p_payload,p_reason);
 end if;
 delete from private.ingestion_pilot_usage where minute<date_trunc('minute',clock_timestamp())-interval '1 minute';
 insert into private.ingestion_pilot_usage(actor,minute,writes) values(p_actor,date_trunc('minute',clock_timestamp()),1)
 on conflict(actor,minute) do update set writes=private.ingestion_pilot_usage.writes+1
 where private.ingestion_pilot_usage.writes<60 returning writes into used;
 if used is null then raise exception using errcode='P0001',message='Pilot write rate exceeded; retry next minute'; end if;
 if p_command='create' then
  if (select count(*) from private.ingestion_submissions)>=2000 or
   (select count(*) from private.ingestion_submissions where creator=p_actor and created_at>=date_trunc('day',clock_timestamp()))>=100 then raise exception 'Pilot submission quota exceeded'; end if;
 end if;
 if p_command in ('create','save','reserve','ready','approve','reject','reopen') then
  if coalesce((select revision from private.ingestion_submissions where id=p_id),0)>=200 then raise exception 'Pilot revision limit reached; contact operator'; end if;
  select count(*) into source_count from private.ingestion_sources where submission_id=p_id;
  if (p_command='reserve' or p_payload ? 'source') and source_count>=32 then raise exception 'Pilot source limit reached'; end if;
 end if;
 if p_command='reserve' then
  -- Charge each pair its maximum bucket allowance (2 x 5 MiB), including tombstones
  -- whose physical objects have not been removed. Only audited cleanup frees space.
  if (select count(*) from private.ingestion_sources s where s.kind='image' and
   (s.state in ('reserved','finalized') or exists(select 1 from storage.objects o where o.bucket_id='ingestion-evidence' and o.name in(s.object_path,s.preview_path))))>=50 then raise exception 'Pilot evidence budget (500 MiB) exhausted; audited cleanup required'; end if;
 end if;
 if (select count(*) from private.ingestion_events where submission_id=p_id)>=2000 then raise exception 'Pilot history limit reached; contact operator'; end if;
 return public.ingestion_mutate_phase1(p_actor,p_id,p_command,p_revision,p_hash,p_request,p_payload,p_reason);
end; $$;
revoke all on function public.ingestion_mutate(uuid,uuid,text,integer,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.ingestion_mutate(uuid,uuid,text,integer,text,uuid,jsonb,text) to service_role;
create index ingestion_inbox_cursor on private.ingestion_submissions(created_at desc,id desc);
create index ingestion_events_cursor on private.ingestion_events(submission_id,id desc);
create index ingestion_cleanup_cursor on private.ingestion_sources(id) where state in ('reserved','failed','deleted');

create function public.ingestion_inbox(p_before timestamptz default null,p_before_id uuid default null,p_limit integer default 20) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare rows jsonb;
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if not public.ingestion_admit(auth.uid(),'read') then raise exception 'Pilot read rate exceeded; retry next minute'; end if;
 if p_limit is null or p_limit not between 1 and 20 or (p_before is null)<>(p_before_id is null) then raise exception 'Invalid bounded inbox cursor'; end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc,id desc),'[]') into rows from
 (select id,school_slug,season,data_class,operation,state,revision,created_at from private.ingestion_submissions
 where p_before is null or (created_at,id)<(p_before,p_before_id) order by created_at desc,id desc limit p_limit) t;
 return rows;
end; $$;
revoke all on function public.ingestion_inbox(timestamptz,uuid,integer) from public,anon;
grant execute on function public.ingestion_inbox(timestamptz,uuid,integer) to authenticated;

create function public.ingestion_history(p_id uuid,p_before bigint default null,p_limit integer default 20) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare rows jsonb;
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if not public.ingestion_admit(auth.uid(),'read') then raise exception 'Pilot read rate exceeded; retry next minute'; end if;
 if p_limit is null or p_limit not between 1 and 20 or p_before<=0 then raise exception 'Invalid bounded history cursor'; end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by id desc),'[]') into rows from
 (select id,command,actor,revision,review_hash,reason,created_at from private.ingestion_events
 where submission_id=p_id and (p_before is null or id<p_before) order by id desc limit p_limit) t;
 return rows;
end; $$;
revoke all on function public.ingestion_history(uuid,bigint,integer) from public,anon;
grant execute on function public.ingestion_history(uuid,bigint,integer) to authenticated;

-- Compatibility RPC now bounded; no whole revision/event snapshots in browser history.
create or replace function public.ingestion_read(p_id uuid default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if not public.ingestion_admit(auth.uid(),'read') then raise exception 'Pilot read rate exceeded; retry next minute'; end if;
 if p_id is null then return public.ingestion_inbox(); end if;
 return (select to_jsonb(s)||jsonb_build_object(
 'current',(select to_jsonb(r) from private.ingestion_revisions r where r.submission_id=s.id and r.revision=s.revision),
 'sources',coalesce((select jsonb_agg(to_jsonb(src) order by src.created_at) from private.ingestion_sources src where src.submission_id=s.id),'[]'),
 'history',public.ingestion_history(s.id),
 'creationRequestId',(select request_id from private.ingestion_events where submission_id=s.id and command='create' order by id limit 1),
 'creationInputHash',(select snapshot->'request'->'payload'->>'creationInputHash' from private.ingestion_events where submission_id=s.id and command='create' order by id limit 1))
 from private.ingestion_submissions s where s.id=p_id);
end; $$;

create function public.ingestion_cleanup_candidates(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
begin
 if not private.ingestion_allowed(auth.uid()) or not exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') then raise exception using errcode='42501',message='Active ingestion admin required'; end if;
 if not public.ingestion_admit(auth.uid(),'read') then raise exception 'Pilot read rate exceeded; retry next minute'; end if;
 if p_limit is null or p_limit not between 1 and 20 then raise exception 'Invalid bounded cleanup page'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from
 (select src.id,src.submission_id,src.state,src.created_at,s.revision,s.review_hash from private.ingestion_sources src join private.ingestion_submissions s on s.id=src.submission_id
 where src.kind='image' and (p_after is null or src.id>p_after)
 and (src.state in ('failed','deleted') or (src.state='reserved' and src.created_at<clock_timestamp()-interval '1 hour'))
 and exists(select 1 from storage.objects o where o.bucket_id='ingestion-evidence' and o.name in(src.object_path,src.preview_path))
 order by src.id limit p_limit) t);
end; $$;
revoke all on function public.ingestion_cleanup_candidates(uuid,integer) from public,anon;
grant execute on function public.ingestion_cleanup_candidates(uuid,integer) to authenticated;

-- Trusted admin-only hook audits before/after Storage removal; never deletes history.
create function public.ingestion_cleanup_audit(p_actor uuid,p_source uuid,p_attempt uuid,p_reason text,p_complete boolean default false,p_failed boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare src private.ingestion_sources%rowtype; s private.ingestion_submissions%rowtype; enabled boolean; event_id uuid;
begin
 select c.enabled into enabled from private.ingestion_pilot_control c where singleton for update;
 if not enabled or not private.ingestion_allowed(p_actor) or not exists(select 1 from public.user_roles where user_id=p_actor and role='admin') then raise exception using errcode='42501',message='Active ingestion admin required'; end if;
 if nullif(trim(p_reason),'') is null or length(p_reason)>2000 then raise exception 'Bounded cleanup reason required'; end if;
 select * into src from private.ingestion_sources where id=p_source;
 if not found or src.kind<>'image' or src.state not in ('failed','deleted') then raise exception 'Only tombstoned/failed image objects may be cleaned'; end if;
 select * into s from private.ingestion_submissions where id=src.submission_id for update;
 if p_complete and not exists(select 1 from private.ingestion_events where submission_id=s.id and request_id=p_attempt and command='cleanup_attempt' and actor=p_actor and snapshot->>'source'=src.id::text) then raise exception 'Cleanup attempt required'; end if;
 -- Deterministic outcome key: retry outcome never creates duplicate audit rows.
 event_id:=case when p_complete then (substr(md5(p_attempt::text||'/cleanup'),1,8)||'-'||substr(md5(p_attempt::text||'/cleanup'),9,4)||'-'||substr(md5(p_attempt::text||'/cleanup'),13,4)||'-'||substr(md5(p_attempt::text||'/cleanup'),17,4)||'-'||substr(md5(p_attempt::text||'/cleanup'),21,12))::uuid else p_attempt end;
 if not exists(select 1 from private.ingestion_events where submission_id=s.id and request_id=event_id) and (select count(*) from private.ingestion_events where submission_id=s.id)>=2000 then raise exception 'Pilot history limit reached; contact operator'; end if;
 insert into private.ingestion_events(submission_id,request_id,actor,command,revision,review_hash,reason,snapshot)
 values(s.id,event_id,p_actor,case when p_complete then 'cleanup_result' else 'cleanup_attempt' end,s.revision,s.review_hash,p_reason,jsonb_build_object('source',src.id,'attempt',p_attempt,'failed',p_failed)) on conflict(submission_id,request_id) do nothing;
 if not exists(select 1 from private.ingestion_events where submission_id=s.id and request_id=event_id and actor=p_actor and snapshot=jsonb_build_object('source',src.id,'attempt',p_attempt,'failed',p_failed) and reason=p_reason) then raise exception 'Cleanup request reused with different input'; end if;
 return jsonb_build_object('submission',s.id,'paths',jsonb_build_array(src.object_path,src.preview_path));
end; $$;
revoke all on function public.ingestion_cleanup_audit(uuid,uuid,uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.ingestion_cleanup_audit(uuid,uuid,uuid,text,boolean,boolean) to service_role;

-- Admission commits independently of a later failing mutation: invalid expensive
-- requests also consume their authenticated actor's distributed request budget.
create table private.ingestion_request_usage (
 actor uuid not null, kind text not null check(kind in ('read','write')), minute timestamptz not null,
 requests integer not null, primary key(actor,kind,minute)
);
alter table private.ingestion_request_usage enable row level security;
revoke all on private.ingestion_request_usage from public,anon,authenticated,service_role;
create function public.ingestion_admit(p_actor uuid,p_kind text) returns boolean
language plpgsql security definer set search_path='' as $$
declare used integer; cap integer;
begin
 if not private.ingestion_allowed(p_actor) or p_kind not in ('read','write') then return false; end if;
 cap:=case when p_kind='write' then 60 else 300 end;
 delete from private.ingestion_request_usage where minute<date_trunc('minute',clock_timestamp())-interval '1 minute';
 insert into private.ingestion_request_usage(actor,kind,minute,requests) values(p_actor,p_kind,date_trunc('minute',clock_timestamp()),1)
 on conflict(actor,kind,minute) do update set requests=private.ingestion_request_usage.requests+1
 where private.ingestion_request_usage.requests<cap returning requests into used;
 return used is not null;
end; $$;
revoke all on function public.ingestion_admit(uuid,text) from public,anon,authenticated;
grant execute on function public.ingestion_admit(uuid,text) to service_role;

-- Bound the catalog at the database boundary too; preserve its exact version input.
create or replace function public.ingestion_roster_catalog() returns jsonb
language plpgsql volatile security definer set search_path='' as $$
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if not public.ingestion_admit(auth.uid(),'read') then raise exception 'Pilot read rate exceeded; retry next minute'; end if;
 if (select count(*) from public.school_roster_players)>10000 then raise exception 'Roster catalog exceeds bounded review capacity'; end if;
 return (select jsonb_build_object('version',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')),'rows',coalesce(jsonb_agg(to_jsonb(t) order by id),'[]')) from public.school_roster_players t);
end; $$;

-- Storage INSERT locks the same gate then reservation as mutation/disable.
-- A fail/delete cannot release quota while an authorized INSERT is in flight.
create or replace function private.ingestion_object_allowed(path text,writing boolean default false) returns boolean
language plpgsql volatile security definer set search_path='' as $$
declare enabled boolean;
begin
 if not private.ingestion_allowed(auth.uid()) then return false; end if;
 if writing then
  select c.enabled into enabled from private.ingestion_pilot_control c where singleton for share;
  if not enabled then return false; end if;
  perform 1 from private.ingestion_sources s where (s.object_path=path or s.preview_path=path) and s.owner_id=auth.uid() and s.state='reserved' for share;
  return found;
 end if;
 return exists(select 1 from private.ingestion_sources s where (s.object_path=path or s.preview_path=path) and s.state='finalized');
end; $$;

-- Logical staging payload budget includes repeated immutable JSON snapshots/events.
-- This is not a physical disk/WAL/backup-size estimate. All accounting is transactional.
alter table private.ingestion_pilot_control add column payload_bytes bigint not null default 0 check(payload_bytes between 0 and 134217728);
update private.ingestion_pilot_control set payload_bytes=(
 select coalesce(sum(bytes),0) from (
 select octet_length(to_jsonb(t)::text) bytes from private.ingestion_submissions t union all
 select octet_length(to_jsonb(t)::text) from private.ingestion_sources t union all
 select octet_length(to_jsonb(t)::text) from private.ingestion_revisions t union all
 select octet_length(to_jsonb(t)::text) from private.ingestion_events t) all_payloads);
create function private.ingestion_payload_budget() returns trigger
language plpgsql security definer set search_path='' as $$
declare delta bigint:=0;
begin
 if tg_op<>'DELETE' then delta:=octet_length(to_jsonb(new)::text); end if;
 if tg_op<>'INSERT' then delta:=delta-octet_length(to_jsonb(old)::text); end if;
 update private.ingestion_pilot_control set payload_bytes=payload_bytes+delta where singleton;
 if tg_op='DELETE' then return old; end if;return new;
end; $$;
revoke all on function private.ingestion_payload_budget() from public,anon,authenticated,service_role;
create trigger ingestion_submission_budget after insert or update or delete on private.ingestion_submissions for each row execute function private.ingestion_payload_budget();
create trigger ingestion_source_budget after insert or update or delete on private.ingestion_sources for each row execute function private.ingestion_payload_budget();
create trigger ingestion_revision_budget after insert or update or delete on private.ingestion_revisions for each row execute function private.ingestion_payload_budget();
create trigger ingestion_event_budget after insert or update or delete on private.ingestion_events for each row execute function private.ingestion_payload_budget();

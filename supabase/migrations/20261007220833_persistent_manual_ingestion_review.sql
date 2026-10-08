-- Phase 1 private staging only. No canonical sports tables or publishers.
create function private.ingestion_allowed(actor uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.is_active_member(actor) and exists(select 1 from public.user_roles where user_id=actor and role in ('admin','moderator'));
$$;
revoke all on function private.ingestion_allowed(uuid) from public,anon,authenticated;

create table private.ingestion_submissions (
 id uuid primary key, creator uuid not null,
 school_slug text not null, season integer not null check(season between 2000 and 9999),
 data_class text not null check(data_class in ('schedule','roster','game_stats')),
 operation text not null check(operation in ('create','update','correct')),
 state text not null default 'draft' check(state in ('draft','ready_for_review','approved','rejected')),
 revision integer not null default 0, review_hash text,
 approved_revision integer, approved_hash text,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create table private.ingestion_sources (
 id uuid primary key, submission_id uuid not null references private.ingestion_submissions(id),
 owner_id uuid not null, kind text not null check(kind in ('form','json','csv','text','image')),
 label text not null check(length(label) between 1 and 300), body text check(octet_length(body)<=262144),
 object_path text unique, preview_path text unique, sha256 text, mime text, bytes integer,
 state text not null check(state in ('reserved','finalized','deleted','failed')),
 created_at timestamptz not null default clock_timestamp(), deleted_at timestamptz,
 check(kind<>'image' or (object_path=owner_id::text||'/'||submission_id::text||'/'||id::text||'/original' and preview_path=owner_id::text||'/'||submission_id::text||'/'||id::text||'/preview.webp')),
 check(bytes is null or bytes between 1 and 5242880),
 check(kind='image' or state<>'finalized' or (body is not null and octet_length(body)>0)),
 check(kind<>'image' or state<>'finalized' or (sha256 is not null and sha256 ~ '^[a-f0-9]{64}$' and mime is not null and mime in ('image/jpeg','image/png','image/webp') and bytes is not null))
);
create unique index ingestion_image_digest on private.ingestion_sources(submission_id,sha256) where kind='image' and state='finalized';
create table private.ingestion_revisions (
 submission_id uuid not null references private.ingestion_submissions(id), revision integer not null,
 review_hash text not null, draft jsonb not null, source_snapshot jsonb not null,
 validation jsonb not null, actor uuid not null, created_at timestamptz not null default clock_timestamp(),
 primary key(submission_id,revision)
);
create table private.ingestion_events (
 id bigint generated always as identity primary key, submission_id uuid not null references private.ingestion_submissions(id),
 request_id uuid not null, actor uuid not null, command text not null,
 revision integer not null, review_hash text, reason text, snapshot jsonb,
 created_at timestamptz not null default clock_timestamp(), unique(submission_id,request_id)
);
create function private.ingestion_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception using errcode='42501',message='Ingestion history is append-only'; end; $$;
revoke all on function private.ingestion_immutable() from public,anon,authenticated,service_role;
create trigger ingestion_revisions_immutable before update or delete on private.ingestion_revisions for each row execute function private.ingestion_immutable();
create trigger ingestion_events_immutable before update or delete on private.ingestion_events for each row execute function private.ingestion_immutable();
alter table private.ingestion_submissions enable row level security;
alter table private.ingestion_sources enable row level security;
alter table private.ingestion_revisions enable row level security;
alter table private.ingestion_events enable row level security;
revoke all on private.ingestion_submissions,private.ingestion_sources,private.ingestion_revisions,private.ingestion_events from public,anon,authenticated,service_role;
revoke all on sequence private.ingestion_events_id_seq from public,anon,authenticated,service_role;

-- Actor UUIDs are immutable audit identifiers, deliberately not profile FKs:
-- existing account deletion must not be blocked or cascade into review history.
-- Authenticated read RPC; moderator review scope is global, as existing roster review.
create function public.ingestion_read(p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if p_id is null then return coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at desc) from private.ingestion_submissions s),'[]'); end if;
 return (select to_jsonb(s)||jsonb_build_object(
 'current',(select to_jsonb(r) from private.ingestion_revisions r where r.submission_id=s.id and r.revision=s.revision),
 'sources',coalesce((select jsonb_agg(to_jsonb(src) order by src.created_at) from private.ingestion_sources src where src.submission_id=s.id),'[]'),
 'history',coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from private.ingestion_events e where e.submission_id=s.id),'[]'))
 from private.ingestion_submissions s where s.id=p_id);
end; $$;
revoke all on function public.ingestion_read(uuid) from public,anon;
grant execute on function public.ingestion_read(uuid) to authenticated;

-- One statement captures managed authority and a reproducible database version.
create function public.ingestion_roster_catalog() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.ingestion_allowed(auth.uid()) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 return (select jsonb_build_object('version',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')),'rows',coalesce(jsonb_agg(to_jsonb(t) order by id),'[]')) from public.school_roster_players t);
end; $$;
revoke all on function public.ingestion_roster_catalog() from public,anon;
grant execute on function public.ingestion_roster_catalog() to authenticated;

-- Only the trusted application may submit normalized payloads/validation. Actor is
-- derived from the authenticated request there and checked again here.
create function public.ingestion_mutate(p_actor uuid,p_id uuid,p_command text,p_revision integer,p_hash text,p_request uuid,
 p_payload jsonb default '{}'::jsonb,p_reason text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.ingestion_submissions%rowtype; old private.ingestion_events%rowtype; r private.ingestion_revisions%rowtype;
 src private.ingestion_sources%rowtype; sources jsonb; newhash text; nextrev integer; decision jsonb;
begin
 if not private.ingestion_allowed(p_actor) then raise exception using errcode='42501',message='Active internal reviewer required'; end if;
 if p_command='create' then
  if p_revision<>0 or p_hash is not null or p_payload->>'school' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid creation context'; end if;
  insert into private.ingestion_submissions(id,creator,school_slug,season,data_class,operation)
   values(p_id,p_actor,p_payload->>'school',(p_payload->>'season')::integer,p_payload->>'class',p_payload->>'operation') on conflict do nothing;
 end if;
 select * into s from private.ingestion_submissions where id=p_id for update;
 if not found then raise exception 'Submission not found'; end if;
 select * into old from private.ingestion_events where submission_id=p_id and request_id=p_request;
 if found then
  if old.actor<>p_actor or old.command<>p_command or old.snapshot->'request' is distinct from jsonb_build_object('revision',p_revision,'hash',p_hash,'payload',p_payload,'reason',p_reason) then raise exception 'Idempotency key reused with different input'; end if;
  -- A retry never authorizes exporting an obsolete snapshot.
  if p_command='export' then
   lock table public.school_roster_players in share mode;
   select * into r from private.ingestion_revisions where submission_id=p_id and revision=s.revision;
   if r.validation->>'managedRosterVersion' is distinct from (select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.school_roster_players t) or exists(select 1 from private.ingestion_sources where submission_id=p_id and state='reserved') then raise exception 'Validation/evidence changed'; end if;
  end if;
  if p_command='export' and (s.state<>'approved' or s.revision<>old.revision or s.review_hash<>old.review_hash) then raise exception 'Approved snapshot is stale'; end if;
  if p_command='export' and exists(select 1 from private.ingestion_sources evidence where evidence.submission_id=p_id and evidence.kind='image' and evidence.state='finalized' and (not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=evidence.object_path) or not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=evidence.preview_path))) then raise exception 'Source deleted or missing'; end if;
  return old.snapshot->'result';
 end if;
 if s.revision<>p_revision or s.review_hash is distinct from p_hash then raise exception using errcode='40001',message='Stale revision/hash; reload and reconcile'; end if;
 if s.state='rejected' and p_command not in ('reopen','delete_source','fail_source') then raise exception 'Rejected submission must be reopened'; end if;
 if p_command in ('create','save') then
  if p_payload->'draft'->>'draftId' is distinct from p_id::text or p_payload->'draft'->>'schoolSlug' is distinct from s.school_slug or (p_payload->'draft'->>'season')::integer is distinct from s.season or p_payload->'draft'->>'operation' is distinct from s.operation
   or coalesce(p_payload->'draft'->'values'->>'dataClass',p_payload->'draft'->>'dataClass') is distinct from s.data_class then raise exception 'Immutable submission scope mismatch'; end if;
  if s.operation='correct' and s.revision>0 then
   select * into r from private.ingestion_revisions where submission_id=p_id and revision=s.revision;
   if r.draft->'target'->'match'->>'id' is distinct from p_payload->'draft'->'target'->'match'->>'id' or r.draft->'target'->'expectedRevision' is distinct from p_payload->'draft'->'target'->'expectedRevision' or r.draft->'values'->'current' is distinct from p_payload->'draft'->'values'->'current' then raise exception 'Correction baseline/target is immutable'; end if;
  end if;
  if p_payload ? 'source' then
   if p_payload->'source'->>'kind'='image' then
    select * into src from private.ingestion_sources where id=(p_payload->'source'->>'id')::uuid and submission_id=p_id and owner_id=p_actor for update;
    if not found or src.state<>'reserved' then raise exception 'Upload reservation missing'; end if;
    if not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=src.object_path)
      or not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=src.preview_path) then raise exception 'Missing evidence objects'; end if;
    update private.ingestion_sources set state='finalized',sha256=p_payload->'source'->>'sha256',bytes=(p_payload->'source'->>'bytes')::integer,mime=p_payload->'source'->>'mime' where id=src.id;
   else
    insert into private.ingestion_sources(id,submission_id,owner_id,kind,label,body,state,sha256)
     values((p_payload->'source'->>'id')::uuid,p_id,p_actor,p_payload->'source'->>'kind',p_payload->'source'->>'label',p_payload->'source'->>'body','finalized',encode(extensions.digest(convert_to(coalesce(p_payload->'source'->>'body',''),'UTF8'),'sha256'),'hex'));
   end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') into sources from private.ingestion_sources x where submission_id=p_id and state='finalized';
  if exists(select 1 from jsonb_array_elements(p_payload->'draft'->'sources') ref where not exists(select 1 from private.ingestion_sources x where x.id=(ref->>'sourceId')::uuid and x.submission_id=p_id and x.state='finalized' and x.kind=ref->>'kind')) then raise exception 'Draft source scope mismatch'; end if;
  if jsonb_array_length(sources)=0 or coalesce(jsonb_array_length(p_payload->'draft'->'sources'),0)=0 then raise exception 'Source evidence required'; end if;
  newhash:=encode(extensions.digest(convert_to(jsonb_build_object('draft',p_payload->'draft','sources',sources,'validation',p_payload->'validation')::text,'UTF8'),'sha256'),'hex');
  nextrev:=s.revision+1;
  insert into private.ingestion_revisions values(p_id,nextrev,newhash,p_payload->'draft',sources,p_payload->'validation',p_actor,clock_timestamp());
  update private.ingestion_submissions set revision=nextrev,review_hash=newhash,state='draft',approved_revision=null,approved_hash=null,updated_at=clock_timestamp() where id=p_id returning * into s;
 elsif p_command='reserve' then
  if s.state not in ('draft','ready_for_review','approved') then raise exception 'Cannot reserve evidence'; end if;
  if (select count(*) from private.ingestion_sources where submission_id=p_id and kind='image' and state in ('reserved','finalized'))>=3 then raise exception 'At most three images per submission'; end if;
  src.id:=(p_payload->>'id')::uuid;
  insert into private.ingestion_sources(id,submission_id,owner_id,kind,label,state,object_path,preview_path)
   values(src.id,p_id,p_actor,'image',p_payload->>'label','reserved',p_actor::text||'/'||p_id::text||'/'||src.id::text||'/original',p_actor::text||'/'||p_id::text||'/'||src.id::text||'/preview.webp');
 elsif p_command in ('delete_source','fail_source') then
  if nullif(trim(p_reason),'') is null then raise exception 'Reason required'; end if;
  select * into src from private.ingestion_sources where submission_id=p_id and id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'Unknown source'; end if;
  update private.ingestion_sources set state=case when p_command='fail_source' then 'failed' else 'deleted' end,deleted_at=clock_timestamp() where id=src.id;
  update private.ingestion_submissions set state=case when state='rejected' then 'rejected' else 'draft' end,approved_revision=null,approved_hash=null,revision=revision+1,review_hash=null,updated_at=clock_timestamp() where id=p_id returning * into s;
  -- Keep typed work available while denying readiness until a fresh save.
  select * into r from private.ingestion_revisions where submission_id=p_id and revision=p_revision;
  if r.submission_id is not null then insert into private.ingestion_revisions values(p_id,s.revision,r.review_hash,r.draft,r.source_snapshot,r.validation||jsonb_build_object('reviewable',false,'blocking',jsonb_build_array('Evidence changed; save and revalidate')),p_actor,clock_timestamp()); end if;
 elsif p_command in ('ready','approve','reject','reopen','export') then
  if p_command in ('ready','approve') and nullif(trim(p_reason),'') is null then raise exception 'Review disposition reason required'; end if;
  if p_command='reopen' then
   if s.state<>'rejected' or nullif(trim(p_reason),'') is null then raise exception 'Reopen requires rejected state and reason'; end if;
  elsif p_command='reject' then
   if s.state not in ('draft','ready_for_review') or nullif(trim(p_reason),'') is null then raise exception 'Reject requires draft/ready and reason'; end if;
  else
   if exists(select 1 from private.ingestion_sources where submission_id=p_id and state='reserved') then raise exception 'Pending evidence reservation requires completion or audited cleanup'; end if;
   select * into r from private.ingestion_revisions where submission_id=p_id and revision=s.revision;
   -- Freeze only existing roster authority while comparing the validation input; no canonical write.
   lock table public.school_roster_players in share mode;
   if r.validation->>'managedRosterVersion' is distinct from (select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.school_roster_players t) then raise exception 'Canonical roster changed; save and revalidate'; end if;
   if r.submission_id is null or r.review_hash<>s.review_hash or coalesce(r.validation->>'reviewable','false')<>'true' or p_payload->>'validationHash' is distinct from r.validation->>'validationHash' then raise exception 'Valid current server validation required'; end if;
   if exists(select 1 from jsonb_array_elements(r.source_snapshot) x left join private.ingestion_sources evidence on evidence.id=(x->>'id')::uuid
    where evidence.state is distinct from 'finalized' or (evidence.kind='image' and (not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=evidence.object_path) or not exists(select 1 from storage.objects where bucket_id='ingestion-evidence' and name=evidence.preview_path)))) then raise exception 'Source deleted or missing'; end if;
   if p_command='ready' and s.state<>'draft' then raise exception 'Readiness requires draft state'; end if;
   if p_command='approve' and s.state<>'ready_for_review' then raise exception 'Approval requires ready state'; end if;
   if p_command='export' and (s.state<>'approved' or s.approved_revision<>s.revision or s.approved_hash<>s.review_hash) then raise exception 'Export requires exact approved snapshot'; end if;
  end if;
  if p_command<>'export' then
   update private.ingestion_submissions set state=case p_command when 'ready' then 'ready_for_review' when 'approve' then 'approved' when 'reject' then 'rejected' else 'draft' end,
    revision=revision+1,approved_revision=case when p_command='approve' then revision+1 else null end,
    approved_hash=case when p_command='approve' then review_hash else null end,updated_at=clock_timestamp() where id=p_id returning * into s;
   -- Every state change advances the optimistic token, preventing stale rejected-state approval.
   if r.submission_id is null then select * into r from private.ingestion_revisions where submission_id=p_id and revision=p_revision; end if;
   if r.submission_id is not null then insert into private.ingestion_revisions values(p_id,s.revision,r.review_hash,r.draft,r.source_snapshot,r.validation,p_actor,clock_timestamp()); end if;
  end if;
 else raise exception 'Unsupported ingestion operation';
 end if;
 decision:=jsonb_build_object('id',s.id,'revision',s.revision,'hash',s.review_hash,'state',s.state);
 if p_command='export' then decision:=decision||jsonb_build_object('approvedSnapshot',r.draft,'sources',r.source_snapshot,'actor',p_actor,'exportedAt',clock_timestamp(),'class',s.data_class,'operation',s.operation,'submission',s.id); end if;
 insert into private.ingestion_events(submission_id,request_id,actor,command,revision,review_hash,reason,snapshot)
  values(p_id,p_request,p_actor,p_command,s.revision,s.review_hash,p_reason,jsonb_build_object('request',jsonb_build_object('revision',p_revision,'hash',p_hash,'payload',p_payload,'reason',p_reason),'result',decision));
 return decision;
end; $$;
revoke all on function public.ingestion_mutate(uuid,uuid,text,integer,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.ingestion_mutate(uuid,uuid,text,integer,text,uuid,jsonb,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('ingestion-evidence','ingestion-evidence',false,5242880,array['image/jpeg','image/png','image/webp']);
create function private.ingestion_object_allowed(path text,writing boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select private.ingestion_allowed(auth.uid()) and exists(select 1 from private.ingestion_sources s where (s.object_path=path or s.preview_path=path)
 and (case when writing then s.owner_id=auth.uid() and s.state='reserved' else s.state='finalized' end));
$$;
revoke all on function private.ingestion_object_allowed(text,boolean) from public,anon;
grant execute on function private.ingestion_object_allowed(text,boolean) to authenticated;
create policy ingestion_evidence_insert on storage.objects for insert to authenticated
 with check(bucket_id='ingestion-evidence' and private.ingestion_object_allowed(name,true));
create policy ingestion_evidence_read on storage.objects for select to authenticated
 using(bucket_id='ingestion-evidence' and private.ingestion_object_allowed(name,false));
-- No UPDATE/upsert policy: original bytes cannot be replaced.
create function private.ingestion_object_cleanup(path text) returns boolean
language sql stable security definer set search_path='' as $$
 select private.ingestion_allowed(auth.uid()) and exists(select 1 from private.ingestion_sources s where (s.object_path=path or s.preview_path=path) and s.state in ('failed','deleted'));
$$;
revoke all on function private.ingestion_object_cleanup(text) from public,anon;
grant execute on function private.ingestion_object_cleanup(text) to authenticated;
create policy ingestion_evidence_cleanup on storage.objects for delete to authenticated
 using(bucket_id='ingestion-evidence' and private.ingestion_object_cleanup(name));

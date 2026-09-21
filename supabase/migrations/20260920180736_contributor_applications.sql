create table public.contributor_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  school_slug text not null check (char_length(school_slug) between 2 and 120),
  requested_role text not null check (requested_role in ('scorekeeper', 'coach')),
  affiliation text not null check (char_length(affiliation) between 2 and 160),
  contact_detail text not null check (char_length(contact_detail) between 3 and 240),
  experience_note text not null check (char_length(experience_note) between 20 and 1500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'deferred', 'withdrawn')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 1000)
);

create unique index contributor_applications_active_idx
  on public.contributor_applications(applicant_id, school_slug)
  where status in ('pending', 'deferred');
create index contributor_applications_review_idx
  on public.contributor_applications(status, submitted_at);

alter table public.contributor_applications enable row level security;
revoke all on public.contributor_applications from public, anon, authenticated;
grant select, insert, update on public.contributor_applications to authenticated;

create policy "Members read own contributor applications"
on public.contributor_applications for select to authenticated
using ((select auth.uid()) = applicant_id);

create policy "Members submit contributor applications"
on public.contributor_applications for insert to authenticated
with check (
  (select auth.uid()) = applicant_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and review_note is null
);

create policy "Admins read contributor applications"
on public.contributor_applications for select to authenticated
using ((select private.has_role('admin'::public.user_role)));

create policy "Admins review contributor applications"
on public.contributor_applications for update to authenticated
using ((select private.has_role('admin'::public.user_role)))
with check ((select private.has_role('admin'::public.user_role)));

create or replace function public.review_contributor_application(
  target_application_id uuid,
  decision text,
  note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  application_record record;
  target_status text;
  clean_note text := nullif(left(trim(coalesce(note, '')), 1000), '');
begin
  if actor_id is null or not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Admin access required.';
  end if;
  if decision not in ('approve', 'decline', 'defer') then
    raise exception using errcode = '22023', message = 'Invalid application decision.';
  end if;

  select * into application_record
  from public.contributor_applications
  where id = target_application_id
  for update;

  if not found then raise exception using errcode = 'P0002', message = 'Contributor application not found.'; end if;
  if application_record.status not in ('pending', 'deferred') then
    raise exception using errcode = '55000', message = 'This application has already been resolved.';
  end if;

  target_status := case decision when 'approve' then 'approved' when 'decline' then 'declined' else 'deferred' end;

  if decision = 'approve' then
    insert into public.user_roles (user_id, role, granted_by)
    values (application_record.applicant_id, 'scorekeeper'::public.user_role, actor_id)
    on conflict (user_id, role) do update set granted_by = excluded.granted_by, granted_at = now();

    insert into public.contributor_school_assignments
      (user_id, school_slug, assignment_role, active, assigned_by)
    values
      (application_record.applicant_id, application_record.school_slug, application_record.requested_role, true, actor_id)
    on conflict (user_id, school_slug) do update set
      assignment_role = excluded.assignment_role,
      active = true,
      assigned_by = excluded.assigned_by,
      updated_at = now();
  end if;

  update public.contributor_applications
  set status = target_status, reviewed_by = actor_id, reviewed_at = now(), review_note = clean_note
  where id = target_application_id;

  return jsonb_build_object(
    'application_id', target_application_id,
    'applicant_id', application_record.applicant_id,
    'school_slug', application_record.school_slug,
    'decision', decision
  );
end;
$$;

revoke all on function public.review_contributor_application(uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_contributor_application(uuid, text, text) to authenticated;

-- Prevent a pre-suspension JWT from reading member-only data directly.
-- Public football content retains its existing public read policies.

drop policy "Users can read own roles" on public.user_roles;
create policy "Active users can read own roles"
on public.user_roles for select
to authenticated
using (
  (select private.is_active_member())
  and (
    user_id = (select auth.uid())
    or (select private.can_moderate_scores())
  )
);

drop policy "Contributors can read own school assignments"
on public.contributor_school_assignments;
create policy "Active contributors can read own school assignments"
on public.contributor_school_assignments for select
to authenticated
using (
  (select private.is_active_member())
  and (
    user_id = (select auth.uid())
    or (select private.can_moderate_scores())
  )
);

drop policy "Users can read own score submissions" on public.score_submissions;
create policy "Active users can read own score submissions"
on public.score_submissions for select
to authenticated
using (
  (select private.is_active_member())
  and (
    submitted_by = (select auth.uid())
    or (select private.can_moderate_scores())
  )
);

drop policy "Users can read events for visible submissions"
on public.score_submission_events;
create policy "Active users can read events for visible submissions"
on public.score_submission_events for select
to authenticated
using (
  (select private.is_active_member())
  and exists (
    select 1
    from public.score_submissions submissions
    where submissions.id = score_submission_events.submission_id
      and (
        submissions.submitted_by = (select auth.uid())
        or (select private.can_moderate_scores())
      )
  )
);

drop policy "Users can read own picks" on public.pickem_picks;
create policy "Active users can read own picks"
on public.pickem_picks for select
to authenticated
using (
  (select private.is_active_member())
  and (
    user_id = (select auth.uid())
    or (select private.can_moderate_scores())
  )
);

drop policy "Members can read own school follows" on public.school_follows;
create policy "Active members can read own school follows"
on public.school_follows for select
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

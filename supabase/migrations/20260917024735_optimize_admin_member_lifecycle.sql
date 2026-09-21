-- Follow-up hardening for lifecycle indexes, policy evaluation, and legacy RPC grants.

create index member_account_status_suspended_by_idx
  on public.member_account_status(suspended_by)
  where suspended_by is not null;

create index admin_member_lifecycle_events_actor_idx
  on public.admin_member_lifecycle_events(actor_user_id, created_at desc)
  where actor_user_id is not null;

drop policy "Members can read own account status" on public.member_account_status;
create policy "Members can read own account status"
on public.member_account_status for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'::public.user_role))
);

drop policy "Active admins can read lifecycle events" on public.admin_member_lifecycle_events;
create policy "Active admins can read lifecycle events"
on public.admin_member_lifecycle_events for select
to authenticated
using ((select private.has_role('admin'::public.user_role)));

drop policy "Active users can update their own profile" on public.profiles;
create policy "Active users can update their own profile"
on public.profiles for update
to authenticated
using (
  id = (select auth.uid())
  and (select private.is_active_member())
)
with check (
  id = (select auth.uid())
  and (select private.is_active_member())
);

drop policy "Active users can submit scores" on public.score_submissions;
create policy "Active users can submit scores"
on public.score_submissions for insert
to authenticated
with check (
  (select private.is_active_member())
  and submitted_by = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy "Active users can create own picks" on public.pickem_picks;
create policy "Active users can create own picks"
on public.pickem_picks for insert
to authenticated
with check (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

drop policy "Active users can update own ungraded picks" on public.pickem_picks;
create policy "Active users can update own ungraded picks"
on public.pickem_picks for update
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
  and is_correct is null
)
with check (
  (select private.is_active_member())
  and user_id = (select auth.uid())
  and is_correct is null
);

drop policy "Active members can create own school follows" on public.school_follows;
create policy "Active members can create own school follows"
on public.school_follows for insert
to authenticated
with check (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

drop policy "Active members can delete own school follows" on public.school_follows;
create policy "Active members can delete own school follows"
on public.school_follows for delete
to authenticated
using (
  (select private.is_active_member())
  and user_id = (select auth.uid())
);

drop policy "Active admins moderators and assigned coaches can add roster players"
on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can add roster players"
on public.school_roster_players for insert
to authenticated
with check (
  (select private.is_active_member())
  and (
    (select private.has_role('admin'::public.user_role))
    or (select private.has_role('moderator'::public.user_role))
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = (select auth.uid())
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

drop policy "Active admins moderators and assigned coaches can update roster player"
on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can update roster player"
on public.school_roster_players for update
to authenticated
using (
  (select private.is_active_member())
  and (
    (select private.has_role('admin'::public.user_role))
    or (select private.has_role('moderator'::public.user_role))
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = (select auth.uid())
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
)
with check (
  (select private.is_active_member())
  and (
    (select private.has_role('admin'::public.user_role))
    or (select private.has_role('moderator'::public.user_role))
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = (select auth.uid())
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

drop policy "Active admins moderators and assigned coaches can remove roster player"
on public.school_roster_players;
create policy "Active admins moderators and assigned coaches can remove roster player"
on public.school_roster_players for delete
to authenticated
using (
  (select private.is_active_member())
  and (
    (select private.has_role('admin'::public.user_role))
    or (select private.has_role('moderator'::public.user_role))
    or exists (
      select 1
      from public.contributor_school_assignments csa
      where csa.user_id = (select auth.uid())
        and csa.school_slug = school_roster_players.school_slug
        and csa.assignment_role = 'coach'
        and csa.active = true
    )
  )
);

-- The role RPC already verifies an active admin internally. Keep its exposed
-- execution surface to authenticated callers only after a prior replacement
-- reset its grants to defaults.
revoke execute on function public.admin_set_user_role(uuid, public.user_role, boolean)
  from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.user_role, boolean)
  to authenticated;

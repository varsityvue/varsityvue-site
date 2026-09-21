create policy "Active roster managers can read managed roster players"
on public.school_roster_players
for select
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

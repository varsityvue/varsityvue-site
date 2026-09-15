drop policy if exists "Admins and assigned coaches can add roster players" on public.school_roster_players;
create policy "Admins moderators and assigned coaches can add roster players"
on public.school_roster_players
for insert
to authenticated
with check (
  private.has_role('admin'::public.user_role)
  or private.has_role('moderator'::public.user_role)
  or exists (
    select 1
    from public.contributor_school_assignments csa
    where csa.user_id = auth.uid()
      and csa.school_slug = school_roster_players.school_slug
      and csa.assignment_role = 'coach'
      and csa.active = true
  )
);

drop policy if exists "Admins and assigned coaches can update roster players" on public.school_roster_players;
create policy "Admins moderators and assigned coaches can update roster players"
on public.school_roster_players
for update
to authenticated
using (
  private.has_role('admin'::public.user_role)
  or private.has_role('moderator'::public.user_role)
  or exists (
    select 1
    from public.contributor_school_assignments csa
    where csa.user_id = auth.uid()
      and csa.school_slug = school_roster_players.school_slug
      and csa.assignment_role = 'coach'
      and csa.active = true
  )
)
with check (
  private.has_role('admin'::public.user_role)
  or private.has_role('moderator'::public.user_role)
  or exists (
    select 1
    from public.contributor_school_assignments csa
    where csa.user_id = auth.uid()
      and csa.school_slug = school_roster_players.school_slug
      and csa.assignment_role = 'coach'
      and csa.active = true
  )
);

drop policy if exists "Admins and assigned coaches can remove roster players" on public.school_roster_players;
create policy "Admins moderators and assigned coaches can remove roster players"
on public.school_roster_players
for delete
to authenticated
using (
  private.has_role('admin'::public.user_role)
  or private.has_role('moderator'::public.user_role)
  or exists (
    select 1
    from public.contributor_school_assignments csa
    where csa.user_id = auth.uid()
      and csa.school_slug = school_roster_players.school_slug
      and csa.assignment_role = 'coach'
      and csa.active = true
  )
);

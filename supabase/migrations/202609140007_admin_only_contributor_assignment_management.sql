-- Restrict contributor school assignment mutations to admins.
-- Moderators may continue to read assignments while reviewing score reports.

drop policy if exists "Moderators manage contributor school assignments"
on public.contributor_school_assignments;

create policy "Admins manage contributor school assignments"
on public.contributor_school_assignments for all
to authenticated
using (private.has_role('admin'))
with check (private.has_role('admin'));

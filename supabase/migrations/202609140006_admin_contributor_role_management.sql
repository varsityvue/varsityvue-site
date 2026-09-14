-- Allow admins to grant/revoke the scorekeeper role used by contributor access.

create policy "Admins can grant scorekeeper role"
on public.user_roles for insert
to authenticated
with check (private.has_role('admin') and role = 'scorekeeper');

create policy "Admins can revoke scorekeeper role"
on public.user_roles for delete
to authenticated
using (private.has_role('admin') and role = 'scorekeeper');

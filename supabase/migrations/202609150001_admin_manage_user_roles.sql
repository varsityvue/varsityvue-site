-- Admin-only role management that preserves RLS on public.user_roles.
-- The function executes with definer privileges but verifies the caller's
-- authenticated admin role before changing any member access.

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  target_role public.user_role,
  enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  if target_role not in ('member'::public.user_role, 'scorekeeper'::public.user_role, 'moderator'::public.user_role) then
    raise exception 'This role cannot be managed here';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Member not found';
  end if;

  if enabled then
    insert into public.user_roles (user_id, role, granted_by)
    values (target_user_id, target_role, auth.uid())
    on conflict (user_id, role) do update
      set granted_by = excluded.granted_by,
          granted_at = now();
  else
    if target_role = 'member'::public.user_role then
      raise exception 'Member is the base account role and cannot be removed';
    end if;

    delete from public.user_roles
    where user_id = target_user_id
      and role = target_role;
  end if;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.user_role, boolean) from public;
grant execute on function public.admin_set_user_role(uuid, public.user_role, boolean) to authenticated;

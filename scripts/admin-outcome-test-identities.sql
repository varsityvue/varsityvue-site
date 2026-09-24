insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ordinary@varsityvue.invalid', crypt('local-only-member', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'moderator@varsityvue.invalid', crypt('local-only-moderator', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'administrator@varsityvue.invalid', crypt('local-only-administrator', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.user_roles (user_id, role, granted_by)
values
  ('10000000-0000-4000-8000-000000000002', 'moderator', '10000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000003', 'admin', '10000000-0000-4000-8000-000000000003')
on conflict (user_id, role) do nothing;

do $$
begin
  if (select count(*) from auth.users where id::text like '10000000-0000-4000-8000-%') <> 3 then
    raise exception 'Expected exactly three local synthetic identities';
  end if;
  if (select count(*) from public.user_roles where user_id='10000000-0000-4000-8000-000000000001' and role='member') <> 1
    or exists (select 1 from public.user_roles where user_id='10000000-0000-4000-8000-000000000001' and role in ('moderator','admin')) then
    raise exception 'Ordinary member role shape is invalid';
  end if;
  if not exists (select 1 from public.user_roles where user_id='10000000-0000-4000-8000-000000000002' and role='moderator')
    or exists (select 1 from public.user_roles where user_id='10000000-0000-4000-8000-000000000002' and role='admin') then
    raise exception 'Moderator role shape is invalid';
  end if;
  if not exists (select 1 from public.user_roles where user_id='10000000-0000-4000-8000-000000000003' and role='admin') then
    raise exception 'Administrator role shape is invalid';
  end if;
  if exists (select 1 from public.member_account_status where user_id::text like '10000000-0000-4000-8000-%' and status <> 'active') then
    raise exception 'Synthetic identities must be active';
  end if;
end
$$;

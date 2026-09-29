-- Username is a secondary identifier. No existing display names or contest rows change.
alter table public.profiles add column username_changed_at timestamptz;
alter table public.profiles drop constraint profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username collate "C" ~ '^[a-z0-9_]{3,30}$');
create unique index profiles_username_lower_unique on public.profiles (lower(username));

create table private.username_change_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  old_username text,
  new_username text not null,
  changed_at timestamptz not null
);
create index username_change_events_user_time_idx
  on private.username_change_events (user_id, changed_at desc);
alter table private.username_change_events enable row level security;
revoke all on private.username_change_events from public, anon, authenticated;
revoke all on sequence private.username_change_events_id_seq from public, anon, authenticated;

create function private.enforce_profile_username() returns trigger
language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare
  canonical text;
begin
  if new.username_changed_at is distinct from old.username_changed_at then
    raise exception 'username_changed_at is database controlled' using errcode = '22023';
  end if;

  if new.username is not distinct from old.username then
    return new;
  end if;
  if old.username is not null and new.username is null then
    raise exception 'Username cannot be cleared' using errcode = '22023';
  end if;
  if btrim(new.username) collate "C" !~ '^[A-Za-z0-9_]{3,30}$' then
    raise exception 'Invalid username' using errcode = '22023';
  end if;
  canonical := lower(btrim(new.username));
  if canonical in ('varsityvue', 'admin', 'administrator', 'moderator', 'support', 'official') then
    raise exception 'Reserved username' using errcode = '22023';
  end if;
  if canonical = old.username then
    raise exception 'Username is unchanged' using errcode = '22023';
  end if;
  if old.username is not null then
    if old.username_changed_at is not null
       and transaction_timestamp() < old.username_changed_at + interval '30 days' then
      raise exception 'Username change cooldown active' using errcode = '22023';
    end if;
    new.username_changed_at := transaction_timestamp();
  else
    new.username_changed_at := null;
  end if;
  new.username := canonical;
  insert into private.username_change_events (user_id, old_username, new_username, changed_at)
  values (old.id, old.username, canonical, transaction_timestamp());
  return new;
end;
$$;
revoke all on function private.enforce_profile_username() from public, anon, authenticated;
create trigger profiles_enforce_username before update on public.profiles
for each row execute function private.enforce_profile_username();

-- All profile writers, including direct API calls, go through the trigger.
-- A fresh claim bypasses the rename timer exactly once; a rename sets the timer.

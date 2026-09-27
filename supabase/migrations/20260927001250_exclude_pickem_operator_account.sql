-- Forward-only adjustment to the already-tested completed-entry RPC. Fail closed
-- if its expected source changes, rather than replacing a different function.
do $$
declare
  definition text;
  old_guard text := E'if exists (select 1 from public.user_roles r where r.user_id = entrant and r.role in (''admin'', ''moderator'')) then\n    raise exception ''Contest operator accounts are ineligible'';\n  end if;';
  new_guard text := E'if entrant = ''92d45311-2133-4694-bd03-93ce8299bed9''::uuid then\n    raise exception ''The contest operator is ineligible'';\n  end if;';
begin
  select pg_get_functiondef('public.submit_pickem_contest_entry(uuid,text,integer,jsonb,boolean)'::regprocedure)
    into definition;
  if position(old_guard in definition) = 0
     or position(old_guard in substr(definition, position(old_guard in definition) + length(old_guard))) > 0
     or position(new_guard in definition) > 0 then
    raise exception 'Unexpected Pick Em submission function; review operator exclusion before migrating';
  end if;
  execute replace(definition, old_guard, new_guard);
end $$;

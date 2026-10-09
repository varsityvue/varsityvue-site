-- Refresh only the accepted schedule fingerprint; keep historical aggregates.
-- This does not install analytics when the dormant base migration is absent.
do $catalog$
declare
  validator oid := to_regprocedure('private.record_coverage_demand_summary(jsonb)');
  definition text;
  old_predicate constant text := $old$s->>'schedule_catalog_version'<>'schedule-1692cf167930'$old$;
  new_predicate constant text := $new$s->>'schedule_catalog_version'<>'schedule-b0c0555adaf6'$new$;
  metadata_before jsonb;
begin
  if validator is null then return; end if;
  select pg_get_functiondef(validator), to_jsonb(p) - 'prosrc'
  into definition, metadata_before from pg_proc p where oid = validator;
  if strpos(definition, $schema$s->>'schema_version'<>'2'$schema$) = 0 then
    raise exception 'Unexpected coverage summary schema; catalog refresh aborted';
  end if;
  if strpos(definition, old_predicate) > 0 then
    execute replace(definition, old_predicate, new_predicate);
  elsif strpos(definition, new_predicate) = 0 then
    raise exception 'Unexpected schedule catalog contract; catalog refresh aborted';
  end if;
  if metadata_before is distinct from (
    select to_jsonb(p) - 'prosrc' from pg_proc p where oid = validator
  ) then
    raise exception 'Coverage function metadata changed; catalog refresh rolled back';
  end if;
end;
$catalog$;

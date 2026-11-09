-- Owner approval required before applying to production.
-- Apply alongside the app release before operating live score entry.
-- Catalog slots are score-entry identities. Neutral-site sideline assignments
-- should be verified separately before reporting them as official.
begin;

create temporary table playoff_identities (like private.canonical_game_identity including constraints) on commit drop;

insert into playoff_identities (game_id, away_school_slug, home_school_slug) values
  ('de-leon-vs-alvord-2026-bi-district', 'alvord', 'de-leon'),
  ('cisco-vs-nocona-2026-bi-district', 'nocona', 'cisco'),
  ('goldthwaite-vs-hubbard-2026-bi-district', 'hubbard', 'goldthwaite'),
  ('albany-vs-crawford-2026-bi-district', 'crawford', 'albany'),
  ('stephenville-vs-navasota-2026-bi-district', 'navasota', 'stephenville'),
  ('tioga-vs-anson-2026-bi-district', 'anson', 'tioga'),
  ('muenster-vs-hawley-2026-bi-district', 'hawley', 'muenster');

insert into private.canonical_game_identity (game_id, away_school_slug, home_school_slug)
select game_id, away_school_slug, home_school_slug
from playoff_identities
on conflict (game_id) do nothing;

do $$
begin
  if exists (
    select game_id, away_school_slug, home_school_slug from playoff_identities
    except
    select game_id, away_school_slug, home_school_slug from private.canonical_game_identity
  ) then
    raise exception 'Playoff game identity conflicts with existing score-entry slots';
  end if;
end $$;

commit;

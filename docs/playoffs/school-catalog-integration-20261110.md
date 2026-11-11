# Playoff school catalog integration — draft

This application branch consumes the review packet preserved in PR #133 at `474faae96343b804f111eb74200c71341465a8c4`. It is based directly on released main. Public modules import dedicated TypeScript catalog data; they do not import research JSON or offline scripts.

## Resulting behavior

- Add 341 planned school records to the existing 70, for 411 catalog records. Existing records, aliases, branding overrides, featured status and logo assets are unchanged.
- Add 85 planned districts to the existing 11, for 96 districts. These records provide references for covered playoff schools, not complete district membership or verified season records.
- Resolve 383 of 384 bracket identities by exact bracket name, division and region. The private Bi-District Readiness dashboard links them to school hubs. Houston Sterling has an explicit null mapping and stays excluded because its secondary color value is unresolved.
- Preserve public directory eligibility: pilot schools or schools with a game in the catalog. Metadata alone does not establish tracked coverage. Planned records stay outside the existing featured sitemap policy.
- Keep schools without results unranked with unknown district/overall records, even after other district members have results. No inferred 0–0 record or rank is added.

No games, schedules, scores, winners, verified results, database schema, security settings or editorial records change. All 296 game records retain their school references, kickoff, venue, scores, verification and playoff metadata. The seven published bi-district games and 185 missing games are unchanged.

## Data review

The three new data modules contain school records, district records and qualified bracket-to-slug mappings. They distinguish both Austin schools, three Bowie schools and Lubbock Cooper Liberty from the existing 5A Lubbock Cooper program. Existing Johnson City LBJ and Canyon West Plains records are reused without changing their URLs.

Publisher-listed mascots, abbreviations and hex values still require release review. Muenster's older UIL palette includes black omitted by its publisher profile. Existing Nocona, Tioga, Alvord, Navasota and Muenster logo artwork and registry paths are retained. No logo is generated, recolored or resized. Untested publisher-listed school website URLs are omitted from runtime records.

## Validation

The full standard command is `node --import tsx --test lib/*.test.ts lib/*.test.tsx data/*.test.ts scripts/coverage-integration-scope.test.mjs`. Prebuild includes catalog, rendering and standings regressions. Tests cover district references, unique identifiers, all 383 lookups, Sterling's hold, misleading-name rejection, directory eligibility and featured coverage.

Original 70-school fingerprint: `a87103e8435e3b9f2daadbb84ca7ccb3176bcdb19d1e8bf32e2487d8be40ee56`.

Stable schedule/result fields for all 296 games: `4d814ac7cf5c8f32271f0615e02a4e97959bca917ffebf0546f1dab4fb3b2dee`.

## Release boundary

Keep this PR draft and unmerged until record/branding review, deployment checks and owner release approval. Merging would expose new catalog records and their direct school/district pages; it would not publish researched games. Schedule publication remains a separate factual reconciliation and approval step.

# 3A Division I release candidate — November 14, 2026

Base production: a3b3fec4fe3e50c8f0e898409b63a77ead86385d, deployment dpl_Hsckdeywx3UVXBNmXRrb8FPzFoHU.

## Scope

Reuses the canonical catalog, shared connected renderer and authoritative score resolver. All 64 existing UIL field entries match the official order. Adds 22 first-round Game Centers, reviews results for all 32, and adds all 16 Area Game Centers. Ten existing first-round IDs are preserved. All four regional seed templates are reviewed. No score resolver changes: no reproducible De Leon–Alvord defect was found.

Structural authority: https://www.uiltexas.org/football/playoff-brackets/3AD1
UIL-linked results: https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/il2A4x778EusgRk6t5UYDQ/football-26/2026-uil-texas-football-state-championships-2026-football-conference-3a-d1.htm
Schedule corroboration: https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations

`coverage.json` contains all 32 first-round finals, 16 Area games, resolved schools and reviewed seeds. First-round date/time/venue fields unavailable in the source remain unknown; existing ten games retain their prior schedule metadata. No incomplete overall records are promoted as verified.

## Production acceptance (released 2A)

Actual Chromium production browser: all 32 DII first-round and 15 Area Game Centers render correct participants; 31 verified finals and Chilton–Brackett pending. Both schools' hub and schedule links/results checked for every first-round game: 128 checks. Raw observations: `production-acceptance.json`.

Four regional views each show 15 cards and reviewed seeds, fit within measured canvas bounds at 545 CSS-pixel browser zoom. Statewide has 63 cards and 31 finals; La Villa's sixteenth Area position remains pending. Stamford Road to State follows confirmed Mart/Windthorst then possible topology. Desktop drag changes translation; reset/fit and zoom buttons work. DI retains 63 cards, 32 finals. This production narrow-window check is not a physical-device or touch-pinch test. Device-emulated pinch is separately tested in the browser CI suite. `production-ui.json` records checks.

De Leon–Alvord: fresh HTTP 200 server HTML, hydrated browser, HTTP 200 snapshot, and verified game_state agree: De Leon 40, Alvord 24. HTML has FINAL · VERIFIED, no Live score unavailable. SSR headers MISS, age 0, private/no-cache/no-store. Snapshot primary, canonical exact ID, verified final, record 9–2. DB verified/updated 2026-11-14 06:26:53.718607+00. Read-only scoring logs 20:00–22:00 UTC: 1,781 requests, all 200. No evidence of current SSR/hydration divergence, cache defect or feed outage. Historical external retrieval cannot be reconstructed; stale/incomplete retrieval is possible, not proven. No speculative code fix.

Chilton–Brackett remains scheduled Saturday November 14, 5 p.m. Central in current source checks, with no verified production result. Preserve pending opponent; do not create La Villa Area game until a verified winner exists.

## Source exceptions

See `source-conflicts.json`. Bushland 50–35 and Diboll 42–7 follow the UIL-linked bracket plus direct game/team schedules; DCTF differs. Neither had a pre-existing production score. Diboll–Lorena date November 20 is confirmed but 7 vs 7:30 p.m. conflict remains: publish date only, time TBD. Franklin–East Chambers campus wording follows UIL-linked Magnolia West; DCTF venue label is less specific.

## Scoring registration

`scripts/sql/register-playoff-3ad1-20261114.sql` executed successfully: 38/38 new canonical identities, guarded against conflicts/duplicate same-round pairs. All 48 3A DI identities now present. No production scores, permissions, RLS, schema or roles changed. Public game_state before/after: 180 rows, fingerprint 2bdc1754453347d4e055ec1493a30f50 unchanged.

## Logos

61 participants lack an approved asset on base main. `missing-approved-logos.json` organizes by region and marks current active winners. Existing placeholders remain. No logo assets/registry changed; leave owner's feat/2a-d1-owner-logos-20261114 branch separate.

## Local validation

636/636 lib/data regression tests pass; TypeScript passes. Full lint/build and actual preview/device acceptance results recorded in PR and final handoff when complete. Browser CI adds all four 3A regional fits, 32 verified cards, reviewed seeds, school path screenshots, conflict finals, 6 p.m./7:30 p.m./TBD schedules. Existing DI/DII, isolated feed-failure and authoritative-correction regression tests retained.

Do not merge/deploy without owner approval. PR #144 excluded. No new 2027 feature work.

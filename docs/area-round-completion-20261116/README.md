# Area-round completion and fan readiness

Production baseline: `fa64a0dee8c71606a615b14c329288522f573f53` (PR #160), Vercel deployment `dpl_CEz3Ua6cwsiRSpZxKeJjWUrqS5Hk`, READY on both production domains. Dedicated branch: `feat/area-round-completion-20261116`. Draft delivery only; no merge, production deployment, score writes, permissions changes or logo changes.

## Independent audit

All 96 Area Game Centers, 192 participant school hubs and 192 school schedules were fetched from actual production: 480 HTTP 200 responses, all serving the baseline deployment, no missing school links or canonical Area Game Center links. Game Center participant names, confirmed kickoff times and venue strings match the baseline catalog. See `production-audit.csv` and its timestamped summary. The catalog contains 192 first-round verified finals and 96 unique unscored Area games across all six 2A–4A divisions.

Audit order: 2A DI, 2A DII, then 3A and 4A. Ninety-five matchups have exact timezone-qualified kickoff and venue text; one remains pending. Carlisle–Beckville lacked a city; Franklin–East Chambers used a campus name as its city; Tulia–Ballinger named only the Greenwood locality rather than the stadium. No other missing date, time, venue or city was identified in the published records. Exact street addresses and verified coordinates are not present for every neutral site; these changes do not enable or guess Nearby locations.

## Implemented — three canonical matchup records

| Game | Existing value | Staged value | Kickoff |
| --- | --- | --- | --- |
| Tulia–Ballinger (`2026-area-2a-d1-i-2`) | Midland Greenwood, TX | J. M. King Memorial Stadium, Midland, TX | November 20, 7 p.m. CST, unchanged |
| Carlisle–Beckville (`2026-area-2a-d1-iii-2`) | Pine Tree Pirate Stadium | Pine Tree Pirate Stadium, Longview, TX | November 19, 7 p.m. CST, unchanged |
| Franklin–East Chambers (`2026-area-3a-d1-iii-4`) | Mustang Stadium, Magnolia West, TX | Mustang Stadium (Magnolia West HS), Magnolia, TX | November 20, 7 p.m. CST, unchanged |

These are edits to the existing canonical records. Existing Game Center, Playoff Central and school schedule consumers synchronize automatically. Designated sides and neutral-site fields are preserved; no home-field designation is inferred. No new game records or alternative schedule source is added.

The read-only Area publishing readiness audit now rejects timezone-less kickoff values, impossible calendar dates, placeholder venue variants (TBA, pending, unknown), and whitespace-only source attribution. Existing valid schedules remain 95 scheduled / one needs details. No publishing permissions or scoring authority changes.

## Source decisions

Research reviewed November 15, 2026 (Central time); audit files carry UTC timestamps.

- Tulia–Ballinger: Kale Steed's Press Pass Sports Area pairings explicitly identify King Memorial Stadium in Midland. Pigskin Prep independently lists Midland King. TexasBob identifies the stadium as J. M. King Memorial Stadium, owned by Greenwood ISD. The generic Greenwood listing and exact stadium listing describe the same site, not a conflicting new venue.
  - https://www.presspass.news/2026/11/14/uil-region-i-texas-high-school-football-area-round-playoff-pairings/
  - https://www.pigskinprep.com/showfreeschedules.asp?distID=99&yr=2026
  - https://texasbob.com/stadium/stadium.php?id=529
- Carlisle–Beckville: KLTV's Area schedule identifies Pirate Stadium in Longview. Pine Tree ISD's live feed independently locates Pirate Stadium in Longview. The existing UIL-linked kickoff is retained.
  - https://www.kltv.com/2026/11/14/football-area-round-schedule/
  - https://www.ptisd.org/live-feed/?page_no=1%2F1000
  - https://www.uiltexas.org/football/playoff-brackets/2AD1
- Franklin–East Chambers: KBTX specifies Mustang Stadium at Magnolia West High School. The statewide Area pairings identify Magnolia; the campus is in Magnolia, not a city named Magnolia West. Existing kickoff is retained. A district calendar search also identifies Magnolia West's Magnolia address, but the opened calendar did not reproduce the event; it is not used as the game scheduling authority.
  - https://www.kbtx.com/2026/11/08/2026-brazos-valley-high-school-football-playoff-pairings-results/
  - https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations

## Still unknown — La Villa–Chilton

No verified date, kickoff time or venue was found. School-domain and public matchup searches were performed independently. MaxPreps explicitly reports the date unset and neutral playoff presentation; statewide pairings report TBD. A High School On SI stats page has a nominal November 19 URL and a school location, while its actual Game Start field is blank. Those routing/default school fields do not establish a scheduled date or site. Earlier-season/year search results were excluded. Keep the canonical record and public presentation TBD, including the existing unknown neutral-site flag. Chilton's 42–31 result remains owner-confirmed.

- https://www.maxpreps.com/tx/football/game/chilton-vs-la-villa/11-19-2026/?c=7d1cf01a-39c7-4d51-8e21-d1bd1a3485e8
- https://www.winnipegfreepress.com/uncategorized/2026/11/14/texas-high-school-football-playoff-pairings-13
- https://www.si.com/high-school/stats/texas/football/games/6971661-chilton-vs-la-villa

## Logo acquisition — separate work

All 384 first-round schools were checked against the logo registry and matching repository asset paths. There are 181 missing repository integrations: **88 current Area participants** and **93 eliminated participants**. No unwired slug-matched asset candidates were found. This establishes repository asset status, not whether official artwork exists elsewhere or can be reused. Those external acquisition and permission questions remain unverified. See the deduplicated `missing-logos.md` and `missing-logos.json`; prioritize the three missing 2A Area teams before 3A/4A. No logo assets or mappings changed.

## Regression controls and validation

`baseline.json` locks every first-round game plus all unrelated playoff records to production. `before.json` preserves the original three changed records. New tests verify only venue/source text changes, all 96 Area games unscored, both school schedules linked, 95 complete / one pending, and no later-round advancement. Historical PR #159 hash checks reconstruct their historical schedule snapshots while dedicated current-baseline tests enforce all other fields. Legacy Tulia venue expectations are updated to the same canonical stadium name.

665 repository tests and TypeScript passed; targeted lint is clean. The production build uses the existing isolated network guard and local logo fixture. Initial build setup failures were an external dependency symlink (replaced with branch-local installation) and automatic approval review blocking a production-logo fetch (replaced by the existing local fixture); neither required product changes. Final validation: 665 repository tests, 11 focused completion/readiness tests, clean targeted lint, TypeScript, 149 release prebuild tests, and the isolated production build all pass. Preview and remote CI results are recorded in the PR. Venue-text changes do not alter the existing schedule geometry or location registries, so no catalog fingerprint is changed.

## Next sprint

Finish La Villa–Chilton scheduling only when a reliable announcement exists; then prepare Area score operations and Regional advancement acceptance. Acquire missing 2A artwork in a separate branch/PR. A separate verified-neutral-venue coordinates sprint can expand Nearby discovery without treating a designated home team's stadium as the playoff site.

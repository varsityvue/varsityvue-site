# Area schedule completion — November 15, 2026

Base: 34676d78bcf7ea90c59ce974c30aad4244f2151a. Staging only; release requires owner approval.

## Changes

- `2026-area-2a-d1-i-2`: Tulia–Ballinger, November 20, 7 p.m. CST (`2026-11-20T19:00:00-06:00`), Midland Greenwood, TX. San Angelo LIVE, Paul Harris, November 14 schedule directly reports the pairing, Friday, 7 p.m. and Midland Greenwood. Amarillo Globe-News/Yahoo search result independently corroborates; full Yahoo retrieval returned HTTP 429. Do not infer an exact stadium name, designated sides or neutral-site flag.
  - https://sanangelolive.com/news/sports/2026-11-14/west-texas-high-school-football-playoff-schedule-and-scores
  - https://sports.yahoo.com/articles/texas-panhandle-high-school-football-221017917.html
- `2026-area-3a-d1-iii-1`: Diboll–Lorena, November 20, 7:30 p.m. CST (`2026-11-20T19:30:00-06:00`). Existing Mustang Stadium, Madisonville venue retained. Lorena ISD's official November 20 calendar event explicitly states 7:30 p.m., Madisonville High School. KLTV's Area schedule independently states Friday, 7:30 p.m., Mustang Stadium (Madisonville). This resolves the earlier DCTF versus direct-matchup conflict in favor of the official school announcement. MaxPreps still lists 7 p.m.; do not silently blend those times.
  - https://www.lorenaisd.net/apps/events/2026/11/20/61936422/?id=0
  - https://www.kltv.com/2026/11/14/football-area-round-schedule/

## Pending

La Villa–Chilton remains unchanged: kickoff and venue pending. November 15 searches, including school-domain searches, found no authoritative schedule announcement. Available matchup listings still show TBA. Chilton 42–Brackett 31 remains owner-confirmed.

## Verification

12 targeted tests, TypeScript and the production build passed. The new schedule test is included in the release prebuild suite. Source-backed changes are limited to kickoff, venue and attribution of the two records. The schedule fingerprint is refreshed. `before.json` preserves their original canonical objects, allowing the historical PR #159 hash test to reconstruct and verify its original baseline while a dedicated test checks every other field remains unchanged. Readiness becomes 95 scheduled and one pending-details matchup. No score, identity, advancement, logo, permission or production database changes.

# District 12 schedule and Week 9 editorial reconciliation — October 17, 2026

Owner confirms Stephenville at Jarrell as Week 9 GOTW and 7 p.m. CDT kickoff. The full article, photographs and credits remain unpublished and outside this change.

## Current scope

Six teams: Stephenville, Jarrell, Burnet, China Spring, Lampasas and Marble Falls. Existing historical results were complete through October 9. Production game_state already verifies China Spring 21 at Stephenville 55 on October 16; preserve that row and all existing IDs.

Add missing October 16 finals: Jarrell 41 at Lampasas 23; Burnet 16 at Marble Falls 34. Add the six missing future games below. Existing Stephenville games remain unchanged, yielding all nine remaining district matchups and ten regular-season games per school.

| Date | Away | Home | Central kickoff |
|---|---|---|---|
| Oct 23 | Stephenville | Jarrell | 7 p.m. CDT — owner confirmed |
| Oct 23 | Lampasas | Burnet | 7 p.m. CDT |
| Oct 23 | Marble Falls | China Spring | 7 p.m. CDT |
| Oct 30 | Burnet | Stephenville | 7 p.m. CDT |
| Oct 30 | China Spring | Jarrell | 7 p.m. CDT |
| Oct 30 | Marble Falls | Lampasas | 7 p.m. CDT |
| Nov 6 | Stephenville | Marble Falls | 7 p.m. CST |
| Nov 6 | Jarrell | Burnet | 7 p.m. CST |
| Nov 6 | Lampasas | China Spring | 7 p.m. CST |

Expected records after October 16: Stephenville 7-0 / 2-0; Jarrell 7-0 / 2-0; Marble Falls 3-4 / 1-1; Burnet 1-6 / 1-1; Lampasas 2-5 / 0-2; China Spring 1-6 / 0-2.

## Sources

- Jarrell at Lampasas final: https://www.maxpreps.com/tx/football/game/jarrell-vs-lampasas/10-16-2026/?c=00fcd5c9-1458-4b4a-94ce-335b5be93025&tab=Recap
- Burnet at Marble Falls final: https://www.maxpreps.com/tx/burnet/burnet-bulldogs/football/ and https://txprepfootball.com/schools/marble-falls-mustangs/
- Host-issued Lampasas schedule: https://www.pigskinprep.com/archive/Schedulespdf/Lampasas.pdf — all remaining dates and 7 p.m. times.
- China Spring school schedule: https://www.pigskinprep.com/archive/Schedulespdf/China%20Spring.pdf — remaining dates and 7 p.m. times. Independently reported by KWTX: https://www.kwtx.com/2026/08/27/2-a-days-2026-china-spring/
- Burnet dates and times: https://prepsfb.com/team/tx/burnet/burnet-bulldogs ; school calendar confirms Oct 23 at 7 p.m.: https://www.burnetcisd.net/apps/events/2026/10/
- Jarrell official calendar confirms Oct 30 at 7 p.m.: https://jhs.jarrellisd.org/calendar ; its older downloadable varsity PDF says 7:30 p.m. The owner resolved Oct 23 to 7 p.m.; Oct 30 is supported by China Spring's schedule and Jarrell's current calendar. Nov 6 supported by Burnet's schedule and MaxPreps.
- Marble Falls booster schedule confirms home/away dates: https://www.mfmustangs.org/26fbschedule (its early-season score fields are stale and were not used to overwrite results).
- Stephenville remaining dates/times: https://texashsfootball.com/stephenville-yellowjackets-2026-season-preview/

## Venue verification

Add three physical stadium mappings so the exact Week 8 and Week 9 nearby slates can safely expand from 17 to 19 games. No nearest-campus substitution.

- Burnet: TexasBob https://texasbob.com/stadium/stadium.php?id=41 map link https://goo.gl/maps/gYTcJS46eZMusH2C8 resolves to the football field at 30.7737932,-98.2285237, 1401 N Main St. Stadium alias Bulldog Field.
- Marble Falls: https://www.mfmustangs.org/mfstadium and https://texasbob.com/stadium/stadium.php?id=1302 map link https://goo.gl/maps/DaAzxTwE5FQ6cb2K7 resolves to stadium at 30.5857997,-98.251861. Use the place coordinates, not the map viewport center.
- Lampasas: https://www.waze.com/live-map/directions/us/tx/lampasas/lampasas-football-stadium?to=place.ChIJe3IG9kmUWoYRrlpKEAuHZvY returns venue latLng 31.0704199,-98.1830657, 300-398 N Chestnut St. Address independently corroborated by https://www.dailytrib.com/2025/10/30/high-school-football/ ; school-issued schedule identifies Badger Field. This is the city stadium, not the high-school practice field.

Weeks 10 and 11 remain available in All Games and school schedules; their separate Nearby approval remains deferred. No ingestion activation, schema changes, score-state writes, Pick 'Em changes or notifications are included. Homepage designation can link to the existing Game Center; no full preview URL is invented.

## Validation

67 prebuild regression tests passed. Additional tests verify seven finals and three remaining games per team with the existing production overlay, exact W-L/PF/PA, no duplicate matchups, all nine future game-night windows, CST offsets after November 1, and unpublished-article handling. Final build and preview evidence recorded in the release result.

The broad CI suite exposed a pre-existing failing Stamford/Young assertion on unchanged main (14eb09f): it still expected six games after the owner Week 7 import. The test now retains its six-game 34/474 historical check and separately asserts the source's added 5/73 and current 39/547 across seven games. No Stamford runtime data or aggregation logic changed. Frozen migration parity checks explicitly validate and exclude the eight new catalog additions; historical SQL is unchanged.

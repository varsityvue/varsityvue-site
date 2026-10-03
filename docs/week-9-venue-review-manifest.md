# Week 9 Games Near Me venue continuity review manifest

Draft review only. Repository-owned venue enrichment; no migration, production write, analytics, map or runtime geocoder.

## Canonical slate and approval

Canonical getGames() season 2026 Week 9: 17 rows, 17 real district games, 34 participants, 17 home schools. All October 23, 2026. Zero regular non-district games, byes, scrimmages, neutral-site games or playoff games. stamford-bye-2026-week-9 remains excluded by data/2026-district-schedule-reconciliation.ts.

The exact sorted 17-game approval in data/game-location-pilot.ts requires actual canonical slate equality and 17/17 verified locations. Weeks 7 and 8 remain approved. Week 10 remains unapproved despite 17/17 resolution; Week 11 remains unapproved.

## All 17 games

- abilene-tlca-at-cisco-2026-week-9: Abilene TLCA at Cisco; tx-cisco-chesley-stadium; Chesley Stadium; Cisco; home_venue; existing venue; verified.
- albany-at-winters-2026-week-9: Albany at Winters; tx-winters-blizzard-stadium; Blizzard Stadium; Winters; home_venue; existing venue; verified.
- breckenridge-at-holliday-2026-week-9: Breckenridge at Holliday; tx-holliday-eagle-stadium; Eagle Stadium; Holliday; home_venue; existing venue; verified.
- city-view-at-merkel-2026-week-9: City View at Merkel; tx-merkel-badger-stadium; Badger Stadium; Merkel; home_venue; new venue; verified.
- crawford-at-wortham-2026-week-9: Crawford at Wortham; tx-wortham-bulldog-stadium; Bulldog Stadium; Wortham; home_venue; new venue; verified.
- cross-plains-at-goldthwaite-2026-week-9: Cross Plains at Goldthwaite; tx-goldthwaite-gary-proffitt-stadium; Gary Proffitt Stadium; Goldthwaite; home_venue; existing venue; verified.
- de-leon-at-anson-2026-week-9: De Leon at Anson; tx-anson-tiger-stadium; Tiger Stadium; Anson; home_venue; new venue; verified.
- dublin-at-clifton-2026-week-9: Dublin at Clifton; tx-clifton-cub-stadium; Cub Stadium; Clifton; home_venue; existing venue; verified.
- eastland-at-millsap-2026-week-9: Eastland at Millsap; tx-millsap-bulldog-stadium; Bulldog Stadium; Millsap; home_venue; existing venue; verified.
- frost-at-meridian-2026-week-9: Frost at Meridian; tx-meridian-yellow-jacket-stadium; Yellow Jacket Stadium; Meridian; home_venue; existing venue; verified.
- hamilton-at-tolar-2026-week-9: Hamilton at Tolar; tx-tolar-tolar-rattlers-stadium; Tolar Rattlers Stadium; Tolar; home_venue; existing venue; verified.
- hamlin-at-miles-2026-week-9: Hamlin at Miles; tx-miles-gary-krejci-memorial-stadium; Gary Krejci Memorial Stadium; Miles; home_venue; new venue; verified.
- hawley-at-hico-2026-week-9: Hawley at Hico; tx-hico-tiger-stadium; Tiger Stadium; Hico; home_venue; existing venue; verified.
- henrietta-at-jacksboro-2026-week-9: Henrietta at Jacksboro; tx-jacksboro-tiger-stadium; Tiger Stadium; Jacksboro; home_venue; existing venue; verified.
- rio-vista-at-comanche-2026-week-9: Rio Vista at Comanche; tx-comanche-indian-stadium; Indian Stadium; Comanche; home_venue; existing venue; verified.
- santo-at-hubbard-2026-week-9: Santo at Hubbard; tx-hubbard-jaguar-field; Jaguar Field; Hubbard; home_venue; existing venue; verified.
- stephenville-at-jarrell-2026-week-9: Stephenville at Jarrell; tx-jarrell-cougar-field; Cougar Field; Jarrell; home_venue; new venue; verified.

## Five new venue records and mappings

### tx-merkel-badger-stadium

Badger Stadium, 702 Haynes St, Merkel, TX 79536. Coordinates: 32.4636228, -100.022023. Verified 2026-10-03.
Mapping: merkel -> tx-merkel-badger-stadium
Aliases: Merkel ISD Football Field.

- https://mms.merkelisd.net/
- https://texasbob.com/stadium/stadium.php?id=969
- https://goo.gl/maps/7ph8Qn1hLg3LvHoK9
- https://www.texasfootball.com/team/merkel-badgers
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-100.023623,32.4623228,-100.02042300000001,32.464922800000004&bboxSR=4326&imageSR=4326&size=800,800&format=png&f=image

### tx-wortham-bulldog-stadium

Bulldog Stadium, 411 Longbotham St, Wortham, TX 76693. Coordinates: 31.7928468, -96.4679942. Verified 2026-10-03.
Mapping: wortham -> tx-wortham-bulldog-stadium
Aliases: Bulldog Field, Wortham ISD Bulldog Stadium.

- https://www.worthamisd.org/bulldogs-athletics
- https://texasbob.com/stadium/stadium.php?id=36
- https://goo.gl/maps/Zab4rumyubBS7vX38
- https://www.texasfootball.com/team/wortham-bulldogs
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-96.4695942,31.7915468,-96.46639420000001,31.7941468&bboxSR=4326&imageSR=4326&size=800,800&format=png&f=image

### tx-anson-tiger-stadium

Tiger Stadium, 710 Avenue N, Anson, TX 79501. Coordinates: 32.760197, -99.9007582. Verified 2026-10-03.
Mapping: anson -> tx-anson-tiger-stadium
Aliases: none.

- https://www.ansontigers.com/athletics/
- https://texasbob.com/stadium/stadium.php?id=1008
- https://goo.gl/maps/W2UtwXAshuiw6hAn7
- https://www.texasfootball.com/team/anson-tigers
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-99.9023582,32.758897,-99.8991582,32.761497&bboxSR=4326&imageSR=4326&size=800,800&format=png&f=image

### tx-miles-gary-krejci-memorial-stadium

Gary Krejci Memorial Stadium, 1001 Robinson St, Miles, TX 76861. Coordinates: 31.6050723, -100.1885923. Verified 2026-10-03.
Mapping: miles -> tx-miles-gary-krejci-memorial-stadium
Aliases: Bulldog Stadium.

- https://www.milesisd.net/athletics/
- https://texasbob.com/stadium/stadium.php?id=984
- https://goo.gl/maps/dBzusgfj6YkcNrpL8
- https://www.texasfootball.com/team/miles-bulldogs
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-100.19019229999999,31.6037723,-100.1869923,31.6063723&bboxSR=4326&imageSR=4326&size=800,800&format=png&f=image

### tx-jarrell-cougar-field

Cougar Field, 1100 W FM 487, Jarrell, TX 76537. Coordinates: 30.8200396, -97.627041. Verified 2026-10-03.
Mapping: jarrell -> tx-jarrell-cougar-field
Aliases: Cougar Stadium, Jarrell High School Football Field.

- https://jhs.jarrellisd.org/athletics/jarrell-high-school-athletics/schedules
- https://texasbob.com/stadium/stadium.php?id=104
- https://goo.gl/maps/DTgQF45xRvntXrA5A
- https://www.texasfootball.com/team/jarrell-cougars
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-97.628641,30.8187396,-97.62544100000001,30.8213396&bboxSR=4326&imageSR=4326&size=800,800&format=png&f=image

## Physical verification and source reconciliation

Each Google stadium place pin was checked against the football playing surface in Esri World Imagery, separately from campus entrances, adjacent practice fields, baseball fields and district offices. Use the Google place coordinates, not its viewport center. Imagery confirms footprint placement, not a live match-day inspection. Stadium-specific TexasBob identity/ownership/address records and current 2026 Texas Football home schedules corroborate varsity use. Official athletics sources supplement them; Anson and Miles public calendars contain older entries and are not treated as 2026 schedule authority.

- Jarrell: official 2026 varsity schedule is https://jhs.jarrellisd.org/fs/resource-manager/view/e97e7113-d034-4edb-a32f-f69781b2e306 . Official district facility fees use Cougar Stadium: https://resources.finalsite.net/images/v1754701408/jarrellisdorg/rawzvmv1qwkxpk9v7rwv/UILTurnkeyFacilityRentalFees_1.pdf . Cougar Field / Cougar Stadium / Jarrell High School Football Field identify the same football footprint at 1100 W FM 487.
- Anson: stadium-specific TexasBob address is 710 Avenue N. Community camp lead uses 703 Avenue N: https://leagues.teamlinkt.com/ansonyouthtacklefootballandcheer/AnsonCommunityHub . The physical stadium is additionally delineated by https://www.openstreetmap.org/way/568316637 . The street-number variation is documented, not a second venue identity. Its Tiger Stadium ID remains Anson-specific.
- Wortham: official athletics explicitly places the football field at 411 Longbotham St; district office and gym addresses are separate. TexasBob uses the adjacent 5th St approach. Bulldog Field / Bulldog Stadium / Wortham ISD Bulldog Stadium refer to this one footprint.
- Miles: TexasBob identifies Gary Krejci Memorial Stadium; its stadium map link labels the same field Bulldog Stadium. Keep the memorial name canonical, with the generic name only as an alias. The adjacent running-track field is not the varsity stadium pin.
- Merkel: TexasBob Badger Stadium links directly to the Google place named Merkel ISD Football Field at the same football footprint. The 702 Haynes St address is independently corroborated by https://www.myfca.us/wtryfl-2021/ .

## Game overrides

New Week 9 overrides: 0. All 17 resolve through home_venue. Preserve anson-at-abilene-tlca-2026-week-8 -> tx-abilene-wilford-moore-stadium unchanged.

## Remaining uncertainties

No conflicting alternate Week 9 venue was found in the reviewed sources. Future announced venue changes remain possible; use a verified explicit override for the exact canonical game if one is announced. Address approach variants above are disclosed; coordinates identify football surfaces. No owner GPS was requested.

## Protected behavior

Featured Schools remain 10; Hamilton remains hamilton -> tx-hamilton-kooken-field. Resolver precedence and fail-closed behavior, browser-memory-only GPS, 50-mile default, 10/25/50/100/150 radii, sorting, Clear and schedule fallback remain unchanged. Scorekeeper CTA, score authority, UUID hardening, Pick Em, Score Scout, Team Feed and personalization are outside the change.

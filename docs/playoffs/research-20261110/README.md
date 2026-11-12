# Bi-district research handoff — November 10, 2026

This is an offline review packet, not a published schedule or an import authorization.
No file here is imported by a public page, game catalog, API, or database writer.

## Inventory and evidence

- Authoritative inventory: `data/statewide-playoff-brackets.ts`, `data/playoff-bracket-fields.ts`, and `getBiDistrictReadiness(getGames())`.
- Snapshot: 192 positions; seven scheduled records; 185 missing records. A read-only production query found no bi-district `public_game_state` overrides at review time.
- Research covers all 192 positions exactly once: all 64 Class 2A, all 64 Class 3A, all 64 Class 4A. Every region has eight positions per division.
- `class-2a.json`: 64 rows: one now source-verified by host ticketing, 20 corroborated reports and 43 single-source rows. Corroboration does not prove independent reporting. All timezone offsets except Shelbyville–Waskom remain geographically inferred.
- `class-3a-4a.json`: 64 rows, 16 with explicit CST schedule evidence, 48 partial rows; two conflict rows.
- `remaining-3a-4a.json`: remaining 64 rows (four now source-verified, 60 partial); nine rows with recorded conflicts, including the later San Diego–Mathis kickoff discrepancy.
- `inventory.json`: bracket readiness snapshot, including the seven existing game IDs.
- `reviewed-candidates.json`: reproducible review output; 185 structurally valid new-record proposals and seven existing-record reconciliation entries. Structural validity is not factual verification.

The catalog contains 70 schools. Of 384 bracket team references, 40 match an exact catalog name and classification; 344 references representing 343 distinct name/classification identities remain unresolved. The generated `identityAudit` lists every unresolved identity without fuzzy matching. Some are aliases (Johnson City / Johnson City LBJ and West Plains / Canyon West Plains); others need new catalog records. Do not mistake Leon for De Leon, Plains for Cross Plains, Cooper for Lubbock Cooper, Ford for Stamford or Crawford, or Canyon for Canyon West Plains.

Only seven rows currently resolve both school identities to existing catalog slugs by exact name and classification. Unknown or ambiguous identities remain null; no statewide slugs were invented. Of 192 rows, 191 lack an explicit neutral-site designation in the research evidence. No row is publication-ready.

## Reproduce

Run from repository root after installing locked dependencies:

    node --import tsx scripts/review-playoff-schedule-research.ts > docs/playoffs/research-20261110/reviewed-candidates.json
    node --import tsx --test scripts/review-playoff-schedule-research.test.ts

The script reads repository files and writes only to stdout. It has no database client, no network access, and no publishing operation. It uses the validator released through PR #136. Regenerate against the latest inventory immediately before any later publication review.

## Meaning of fields

- `kickoff` in original evidence can be null; `proposedKickoff` is an explicitly provisional timestamp. Class 2A rows record inference in `timezoneBasis`.
- The normalized `proposed` object is a review convenience, never approved data. Always read `provenance` and `publicationIssues` with it.
- `source-verified` means one selected credible source explicitly supplies date, time, venue and CST. It does not mean independent two-source confirmation, resolved identity, neutral-site confirmation, or owner approval.
- `readyForPublication` is always false, including when structural validation passes.
- Existing games are `reconcile-existing-only`; do not insert duplicates or overwrite results.
- Home/away order is not established by bracket order. Confirm the actual designation before constructing game records.

## Priority discrepancies

1. Shelbyville–Waskom: host Carthage ticket event confirms Nov. 13, 7:30 p.m. CST at Bulldog Stadium. Contrary 7 p.m. kickoff is superseded; a separate gate-opening discrepancy remains explicitly held.
2. Wall–Bowie: Wall ISD confirms Friday at 6 p.m. in Cisco; retain 7 p.m. report as superseded. Explicit timezone and site status still needed.
3. Hooks–Arp: Arp ISD itinerary supports Nov. 13 at 7:30 p.m., Arp home; retain 7 p.m. report as superseded. Timezone and site status still needed.
4. Millsap–Trinity Leadership: host ticket event now confirms Thursday Nov. 12, 7:30 p.m. CST at Knight Stadium; contradictory date/time reports remain preserved.
5. Bells–Lone Oak: host ticket event confirms Tom Kimbrough Stadium in Murphy, Nov. 13 at 7:30 p.m. CST, Lone Oak home.
6. Lincoln–Southwest: school-linked ticket event confirms Clark at 5201 Ca Roberson, Fort Worth; Plano report is superseded. Timezone remains unconfirmed.
7. Athens–Hamshire-Fannett: NFHS event confirms Nov. 13 at 7:30 p.m. CST; January typo retained as superseded. Exact venue/site status still needed.
8. All five Class 3A DI Region IV date discrepancies now have field-level resolution. Devine’s school-issued ticket event confirms Nov. 13; Host NISD resolves Yoakum–Carrizo Springs; host ticketing resolves Jourdanton–Hallettsville and San Diego–Mathis; Hondo’s school calendar resolves Marion–Hondo. Odem host ticketing confirms San Diego–Mathis at 7:30 p.m. CST rather than 7.
9. Resolved-preference notes remain for Bosqueville–Johnson City (official Granger, not La Grange), Axtell–Bangs (weekday/date typo), and Lockney–Iraan (Thursday versus Friday).
10. Coahoma–Holliday stadium naming needs identity review (Eagle versus Don Lacy).

Do not trust broad SI/syndicated date groupings over school announcements. Keep CST and Mountain local time distinct for El Paso venues; DCTF explicitly uses CST statewide.

## Next publication work

Confirm conflicting details with schools or venues; reconcile exact school identities, home/away order, timezone and neutral designation; recheck existing games and verified results; then request explicit approval of an exact publication batch. No production insertion, schema change, score change or merge is authorized by this packet.

## Follow-up reconciliation — November 10

Follow-up evidence is preserved on seven candidate rows. A resolved discrepancy confirms only the stated field; all candidates remain publication-blocked. Original reports and conflicting values are retained.

| Matchup | Finding | Remaining limitation |
| --- | --- | --- |
| Wall–Bowie | Wall ISD announcement supports Friday at 6 p.m. in Cisco; earlier 7 p.m. report marked superseded. | Explicit timezone and neutral-site evidence absent. |
| Hooks–Arp | Arp ISD band itinerary supports Nov. 13, 7:30 p.m., Hallsville Bobcat Stadium; Arp is designated home. | Timezone and neutral-site evidence absent; nearby band-event weekday typo recorded separately. |
| Yoakum–Carrizo Springs | Host Northside ISD confirms Nov. 13, 7 p.m., Gustafson Stadium, San Antonio; Nov. 12 report marked superseded. | Explicit timezone and neutral designation absent. |
| Athens–Hamshire-Fannett | NFHS scheduled broadcast confirms Nov. 13 at 7:30 p.m. CST in Bryan, resolving the January typo and timezone gap. | Exact venue and neutral-site evidence require reconciliation. |
| Bells–Lone Oak | Indexed official athletics announcement supports Tom Kimbrough Stadium in Murphy. | Opened page returned older content; indexed evidence alone does not close the venue discrepancy. |
| Millsap–Trinity Leadership | Current MaxPreps schedule adds Nov. 12, 7:30 p.m. as another conflicting report. | Selected AP says 7 p.m.; no primary confirmation found. Proposed time remains unchanged. |
| San Diego–Mathis | Current MaxPreps matchup adds a new 7 p.m. CST report. | Existing AP/capsule says 7:30 p.m.; both date and kickoff discrepancies remain blocked. |

Evidence links and retrieval limitations are recorded in each row's `followUpEvidence`. Search-index-only evidence is explicitly distinguished from an opened page. School and host announcements are preferred for disputed fields; a generic home/away label from a sports aggregator is insufficient to settle venue neutrality. This follow-up does not create schools, assign aliases, publish schedules, or change production data.

## UIL school identity staging — November 10

`school-identity-review.json` reviews all 384 team references across all 192 games against the six UIL 2026–28 football alignment files linked from the official playoff page. This is an identity evidence packet, not an expansion of the runtime school catalog.

- `uil-alignment-schools.json`: source transcriptions, division/district/region membership, retrieval date and SHA-256 of each downloaded PDF. Wrapped school names were joined explicitly; abbreviations such as `H Austin`, `CC Calallen` and `Tex. Liberty-Eylau` are retained as printed by UIL.
- `school-identity-name-expansions.json`: 69 explicit, reviewed expansions qualified by division and region. No substring or fuzzy matching. These are proposed research correspondences, not runtime aliases or new schools.
- `school-identity-review.json`: 315 exact official names and 69 reviewed expansions; all 384 official identities are distinct when qualified by division and region. All 192 opponent pairs belong to adjacent paired UIL districts. This checks district membership, not district seeds or playoff qualification.
- 42 references can point to existing catalog records after integration review: 40 exact bracket/catalog names and two reviewed names (`Johnson City` → `Johnson City LBJ`, `West Plains` → `Canyon West Plains`). Their known region/district metadata does not conflict with the UIL snapshot. An existing `opponent` district remains an explicit limitation rather than being treated as a verified district assignment.
- 342 identities require new school records. Required ID/slug, mascot/display name, abbreviation, colors, district registry integration and coverage status remain listed for review. No placeholder mascots or colors were invented; `proposedSlug` stays null and every integration/publication flag stays false.

The earlier 343 unresolved name/classification keys were not 343 unique schools: the two 4A DI `Austin` references shared one key but identify different schools. Resolving two existing-name variants and separating the Austin schools yields the 342 missing catalog records above. The original exact-name audit remains unchanged as a baseline.

Collision examples are explicit: 4A DI Region I `Austin` is `El Paso Austin`, while Region III `Austin` is `H Austin`. `Bowie` resolves separately to `Simms Bowie` (2A DII), `Bowie` (3A DI) and `El Paso Bowie` (4A DII). `Liberty` in 4A DII is `Lubbock Cooper Liberty`, which must not reuse the existing Lubbock Cooper 5A school. `Leon`, `Plains`, `Cooper`, `Ford` and `Canyon` remain separate from misleading catalog substrings.

Reproduce and test from repository root:

    node --import tsx scripts/review-playoff-school-identities.ts > docs/playoffs/research-20261110/school-identity-review.json
    node --import tsx --test scripts/review-playoff-school-identities.test.ts

The reviewer fails on absent or ambiguous official identities, duplicate qualified expansions, source mismatches, inconsistent district/region evidence, duplicate official bracket identities or incompatible opponent district pairs. Regression tests exercise cross-region substitutions, duplicate mappings, source substitutions and incorrect district evidence using isolated temporary fixtures.

Next integration work: verify the required catalog metadata, review canonical IDs and district registry handling, and prepare a separate application change. This packet changes no runtime catalog, public page, database, score, result or schedule.

## Missing-school catalog proposals — November 10

The metadata pass follows all 384 school links in the six UIL-linked MaxPreps brackets. Each bracket label and seed district is matched to its qualified UIL identity; the 384 external school IDs are unique. One additional label correspondence is recorded by the links: bracket `Greenwood` is UIL `Midland Greenwood`, with the same District 3 identity. Profiles for all 342 missing schools were retrieved successfully and their embedded school IDs were checked against those bracket links; deleted, pseudo-school and non-Texas profiles were rejected during collection.

- `bracket-school-profile-links.json` preserves the link, external school ID, bracket label, seed and game number for every team. Seeds are source evidence only and do not change the bracket or a game's home/away order.
- `publisher-school-metadata.json` preserves the selected public profile fields and HTML hashes: reported mascot, abbreviation, color names and hex values, city, canonical profile and school website link. These are publisher reports, not blanket confirmation by the schools. Reported website links have not been tested and are not inserted into the proposed runtime records. No logos, coaches, student data or full HTML pages are copied.
- `primary-branding-checks.json` records limited UIL/school corroboration for Panhandle, Muenster, Nocona, Bosqueville and Houston Sterling. Panhandle's named palette is corroborated; exact hex values remain publisher-listed. Muenster's older UIL palette includes black, which its current publisher profile omits. Houston Sterling has historical Royal Blue versus current publisher Columbia Blue wording; no exact replacement hex value was inferred. Historical team classifications are not reused.
- `school-catalog-proposals.json` contains 342 proposed field sets, including 341 structurally complete `School` records. Houston Sterling remains incomplete because the profile omits its secondary color hex value. That record stays null, with known fields and the missing value reported explicitly. No placeholder color is supplied.
- The packet also stages 85 missing `District` records so every school proposal references either an existing district or a proposed district with matching classification and region. The 11 existing district records are not modified.

Proposed IDs/slugs are engineering choices derived from the qualified UIL name, with `H`, `Ft Worth`, `CC` and `Tex.` location prefixes expanded to Houston, Fort Worth, Corpus Christi and Texarkana. Apostrophes are removed and other separators become hyphens. These IDs are checked against all existing IDs, slugs and aliases and against one another. They still require adoption review. Display full names combine that school label with the reported mascot; they are not asserted legal school names. Abbreviations and the first two color values preserve publisher fields. A valid third color is used for the display accent; otherwise the secondary color is reused as an explicitly documented presentation fallback. `planned` is a proposed internal coverage setting, not a fact sourced from the school.

All school and district proposals remain `readyForCatalogIntegration:false`, and every publication flag remains false. The packet creates no runtime school or district record and changes no logo, public page, schedule, database record or result.

Reproduce and test:

    node --import tsx scripts/review-playoff-school-catalog.ts > docs/playoffs/research-20261110/school-catalog-proposals.json
    node --import tsx --test scripts/review-playoff-school-catalog.test.ts

The reviewer rejects missing/duplicate qualified evidence, wrong school IDs, unexpected publisher URLs and identifier collisions. Missing required metadata blocks a complete record. Tests cover district references, publication boundaries, wrong-school substitutions, duplicate reports and missing mascot/color values.

Remaining integration work is now concrete: review generated identifiers and publisher-listed branding, resolve Houston Sterling's missing secondary hex value and the recorded palette differences, then prepare a separate application integration branch. Structural completeness is not release or publication approval.


## Host and school follow-up — November 11

Live browser review closed discrepancies on six more matchup rows. Of the 15 rows with recorded source discrepancies, 13 now have field-level resolutions and two remain unresolved: Shelbyville–Waskom kickoff and Devine–Randolph date. Original contradictory reports remain in `conflicts`; when a selected source changes, `previousSelectedSource` preserves its URL and original values. None of these resolutions establishes publication readiness.

| Matchup | Confirmed evidence | Remaining limitation |
| --- | --- | --- |
| Millsap–Trinity Leadership | [EMS ISD host event 3267](https://events.hometownticketing.com/boxoffice/eaglemountain/L2VtYmVkL2V2ZW50LzMyNjc%3D): Thursday Nov. 12, 7:30 p.m. CST, Eagle Mountain High School Knight Stadium, 3451 Bonds Ranch Rd. Proposed kickoff corrected from 7 to 7:30. | Home/visitor designation and explicit neutral-site status absent. |
| Bells–Lone Oak | [Plano ISD host event 8775](https://events.hometownticketing.com/boxoffice/planoisd/L2VtYmVkL2V2ZW50Lzg3NzU=), linked by [Lone Oak athletics](https://www.loneoakbuffaloes.com/sport/football/boys/): Friday Nov. 13, 7:30 p.m. CST, Tom Kimbrough Stadium, 700 N. Murphy Road, Murphy. Lone Oak HOME; Bells Visitor. | Explicit neutral-site status absent. The previously stale school announcement is now directly visible. |
| San Diego–Mathis | [Odem-Edroy ISD box office](https://events.hometownticketing.com/boxoffice/odemedroy/L2VtYmVkL2FsbA==), linked from the [Mathis ISD homepage](https://www.mathisisd.org/), event 354: Friday Nov. 13, 7:30 p.m. CST, Odem HS, 1 Owl Square. San Diego HOME; Mathis VISITOR. | Ticket page names Odem HS; Owl Stadium name remains earlier-source evidence. Explicit neutral-site status absent. |
| Jourdanton–Hallettsville | [NBISD host event 644420](https://brushfire.com/new-braunfels-isd/lchs-vfb/644420), provider linked from [official Dragon gameday information](https://nbisd.org/news/2026-dragon-gameday-info/): Friday Nov. 13, 7 p.m. CST, Dragon Stadium, 4150 Klein Meadows, New Braunfels. | Home/visitor designation and explicit neutral-site status absent. Doors open at 6 p.m.; that is not kickoff. |
| Lincoln–Southwest | [School-linked GoFan event 7050655](https://gofan.co/event/7050655?schoolId=TX16169), reached through [Southwest athletics](https://www.fwsouthwestraiders.com/sport/football/boys/): Thursday Nov. 12, 7 p.m., Clark, 5201 Ca Roberson, Fort Worth. School ticket list designates Southwest Home. | Explicit timezone and neutral-site status absent. |
| Marion–Hondo | [Hondo school calendar event 61303091](https://hs.hondoisd.net/apps/events/2026/11/13/61303091/?id=0): Friday Nov. 13, 7 p.m., Marion High School, 506 Bulldog Ln, Marion. Calendar export explicitly encodes `ctz=US/Central`. | Exact Veterans Stadium name remains earlier-source evidence; no explicit neutral-site designation. |

The Odem listing requires opening GET TICKETS for event 354 to display its explicit CST detail. This was read-only; no quantity was selected, no checkout was submitted, and no school was contacted. Session-bound iframe query strings are excluded from the packet. The ticket providers were read in a live browser because search extraction did not render their event content.

Three additional rows now meet the packet’s narrow `source-verified` date/time/venue/CST definition (Millsap, Bells, Jourdanton), taking that count from 16 to 19. San Diego and Marion remain partial because exact stadium naming is not fully reconciled with the newer primary evidence. Designated home and visitor sides do not prove venue neutrality. All 192 candidates remain blocked, including the seven existing-record reconciliations; all 185 missing games remain unpublished.

The follow-up review also checked current school announcements and calendars. No new primary confirmation was obtained for Shelbyville–Waskom or Devine–Randolph, so those conflicts are retained. New Braunfels host ticketing and Southwest school-linked GoFan supplied the previously missing Jourdanton and Lincoln evidence; a majority of aggregator reports was not used as a substitute.

PR #137 separately stages application catalog integration from the preceding research head. This research update changes no identifiers or catalog proposals and does not alter that draft integration. It does not imply that either PR is approved for release.


## Final two recorded schedule conflicts — November 11

The two remaining date/kickoff conflicts now have host-school ticket confirmation:

| Matchup | Primary evidence | Held details |
| --- | --- | --- |
| Shelbyville–Waskom | [Carthage ISD event 57](https://events.hometownticketing.com/boxoffice/carthageisd/L2VtYmVkL2V2ZW50LzU3): Friday Nov. 13, 2026, **7:30 p.m. CST**, Bulldog Stadium, 1600 W. Panola St., Carthage TX 75633. The [Nov. 9 announcement](https://scttx.com/articles/shelbyville-dragons-football-playoffs-game-information) links this exact event. | Explicit team-side designation and neutral-site status remain unconfirmed. A separate operational caveat preserves host gates at 6 p.m. versus announcement gates at 6:30; no gate guidance is approved. |
| Devine–Randolph | [Devine ISD event 175](https://events.hometownticketing.com/event/9b9b09ae-00ef-4cd0-918d-2e670aa1183b): Friday Nov. 13, 2026, **7 p.m. CST**, Warhorse Stadium, 1100 West Warhorse Drive, Devine TX 78016. | Home/visitor ticket sections do not explicitly map teams. Exact team-side designation and neutral-site status remain unconfirmed. |

The Devine event was located using HomeTown’s public search for Devine, then opening the exact WARHORSES vs Randolph BI-DISTRICT PLAYOFFS result. Its embedded school box office identifies event 175. The general search preview displayed the event in UTC; the detail page explicitly supplies Friday evening CST and governs the proposed kickoff. No timezone conversion was inferred from a generic search timestamp. Both ticket pages were read in a live browser; no tickets were selected or purchased.

All 15 recorded date, kickoff, and venue conflict rows now have field-level resolutions. This does **not** close all missing information, operational caveats, or publication requirements. The count of rows with explicit date/time/venue/CST evidence is now **21**, up from 19. All 192 publication flags remain false; 191 rows still lack an explicit neutral-site designation. Stadium naming caveats, home/away designations, catalog release review and the separate application draft PR #137 remain outstanding. No runtime catalog, production schedule, result, score, schema or release state changed.

The earlier dated follow-up sections are historical checkpoints. This final section records the current conflict-resolution totals and should govern the next review pass.


## Designated sides and venues — November 11

See [the 21-game review table](designated-sides-and-venues-review.md) and `designated-sides-and-venues-review.json`. The review covers every currently source-verified candidate exactly once: nine explicit designated-side mappings (up from one in that batch), 12 mappings still unconfirmed, 19 school/host location corroborations and two location gaps. Site assessments distinguish 13 third-party locations, six participant locations and two unknowns; they are labeled inferences and do not replace explicit neutral-site evidence. No candidate neutral-site flag or publication approval changed.

Eight newly confirmed side mappings are also preserved in `class-3a-4a.json` and the regenerated candidates: Graham, Mineral Wells, Brock, Carthage, Van Alstyne, Krum, Gilmer and Hillsboro are designated home in their respective matchups. The El Paso host events separately corroborate MST kickoff times equivalent to the selected CST instants. Role evidence and location evidence are kept separate; away travel is not treated as a designated visitor assignment.

### Venue-status follow-up — November 11

`venue-status-follow-up.json` reviews the nine explicit-side games and records two new primary location corroborations. All 21 selected-source-verified schedules now have school/host location corroboration, including ACU campus-only evidence for Liberty–Burkburnett and exact Chapel Hill host evidence for Sunnyvale–Pittsburg. Twelve designated-side mappings and all 21 formal neutrality fields remain unresolved. The publisher review found conflicting home/away/neutral labels and unset-date/January 1, 1900 placeholders; those reports are not adopted as primary confirmation. The current matrix supersedes the earlier 19-location count. No kickoff, selected venue, operation, catalog proposal or publication flag changes. All 192 publication flags remain false.

### Remaining designated-side follow-up — November 11

`remaining-designated-sides-follow-up.json` records a focused public-source pass over all 12 previously unresolved assignments. NBISD host ticket products confirm Jourdanton HOME and Hallettsville VISITOR, bringing the 21-game batch to 10 explicit assignments and 11 unresolved. The Crowley GoFan host corroborates Glen Rose–Ponder’s selected venue and local time but supplies no designated sides. This supersedes earlier nine/twelve assignment counts; `venue-status-follow-up.json` remains the historical nine-game review. A new Seminole–Bowie secondary kickoff discrepancy is resolved in favor of the official school calendar and athletics schedule at 7 p.m.; 16 candidate rows now contain resolved schedule discrepancies. No selected kickoff, venue, neutralSite, operation, catalog proposal or publication flag changes. All 192 publication flags remain false. Remaining assignments need new explicit primary evidence; repeat searches of the same generic labels do not remove that limit.

## November 11 completion checkpoint

New supplemental evidence and reproducible publication staging are in `publication-staging-20261111/README.md`. The original selected values and 21-game baseline remain preserved. Supplemental review expands core schedule evidence to 52 games, supports 21 side mappings (16 both roles explicit; five complementary-role inferences held), and prepares all 192 records in disabled manifests. Formal neutrality remains unknown; nothing is approved or published. See `schedule-expansion-20261111.json` and `release-candidate-context-20261111.json` for pinned inputs and limits.

The offline schedule/identity/catalog scripts use an immutable 70-school/11-district research baseline, not the application catalog after PR #137. Their original outputs remain byte-identical, and the snapshot is not imported by runtime modules. See the completion checkpoint for combined-release verification.

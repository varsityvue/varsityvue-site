# Area-round operational acceptance — November 14, 2026 Central

Production baseline: `26128bf5fcbceb7d3f49d33697a51898ad332aeb`, deployment `dpl_2TYotgmHExD2Xd75BHezLSEb8vdB` READY.

## Live acceptance

Fresh cloud-browser checks passed all 32 4A DII exact verified finals, all 16 Area participant pairs/kickoff times/venues/school links, all 32 advancing-school Area links, and Graham/Glen Rose/Canton/Wimberley schedules. Four regional brackets each contain eight finals, four Area games and correct reviewed seeds. Statewide contains 63 cards, 32 verified finals and 48 Game Center links. Regional fit, zoom, keyboard pan and reset passed. Glen Rose's confirmed Ponder/Carthage opponents and hypothetical later path are distinguished. Six division final counts remain 32/31/32/32/32/32; the unresolved 2A DII game is retained honestly.

Millsap's Next Matchup remains Edgewood on November 20 at 7 p.m. at Ron Poe Stadium in McKinney, linking `/games/2026-area-3a-d2-ii-1`.

## Proposed consumer improvement

Ten existing 2A DI Area Game Centers had no kickoff or venue although the current reliable schedule now supplies both. `schedule-updates.json` lists the exact additions. Only missing kickoff/venue and source attribution change; IDs, participants, scores, home/away display order, neutrality and seed topology remain unchanged. Tulia–Ballinger remains TBA.

Schedule authority: https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations (Area schedule reviewed November 14 Central). Thursday means November 19 and Friday November 20 in this Area round. All times are Central. Waller venue spelling is corroborated by https://www.wallerisd.net/departments/school-safety (Daikin Stadium); the schedule source spells it Daiken. No designated home/away or neutral-site status is inferred from venue.

## Unpublished result lead

DCTF currently reports Chilton 42–Brackett 31 and La Villa–Chilton with schedule TBA. The UIL-linked 2A DII bracket and team schedules still show the first-round game pending at review:
https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/XZGmaAD6qk-NrhqmU1Ar5A/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d2.htm

This is a reported lead awaiting independent school/UIL corroboration, not a published final or advancement. No result, participant or new Game Center is introduced for that lead in this candidate.

## Scoring operations

Read-only production registry check: all 287 published playoff games registered with exact school-side identities; zero mismatches. Production scores were never written during this audit.

Isolated in-memory simulation exercised all 95 published Area games: unverified and wrong-ID score payloads cannot advance teams; complete verified finals populate the correct Regional source edges across all six divisions. This is a fixture test, not a production result.

Existing transaction safeguards require trusted authorization/canonical identity and expected state revisions; assigned scorekeepers can update eligible LIVE numeric games, while moderators handle starts/finals and exceptional corrections. Ordinary reports remain pending review. Verified authoritative corrections retain read precedence, incomplete/unverified feeds do not erase repository finals, duplicate bracket candidates fail closed, and no-contest/tied/unverified games do not advance.

Local PostgreSQL WASM tests exercise actual publication SQL for stale-write rejection, anonymous denial and halftime behavior; contributor assignment RLS tests reject non-admin changes. These isolated tests do not reproduce hosted Auth/PostgREST. Exact-tree release CI already covers the broader database security/score-authority suite; candidate CI must pass again.

## Release rules

No production application release without owner approval of the exact candidate SHA. Do not merge PR144 or modify logo work, scoring permissions or production scores.

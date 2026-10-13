# Week 7 owner statistics import — source and reconciliation

Prepared 2026-10-12 from VarsityVue-Week7-Stat-Import-Candidate-2026-10-12.zip. Local candidate only; no merge/deployment/database change. Tomas Ferrera identity and receiving line were owner-confirmed on 2026-10-12; publication remains subject to final checks and review.

Baseline main: aac1cc47376f83b810c3072a86a1f1f0f16e3195, tree fe3ee2ef7af47b362a221ac9abdf4431a08d3a9b. PRs #78/#79 remain excluded.

Six canonical games, seven reporting schools, 68 player-category lines, 50 school-scoped player identities. Append the single module once through lib/all-game-stats.ts and reuse its season/week/participant deduplication. Baseline has 35 records and no entries for these six matchups; draft has 41. All 35 previous aggregated records remain unchanged. No opponent player/team-stat rows added; both schools' reported quarter/final scores are context only. Albany/Stamford each submitted their own player rows.

## Game and identity review

- Comanche source label “Millsap @ Comanche” reverses the repository venue. Preserve comanche-at-millsap-2026-week-7 with Millsap home. Independent [MaxPreps game record](https://www.maxpreps.com/tx/football/game/comanche-vs-millsap/10-9-2026/?c=7e312e22-3b95-4a1f-81ee-4938262e88aa&tab=Matchup) identifies Comanche away at Millsap on Oct 9, Millsap Bulldog Stadium, final 7–41. Repository schedule needs no change.
- 46 of the 50 supplied names match existing same-school season records or verified profile names after the existing name normalization. No alias, existing player URL or roster/bio changed.
- Four new statistical names: Junior Gomez and Kye Keeter corroborated by [Comanche 2026 roster](https://www.maxpreps.com/tx/comanche/comanche-indians/football/roster/) (#2/#11); Karson Bernal corroborated by [Stephenville 2026 roster](https://www.maxpreps.com/tx/stephenville/stephenville-yellow-jackets-honeybees/football/roster/) (#6). Do not add unrequested jersey/grade/bio profile entries; stat-only pages use existing deterministic IDs.
- Tomas Ferrera is absent from existing season/profile records. Available [Goldthwaite roster](https://www.maxpreps.com/tx/goldthwaite/goldthwaite-eagles/football/roster/) is an incomplete 15-player list last updated Aug 24 and does not corroborate this name. Its absence does not prove the candidate wrong. The owner confirmed Tomas Ferrera — #15 from the original October 9, 2026 Hamlin vs. Goldthwaite box score: 1 reception, 0 receiving yards, 0 receiving touchdowns. This is owner-confirmed source evidence, not independent roster verification. The supplied line is retained without replacement; no roster/profile jersey metadata is added.

## Source discrepancies and unknown values

Preserve independently reported values: Comanche 10 completions/141 passing yards vs 9 receptions/128 receiving yards; De Leon 101 passing vs 105 receiving yards; Stamford 17 completions/305 passing vs 16 receptions/303 receiving yards. Partial category notes make limitations explicit. No invented receiver allocation or reconstructed team totals.

19 omitted TD and three omitted INT fields remain undefined; explicit numeric zeros remain zeros. De Leon owner confirmation assigns all five TDs to Lane Couch rushing; all other De Leon TD fields are source-supported zero. Negative Cisco Corbin Harrison rushing yard (-1) retained.

Goldthwaite supplied nine touchdown plays plus nine Blake Howard PATs: 54+9=63 points. Preserve the nine PAT aggregate evidence here and in scoring completeness notes. No PAT play objects/timestamps supplied; none invented. Mark scoringPlays partial rather than the candidate's complete claim. Other Goldthwaite supplied offensive totals reconcile (173 rushing +263 passing=436 total; 9 completions/9 receptions, 263 receiving yards).

Owner row/quarter/scoring/team payload is unchanged apart from completeness/provenance annotations and explicit GameStats[] typing. Source-payload SHA-256 (stable sorted object keys over gameId/season/quarterScores/scoringPlays/teamStats/passing/rushing/receiving): 8fd417c42f7453acc8cfc7425ca724d2142735c7453e4ffadf52e417240e411d. Source JSON's candidate verified status is an input assertion, not proof of publication; Tomas identity provenance is owner-confirmed rather than independently roster-verified.

## Exact season leaderboard values (local candidate)

Existing semantics retained: all-purpose = rushing+receiving yards; homepage Total TDs includes passing+rushing+receiving TD contributions, using known-category lower bounds and a + suffix for unknown components. This does not count PATs. Yard totals are verified values on file, not complete-season claims. Existing partial/unknown completeness badges remain.

| Category | Before top three | After top three |
|---|---|---|
| Passing yards | Miles Follis 1,738, Trot Jordan 1,245, Colby McIlroy 920 | Miles Follis 2,043, Trot Jordan 1,536, Colby McIlroy 1,124 |
| Rushing yards | Lane Couch 1,041, Landry Sanderson 823, Zyler McClendon 682 | Lane Couch 1,332, Landry Sanderson 923, Zyler McClendon 682 |
| Receiving yards | Levi Vahlenkamp 683, Caden Monk 650, Slayden Young 474 | Caden Monk 804, Levi Vahlenkamp 774, Slayden Young 547 |
| All-purpose yards | Lane Couch 1,040, Landry Sanderson 918, Zyler McClendon 750 | Lane Couch 1,335, Landry Sanderson 1,018, Slayden Young 879 |
| Total TDs | Miles Follis 23+, Trot Jordan 19, Hayes Greenway 19 | Hayes Greenway 26, Miles Follis 25+, Trot Jordan 24 |

## Validation and baseline limitations

Seven new focused regressions cover canonical identity/deduplication, exact source payload, opponent exclusion, discrepant categories, undefined fields/explicit zero, Lane Couch attribution, partial scoring/PAT evidence, season/game logs and homepage calculations. Expanded focused suite: 64 passed. TypeScript, affected lint, 64 prebuild tests and build passed; public completeness and touchdown semantics validators passed. All pre-existing records and season deltas independently reconstructed from original source JSON and pre-import aggregates.

Global stat reconciliation has exactly the same pre-existing Albany Week 6 error as baseline (cross-plains-at-albany-2026-week-6: complete passing/receiving claim with missing TD field). Candidate adds no errors, canonical failures, duplicates, profile identity warnings or core/extended contradictions. Do not suppress or repair that unrelated error. Historical baseline conditions are not represented as repaired.

Review/rollback: only new data module, one aggregator import/append, focused tests and this source note. Any later approved commit can be reverted as a unit; no database rollback needed. Do not incorporate #78/#79, change public rendering/ranking semantics, create canonical game/player aliases, hardcode leaderboard UI, merge, deploy or modify production databases.

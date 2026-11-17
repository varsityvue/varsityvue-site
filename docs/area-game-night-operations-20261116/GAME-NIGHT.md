# Game night: open this first

## Execution recheck: correction gate

Current production and packet counts are **26 Thursday / 67 Friday / 3 Saturday**, with **9 Thursday / 23 Friday priority 2A games**. The 66/22 Friday counts in the continuation request omitted one game; the existing packet already contains all 96 and was preserved.

A network-prohibited real-action fixture found that the current production correction action converts a blank score into zero; the correction form also defaults unknown scores to zero. [Draft PR #164](https://github.com/varsityvue/varsityvue-site/pull/164), head `9765c188e7c87073609dca821804ea1071faa7b3`, fixes this and refreshes playoff/readiness/school schedule views after correction. **It is not merged or deployed.** Production remains at PR #163. Until an approved release, never accept a default or blank correction score: explicitly enter and recheck both real scores. Existing FINAL correction requires administrator access. Ordinary first-final entry retains PR #162's strict validation.

674 repository tests, six new isolated correction tests, 163 release tests, TypeScript, targeted lint and the guarded isolated build passed. Production scoring/moderation/correction routes reached login; an authenticated owner session was unavailable. See [execution audit](execution-recheck.json); The exact-head preview is READY at deployment `dpl_5VjV5DctLKdMcbnM1cFYGAoeZgQi`; seven public route checks and the full 288-playoff-record snapshot passed. Three protected routes reached the expected login boundary. CI evidence is maintained on PR #164. No production write, identity repair, permission change, outreach, merge or deployment occurred.


Verified November 16, 2026, after PR #163 production acceptance. One owner; no continuous LIVE coverage. Main `bdded546ab4df72b9c8e9a0a274ba0ed386922b9`; production `dpl_6vadKD3dCZhAxRRybkiyYzznV23M` READY. All times CST.

## One loop; four tabs maximum

1. Use this checklist to choose the next task. Keep only the existing [working CSV](solo-queue.csv), editor, division source and corroborating source open. The CSV remains the single publication/defer log; this page is only its execution order.
2. Open the exact **Edit** link below. A signed-in admin/moderator is required. The `game` parameter preselects the editor, so no repeated game search is needed. The agent's unauthenticated route check reached login; an authenticated owner session was not exercised.
3. Check [2A DI](https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/rLBY1SGZOka6yqc8JiA-OA/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d1.htm) or [2A DII](https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/XZGmaAD6qk-NrhqmU1Ar5A/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d2.htm) once for several candidate finals. These public pages are accessible now; future scores and timeliness are not guaranteed. UIL links use the same MaxPreps data and are not an independent second source.
4. Require an explicitly FINAL result with both scores: one attributable official school/athletics report, or two genuinely independent matching reports. Check the exact opponent/date and original reporting origin. [DCTF scores](https://www.davecampbells.com/high-school-football/scores) is accessible as a landing page, but the retrieved page exposes no per-game scores; JS/app/session or subscription limitations remain untested. Do not rely on this as guaranteed backup evidence.
5. If a supported pending report already exists, use [Score Review](https://varsityvue.com/internal/score-review). If candidate evidence already exists, use [Missing Scores](https://varsityvue.com/internal/score-intelligence). Otherwise enter the verified final directly. Choose one path, not all three.
6. Recheck the **away / home school labels**, enter the two explicit scores, add one source/time note, choose **Review FINAL…**, then **Confirm and publish FINAL** once. These labels are scoring slots, not stadium sidelines. Blank is not zero. Never infer FINAL from the clock or elapsed time. Skip partial, tied, disputed or unsupported results.
7. Read back that Game Center and its two school schedules using links already in [coverage-matrix.csv](coverage-matrix.csv). At the end of the block, check [Playoff Central](https://varsityvue.com/playoffs) and only the newly completed pairs on [Regional readiness](https://varsityvue.com/admin/playoff-publishing). A cache mismatch is not permission to submit the same score twice.
8. Stop after three minutes searching an unsupported candidate: write Game ID, reason, existing evidence and next block in the working CSV, then move on. Stop at the block time limit even with backlog. On stale-write conflict refresh/review; do not auto-retry. Use the existing correction screen for a real correction; a winner reversal freezes affected downstream publication until reconciled.

## Thursday November 19 — maximum 60 active minutes

| Block | Minutes | Exact job |
|---|---:|---|
| 3:45–3:50 PM | 5 | Sign in, open source tabs and the Spearman–New Deal editor. No score entry before evidence. |
| 6:30–6:40 PM | 10 | Check Spearman–New Deal for an explicit final; publish only if supported. Otherwise carry it forward. |
| 9:30–10:00 PM | 30 | De Leon–Axtell first if final; then the remaining available Thursday 2A finals in the order below. |
| 10:15–10:30 PM | 15 | Finish supported candidates, verify new advancement and write the next unfinished row. Stop. |

Nine 2A games: one at 4 PM and eight at 7 PM. Only De Leon–Axtell has a participant-school assignment; availability is unknown. No 3A/4A sweep Thursday night. A Regional companion that is already verified can move its matching available final ahead of the remaining queue.

| Order | Matchup (away → home) | Kickoff | Direct scoring | Regional destination / other Area input |
|---|---|---|---|---|
| 1 | Spearman → New Deal | 4:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-i-4) | 2A-D1-I-R2 / `2026-area-2a-d1-i-3` |
| 2 | De Leon → Axtell | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-ii-4) | 2A-D1-II-R2 / `2026-area-2a-d1-ii-3` |
| 3 | Wheeler → Santo | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-ii-4) | 2A-D2-II-R2 / `2026-area-2a-d2-ii-3` |
| 4 | Weimar → Thorndale | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iv-1) | 2A-D1-IV-R1 / `2026-area-2a-d1-iv-2` |
| 5 | Ganado → Leon | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iv-2) | 2A-D1-IV-R1 / `2026-area-2a-d1-iv-1` |
| 6 | Beckville → Carlisle | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iii-2) | 2A-D1-III-R1 / `2026-area-2a-d1-iii-1` |
| 7 | Lovelady → Shiner | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iv-3) | 2A-D1-IV-R2 / `2026-area-2a-d1-iv-4` |
| 8 | Grapeland → Clarksville | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iii-2) | 2A-D2-III-R1 / `2026-area-2a-d2-iii-1` |
| 9 | Three Rivers → Bremond | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iv-1) | 2A-D2-IV-R1 / `2026-area-2a-d2-iv-2` |

## Friday November 20 — maximum 90 active evening minutes

| Block | Minutes | Exact job |
|---|---:|---|
| 6:45–6:55 PM | 10 | Sign in; open the two bracket sources, review Thursday carry-forward and any pending reports. |
| 9:15–9:25 PM | 10 | One candidate scan. List explicitly FINAL 2A games; do not treat this as a promise of finishing times. |
| 9:30–10:00 PM | 30 | Supported Cisco and Goldthwaite finals first, then the companion/closure order below. |
| 10:15–10:45 PM | 30 | Continue available supported 2A finals; verify completed pairs once. |
| 11:00–11:10 PM | 10 | Carry-forward log and public/readiness read-back. Stop even if games or sources are delayed. |

All 23 Friday 2A games kick off at 7 PM. Cisco–Johnson City and Goldthwaite–Haskell have participant-school assignments; no contributor availability is assumed. Rows 3–9 favor companions of the priority games or Thursday results. Move a pair together only when both verified finals exist. The rest are grouped by Regional dependency, not predicted winners. If a game is still LIVE, skip it.

| Order | Matchup (away → home) | Kickoff | Direct scoring | Regional destination / other Area input |
|---|---|---|---|---|
| 1 | Johnson City → Cisco | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-ii-1) | 2A-D1-II-R1 / `2026-area-2a-d1-ii-2` |
| 2 | Haskell → Goldthwaite | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-ii-3) | 2A-D2-II-R2 / `2026-area-2a-d2-ii-4` |
| 3 | San Saba → Muenster | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-ii-2) | 2A-D1-II-R1 / `2026-area-2a-d1-ii-1` |
| 4 | Tioga → Mason | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-ii-3) | 2A-D1-II-R2 / `2026-area-2a-d1-ii-4` |
| 5 | Olton → Ozona | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-i-3) | 2A-D1-I-R2 / `2026-area-2a-d1-i-4` |
| 6 | Shelbyville → Cooper | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iii-1) | 2A-D1-III-R1 / `2026-area-2a-d1-iii-2` |
| 7 | Rosebud-Lott → Flatonia | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iv-4) | 2A-D1-IV-R2 / `2026-area-2a-d1-iv-3` |
| 8 | Colmesneil → Collinsville | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iii-1) | 2A-D2-III-R1 / `2026-area-2a-d2-iii-2` |
| 9 | Yorktown → Junction | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iv-2) | 2A-D2-IV-R1 / `2026-area-2a-d2-iv-1` |
| 10 | Forsan → Panhandle | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-i-1) | 2A-D1-I-R1 / `2026-area-2a-d1-i-2` |
| 11 | Ballinger → Tulia | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-i-2) | 2A-D1-I-R1 / `2026-area-2a-d1-i-1` |
| 12 | Frankston → Joaquin | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iii-3) | 2A-D1-III-R2 / `2026-area-2a-d1-iii-4` |
| 13 | Tom Bean → San Augustine | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d1-iii-4) | 2A-D1-III-R2 / `2026-area-2a-d1-iii-3` |
| 14 | McCamey → Gruver | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-i-1) | 2A-D2-I-R1 / `2026-area-2a-d2-i-2` |
| 15 | Iraan → Ropes | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-i-2) | 2A-D2-I-R1 / `2026-area-2a-d2-i-1` |
| 16 | Sudan → Roscoe | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-i-3) | 2A-D2-I-R2 / `2026-area-2a-d2-i-4` |
| 17 | Stratford → Wink | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-i-4) | 2A-D2-I-R2 / `2026-area-2a-d2-i-3` |
| 18 | Crawford → Wellington | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-ii-1) | 2A-D2-II-R1 / `2026-area-2a-d2-ii-2` |
| 19 | Stamford → Windthorst | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-ii-2) | 2A-D2-II-R1 / `2026-area-2a-d2-ii-1` |
| 20 | Era → Overton | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iii-3) | 2A-D2-III-R2 / `2026-area-2a-d2-iii-4` |
| 21 | Lindsay → West Sabine | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iii-4) | 2A-D2-III-R2 / `2026-area-2a-d2-iii-3` |
| 22 | Harper → Falls City | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iv-3) | 2A-D2-IV-R2 / `2026-area-2a-d2-iv-4` |
| 23 | Chilton → La Villa | 7:00 PM CST | [Edit](https://varsityvue.com/internal/scoring?week=13&game=2026-area-2a-d2-iv-4) | 2A-D2-IV-R2 / `2026-area-2a-d2-iv-3` |

## Deferred 3A/4A — no evening monitoring

Use the existing [17 exact batches and scoring links](final-only-batches.md) / [batch CSV](final-only-batches.csv); do not create a second log.

| Games played | Games / batches | Owner review target |
|---|---:|---|
| Thursday | 17 / 5 | Friday morning: one 15–20-minute session after unresolved 2A, then stop. Resume another short morning session if time permits. |
| Friday | 44 / 11 | Saturday and subsequent mornings: one 15–20-minute session at a time, maximum four games per batch. |
| Saturday | 3 / 1 | Sunday or next morning: explicit finals only; Hargrave–Bay City, Decatur–Andress, Boling–George West. |

A straightforward four-game batch may take 8–16 minutes; this is a planning estimate, not measured performance. Check unresolved 2A before each session. The 150 evening minutes do not guarantee all 32 2A finals, and short morning blocks do not guarantee all 64 remaining games by Sunday. The previous estimate of roughly 4–7.5 total active hours across all 96 games remains plausible; disputed results take longer. Publish fewer verified results rather than lower the standard.

## Regional and source stop rules

- All 48 ledger slots still await both verified Area finals. The ledger maps each Area game exactly once; none of these operational slot IDs is a published canonical Regional Game Center.
- A published verified final advances its bracket winner automatically. Both source finals are needed for a complete Regional pair. Regional Game Centers still require a reviewed canonical game/schedule and registered scoring identity under a separately approved release; no hypothetical participant is published here.
- MaxPreps currently lists De Leon–Axtell on Friday and inserts Axtell into a Regional slot. Retain the owner-confirmed **Thursday November 19, 7 PM, Bob and Norma Cervetto Stadium, Dublin** and do not import external advancement. DCTF independently lists Thursday.
- La Villa–Chilton is now LIVE with **Friday November 20, 7 PM, Bulldog Stadium, Somerset**. Its MaxPreps Area slot remains unscheduled. The corroborating published-report attribution is preserved; this is not official school confirmation.
- Missing Scores eligibility begins four hours after kickoff: 11 PM for 7 PM games, 11:30 PM for 7:30 PM games. Eligibility is neither a final nor a guarantee of evidence. Do not wait up for it. Provider/cron operation has not been verified; zero Area candidates/evidence is the current read-only state. Never call the combined product-email cron as a score helper.
- No production score entry, assignment/permission change, outreach, deployment, identity repair or logo change was performed in this preparation.

## What passed

The released catalog and live snapshot preserve 192 verified first-round finals and all 96 unscored Area identities. All 96 kickoff/venue/participant records, exact editor links and 48 dependency pairs match the existing packet. Four actual-action/public-loader isolated tests passed, including all 96 synthetic finals feeding 48 readiness pairs, public schedule invalidation, blank/partial rejection, stale conflicts, unauthorized-role rejection and winner-reversal behavior. Another 57 affected repository tests passed. No software defect or need for a new scoring queue was demonstrated. See [read-only audit](final-readiness-audit.json).

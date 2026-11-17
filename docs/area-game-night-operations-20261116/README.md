# Solo owner: Area game-night packet

## Execution recheck: correction gate

Current production and packet counts are **26 Thursday / 67 Friday / 3 Saturday**, with **9 Thursday / 23 Friday priority 2A games**. The 66/22 Friday counts in the continuation request omitted one game; the existing packet already contains all 96 and was preserved.

A network-prohibited real-action fixture found that the current production correction action converts a blank score into zero; the correction form also defaults unknown scores to zero. [Draft PR #164](https://github.com/varsityvue/varsityvue-site/pull/164), head `9765c188e7c87073609dca821804ea1071faa7b3`, fixes this and refreshes playoff/readiness/school schedule views after correction. **It is not merged or deployed.** Production remains at PR #163. Until an approved release, never accept a default or blank correction score: explicitly enter and recheck both real scores. Existing FINAL correction requires administrator access. Ordinary first-final entry retains PR #162's strict validation.

674 repository tests, six new isolated correction tests, 163 release tests, TypeScript, targeted lint and the guarded isolated build passed. Production scoring/moderation/correction routes reached login; an authenticated owner session was unavailable. See [execution audit](execution-recheck.json); The exact-head preview is READY at deployment `dpl_5VjV5DctLKdMcbnM1cFYGAoeZgQi`; seven public route checks and the full 288-playoff-record snapshot passed. Three protected routes reached the expected login boundary. CI evidence is maintained on PR #164. No production write, identity repair, permission change, outreach, merge or deployment occurred.


## Start here — final game-night readiness

[GAME-NIGHT.md](GAME-NIGHT.md) contains the exact Thursday/Friday scoring order, direct links, 60/90-minute evening caps and short morning batch rules. PR #163 is merged and production-accepted at `bdded546ab4df72b9c8e9a0a274ba0ed386922b9`, deployment `dpl_6vadKD3dCZhAxRRybkiyYzznV23M` READY. The current [read-only audit](final-readiness-audit.json) verifies the existing 96 schedules/identities and 48 dependencies. Retain the original audit/live-recheck files below as dated historical evidence.


Updated November 16, 2026, America/Chicago. **One operator: the owner. No staffing recruitment or contributor availability is assumed.** This replaces the prior multi-operator proposal. The owner does not continuously monitor 96 games. Every 2A final takes priority; all 3A/4A work is verified final-only, with an explicit next-session backlog.

## Released schedule — PR #163

The packet’s schedule-derived queues now include La Villa–Chilton on **Friday November 20, 7 PM CST, Bulldog Stadium, Somerset, TX**. Dave Campbell’s Texas Football and the owner-provided South Texas Gridiron Grooves screenshot corroborate the published schedule; this is not official school confirmation. These packet fields describe approved head `528d090594312dc6f35fc59e0e630c8d00918118`, now merged and production-accepted at the release above. The older production baseline below is historical. See `schedule-release-candidate.json`. Friday now has 67 games, including 23 in 2A; no Area schedule remains unknown in production.

## Current baseline

Main `bdded546ab4df72b9c8e9a0a274ba0ed386922b9`, PR #163 merged. Production deployment `dpl_6vadKD3dCZhAxRRybkiyYzznV23M` is READY on both domains. Original audit/live-recheck files retain the previous baseline as historical evidence; final-readiness-audit.json is the current observation. The live recheck matches 192 first-round verified finals and all 96 unscored Area games; all 96 scoring identities remain registered. No production data, permissions, contributor assignments, logos or application code changed.

Six active school assignments exist, but only Cisco, De Leon and Goldthwaite cover Area participants. They are potential inputs, not operator capacity or promised live updates. The owner remains responsible for every reviewed result, even if a school assignment exists. The number of other authorized accounts does not change this solo plan.

## Use only this working order

1. [Solo queue: all 96 exact games](solo-queue.md), with [working CSV](solo-queue.csv). It groups exact kickoff windows, priority and Regional companion dependencies. Each row links directly to the existing preselected game editor; no repeated school search is needed.
2. [32-game 2A plan](priority-2a.md). P1: the three assignment-linked games, when a final is actually available. P2: the other 29 scheduled 2A finals, including La Villa–Chilton. Its verified published schedule is now included; there is no remaining P0 schedule-research task. This totals all 32 2A games without guessing a schedule.
3. [64-game final-only batches](final-only-batches.md), with [batch CSV](final-only-batches.csv). Each batch holds at most four games and can be deferred intact. Thursday’s 17 non-2A games are reviewed Friday morning; Friday’s 44 are reviewed in Saturday/Sunday blocks; Saturday’s three join Sunday cleanup. A late or disputed result moves forward, never becomes a guessed final.
4. [Bounded owner work blocks](kickoff-windows.md), [publication checklist](score-verification.md), and [existing tools / candidate-queue decision](tools-assessment.md).
5. [48 Regional dependency slots](regional-advancement.md), with [CSV](regional-advancement.csv). No confirmed Regional participants exist yet. One review per newly completed pair, rather than revisiting all 48 after every score.
6. [Full reference matrix](coverage-matrix.csv), [gaps](coverage-gaps.md), [source registry and caveats](sources.md), [validation](validation.md) and [live observation](live-recheck.json).

## Minimal owner actions per result

Scan one division source page once for several games. If a final is already backed by a suitable official source or independent matching reports, open that row’s editor and publish it once through the existing authorized flow; record one evidence note. Do not copy the same candidate into both Missing Scores and the direct editor. If evidence is absent/conflicting, mark the next owner block and move on after a three-minute research limit. No manual LIVE updates are required for any game. Optional spot checks of the three assignment-linked games must fit inside the timebox, not create an all-night obligation.

One official final can be reviewed by the same owner; no second operator sign-off is required by this plan. Two independently sourced reports are the alternative when official evidence is unavailable. The owner performs a deliberate score-slot/read-back check before and after submission. Unknown and disputed results stay unverified.

## Realistic commitment

Aim for about 60 active minutes Thursday night and 90 Friday night, centered on 2A finals. Remaining work moves to short morning sessions. At an estimated 2–4 active minutes per straightforward final, all 32 2A finals need roughly 64–128 minutes; all 64 other finals need another 128–256 minutes. With preflight and carry-forward logs, complete verified coverage is roughly **4–7.5 hours distributed across several days**, not a guaranteed Friday-night finish. Hard limits take precedence: publish fewer verified results rather than lowering the evidence standard. No staffing commitments are requested.

## Source and publication boundaries

[Sources](sources.md) lists authoritative school leads and reviewed scoreboard endpoints with access/independence caveats. A source URL is a lookup candidate, not proof that a future final will be available. De Leon–Axtell is owner-confirmed for Thursday November 19, 7 PM CST in Dublin; preserve it and do not reopen it as an unresolved scheduling task. La Villa–Chilton is Friday November 20, 7 PM CST in Somerset in the pending release candidate. The existing Missing Score folder already provides candidate evidence and explicit review; a duplicate queue is not justified. Automatic discovery depends on existing configuration and has a four-hour-after-kickoff eligibility threshold; it is not a substitute for the earlier 2A blocks. This run does not invoke its cron, enable a provider, or publish any score.

## Snapshot maintenance

The repository is the canonical schedule source and production is the score source. This is a dated operating snapshot, not a competing live feed. Use one CSV working copy for evidence/status and the next unfinished row. Current authentication is required by the existing internal tools; this run does not claim an authenticated production review. If the owner cannot authenticate, retain private evidence and defer publication; do not change permissions.

The generator refuses the older unscheduled catalog. Regenerate only in a worktree containing the reviewed schedule candidate/released canonical data; retain the packet’s solo-owner source files and output directory. Do not edit canonical app data on this docs branch just to regenerate.

Regenerate schedule-derived matrix, queue, batch, window, Regional and summary documents from the checked-out repository with:

```bash
node --import tsx docs/area-game-night-operations-20261116/generate-packet.ts
```

The generator is documentation-only, uses saved read-only assignment audit data, and never queries or writes production. Reconcile the hand-written source caveats, priority explanation and observation evidence if the baseline changes. No new PR, production release or deployment is required for this packet. Actual production score writes or Regional schedule/identity releases require explicit authorization in a subsequent operational session.

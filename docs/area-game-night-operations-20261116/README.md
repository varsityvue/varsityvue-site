# Solo owner: Area game-night packet

Updated November 16, 2026, America/Chicago. **One operator: the owner. No staffing recruitment or contributor availability is assumed.** This replaces the prior multi-operator proposal. The owner does not continuously monitor 96 games. Every 2A final takes priority; all 3A/4A work is verified final-only, with an explicit next-session backlog.

## Current baseline

Main `a85ad9a118a8659463e74b16b95062c9bb5aacee`, PR #162 merged. Production deployment `dpl_5JxVuvFYHnGAPT4rpvZEXV18URzq` remains READY on both domains. The live recheck matches 192 first-round verified finals and all 96 unscored Area games; all 96 scoring identities remain registered. No production data, permissions, contributor assignments, logos or application code changed.

Six active school assignments exist, but only Cisco, De Leon and Goldthwaite cover Area participants. They are potential inputs, not operator capacity or promised live updates. The owner remains responsible for every reviewed result, even if a school assignment exists. The number of other authorized accounts does not change this solo plan.

## Use only this working order

1. [Solo queue: all 96 exact games](solo-queue.md), with [working CSV](solo-queue.csv). It groups exact kickoff windows, priority and Regional companion dependencies. Each row links directly to the existing preselected game editor; no repeated school search is needed.
2. [32-game 2A plan](priority-2a.md). P1: the three assignment-linked games, when a final is actually available. P2: the other 28 scheduled 2A finals. P0: La Villa–Chilton schedule research, then insert its final into the relevant block after confirmation. This totals all 32 2A games without guessing a schedule.
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

[Sources](sources.md) lists authoritative school leads and reviewed scoreboard endpoints with access/independence caveats. A source URL is a lookup candidate, not proof that a future final will be available. Axtell–De Leon has a known external date discrepancy; retain the canonical Thursday November 19 date absent reliable new confirmation. La Villa–Chilton stays TBD. The existing Missing Score folder already provides candidate evidence and explicit review; a duplicate queue is not justified. Automatic discovery depends on existing configuration and has a four-hour-after-kickoff eligibility threshold; it is not a substitute for the earlier 2A blocks. This run does not invoke its cron, enable a provider, or publish any score.

## Snapshot maintenance

The repository is the canonical schedule source and production is the score source. This is a dated operating snapshot, not a competing live feed. Use one CSV working copy for evidence/status and the next unfinished row. Current authentication is required by the existing internal tools; this run does not claim an authenticated production review. If the owner cannot authenticate, retain private evidence and defer publication; do not change permissions.

Regenerate schedule-derived matrix, queue, batch, window, Regional and summary documents from the checked-out repository with:

```bash
node --import tsx docs/area-game-night-operations-20261116/generate-packet.ts
```

The generator is documentation-only, uses saved read-only assignment audit data, and never queries or writes production. Reconcile the hand-written source caveats, priority explanation and observation evidence if the baseline changes. No new PR, production release or deployment is required for this packet. Actual production score writes or Regional schedule/identity releases require explicit authorization in a subsequent operational session.

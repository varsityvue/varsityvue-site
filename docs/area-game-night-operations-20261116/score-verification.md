# Score verification and publication checklist

This is a proposed operating policy for the existing authorized workflow, not a new authorization or an automated publishing source. All times in the working ledger are CST with observation timestamps.

## Before kickoff — every game, even final-first coverage

- Find the exact Game ID in the matrix; match season, Area round, division, region and both school slugs. Read the current Game Center and school schedules. Canonical home/away are scoring slots; never infer physical sidelines or official neutrality.
- Recheck kickoff and venue against the attributed canonical source and any new authoritative school announcement. Record a conflict rather than overwriting the schedule. La Villa–Chilton stays in the P0 research queue until confirmed.
- Proposed lane lead checks both lookup sources and identifies an authoritative school/broadcaster lead where possible. A reachable scoreboard does not guarantee a future result, independent reporting or reliable final status. Log any inaccessible source before kickoff; do not buy access or contact anyone under this authorization.
- Confirm a real available operator for the primary and backup lane in the private roster. Existing school assignments do not establish availability. If the assigned-school contributor is unavailable or silent, the proposed central lane remains responsible.
- E checks `/internal/scoring` and `/internal/score-review` using an already authorized account. Keep the current revision/state tokens. No production test scores, seed scores or hypothetical starts. A moderator may originate a real LIVE state only as part of actual authorized game-night operations with verified evidence; this preparation run does not do so.

## Monitor without 96 individual scorers

- A: 2A Division I; B: 2A Division II. Check assigned-school games first; then scan remaining 2A games every 15 minutes / quarter. Missing a live update never implies 0–0.
- C: both 3A divisions; D: both 4A divisions. Pregame source checks, then first final-first scan at K+2h15, repeated every 15 minutes. An earlier authoritative final can be handled immediately. No routine play-by-play promise. Thursday C/D combine; Saturday use the staggered two-person desk.
- Record the score, period/final label, source URL and timestamp, not just a number. Unknown, partial, tied, disputed, delayed, suspended or stale results remain unresolved. Never convert an elapsed-time assumption into FINAL.
- Assigned-school scorekeepers retain trusted LIVE-only scope after an existing verified LIVE state is available. Other member reports remain pending moderation. Do not expand public score-submission rights or auto-publish from a web feed.

## Evidence gate before FINAL

1. Require both explicit numeric scores and the exact matching game. Zero is valid only when explicitly reported; empty is never zero. A normal football playoff final must identify an untied winner. Exceptional forfeit/no-contest results use the existing reviewed outcome workflow with an authoritative source and official winner where applicable.
2. Accept a directly attributable official school/athletics final announcement or official outcome notice after matching identity and date; obtain a second read-back by another operator where staffing permits. Otherwise require two independently sourced matching final reports. A known on-site contributor’s explicit final is one attributable report, not guaranteed independent corroboration. Record who supplied it in the private working log.
3. MaxPreps, SI embeds, UIL-linked MaxPreps and syndicated copies of one report are not independent confirmations. DCTX can also contain user updates; establish origin rather than assuming independence because the site name differs. Two copied scores from one feed count as one source.
4. At least one report must explicitly indicate final. A populated next-round bracket, a prediction, a blank period, apparent running clock expiry, estimated game duration, or the losing school’s silence is insufficient. Do not change the reviewed first-round owner-confirmed result based on a conflicting stale page.
5. Log evidence URLs, explicit final status, both scores, observed time, reviewer and any discrepancy in the working CSV. If independent corroboration is unavailable, queue the game for review; do not mark it verified merely to clear the board.

## Publish through existing authorized screens

1. The publishing owner (E by default) opens the exact game in `/internal/scoring` or reviews the pending report in `/internal/score-review`. Check the canonical score-slot orientation again; a fan display may put the opponent in a different visual order.
2. Enter both scores, inspect the explicit FINAL confirmation, preserve source attribution and submit once. Authentication, moderator/admin authority and existing optimistic concurrency remain unchanged. One publisher owns each game at a time.
3. On a stale/conflict response, reload current state and revision, compare the evidence and resubmit only if a genuine correction is still required. Never automatically retry or overwrite another operator’s update.
4. Read back actual public state: Game Center final and both score slots; both school schedules; Playoff Central winner and exact Regional slot; admin readiness state. Use an uncached refresh if a stale client is suspected. The app invalidates the affected school/score/playoff paths; report a persistent mismatch rather than assuming it refreshed.
5. Record published-by/time and the actual public result in the private working ledger. Advancement is automatic from a complete verified winner, but a Regional Game Center is not automatically created. Complete the separate 48-slot checklist only when both required Area finals are verified.

## Escalation and closeout

- Missing source or no update for two scan cycles: primary tries the alternate source and flags the backup. Never manufacture a live score. At K+3h15 without a confirmed final, E checks delay/overtime/dispute evidence and sets the next check time; that threshold is only a reminder.
- Conflicting final or ambiguous school identity: stop FINAL publication for that game, preserve the last verified state, mark the discrepancy in the private log, and escalate immediately to E. Resolve with authoritative evidence. Do not contact a school/contributor without separate authorization.
- No usable source / publisher unavailable: leave the game unresolved and explicitly include it in handoff. Next-morning 9 AM review is proposed, not a promise that an unverified result will be published.
- Corrections require an audited reason and expected revision in the existing moderation flow. If the winner changes, freeze the affected Regional destination and all descendants; reconcile any published downstream participants, identity, reports or scores before proceeding. Do not silently transfer a score to a newly substituted team.
- Shift closes only after every Game ID is either verified/published or in an acknowledged unresolved handoff with evidence and next-check owner. Count all 96 games; a school assignment is not a completed check.

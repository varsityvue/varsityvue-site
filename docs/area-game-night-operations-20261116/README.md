# Area game-night operations packet

Prepared November 16, 2026, in America/Chicago. **Planning ready; operational staffing is not yet confirmed.** This is a documentation snapshot on a nonproduction branch, not a public service promise or a second canonical schedule. No contributor was contacted, assigned a shift, or granted permissions.

## Current verified baseline

- Repository main: `a85ad9a118a8659463e74b16b95062c9bb5aacee` (PR #162 merged); tree `c3de0e06cf2477c5c91d33f4f2b0fc46ee6a8e64`.
- Production: `dpl_5JxVuvFYHnGAPT4rpvZEXV18URzq`, READY, serving both production domains. See [live recheck](live-recheck.json) for observation time and actual response identity.
- 192 first-round verified finals, 96 unscored Area games, all 96 scoring identities exactly match. No Area score states or submissions. Prior 680-route acceptance is complete; this run rechecked both domains and all 288 playoff records in the public snapshot without repeating the whole route sweep.
- Six eligible active school assignments: Albany, Cisco, De Leon, Goldthwaite, Hamilton, Hico. Only Cisco, De Leon and Goldthwaite participate in Area games. Six active admin/moderator accounts exist. No identities, contact information or account IDs are included in this packet.
- Three of 96 games have one participant-school scorekeeper assignment; 93 have none, and none have two. **Zero games have contributor availability confirmed by this audit.** The other three school assignments are eliminated-school coverage, not Area coverage.
- 48 Regional slots supported; zero confirmed Regional pairs and zero canonical Regional games. Do not repeat the completed La Villa–Chilton scoring identity repair.

## Open these in order

1. [Kickoff windows and staffing](kickoff-windows.md): exact window counts, proposed shifts, monitoring cadence, backlog and handoff thresholds.
2. [Priority 2A plan](priority-2a.md): all 32 2A games and the three existing school assignments.
3. [Complete 96-game matrix](coverage-matrix.md), with [full CSV and working evidence columns](coverage-matrix.csv). Every row has an exact Game ID, school slugs, CST kickoff/venue/city, source lookups, actual assignment status, proposed primary/backup, publication status and Regional destination. Sort/filter the CSV by window, priority or monitoring lane. A/B/C/D/E are role labels, not assigned people.
4. [Verification and publication checklist](score-verification.md): explicit final evidence, trusted scoring limits, stale-write handling and read-back acceptance.
5. [All 48 Regional dependencies](regional-advancement.md), with [CSV ledger](regional-advancement.csv): both Area inputs and the schedule/identity gates for each destination.
6. [Actual gaps and source caveats](coverage-gaps.md) and [source registry](sources.md).
7. [Verification evidence](validation.md), [aggregate audit](audit.json), and [summary counts](summary.json).

## Operating decision

Recommended staffing is four operators Thursday, five during Friday’s peak, and two for Saturday’s staggered games. These are proposed shifts, not new assignments. Use existing authorized accounts; adding 96 scorekeepers is unnecessary. E owns final publication and conflict escalation; A/B actively monitor 2A, while C/D emphasize verified finals for 3A/4A. Existing assigned scorekeepers may supply trusted LIVE updates **only after a moderator has opened a verified numeric LIVE state**. They cannot independently open or finalize games through that pathway. Finals require the existing moderation/publishing workflow.

The essential owner task is to confirm available existing operators and relief coverage for these shifts. The packet does not authorize outreach or permission changes. If availability is insufficient, use the explicitly slower final-only fallback; never turn unverified scores into a coverage claim.

## Keeping the packet current

The canonical repository remains the schedule source; production remains the score source. Recheck production and assignments before every shift. Update the audit observation and real availability only after verified evidence; keep identifying staff details in a private working copy. For game-night evidence use the blank evidence/reviewer/publication columns in a working copy of the CSV. These fields are deliberately blank, not fabricated commitments.

To regenerate schedule-derived documents from a checked-out repository (requires installed dependencies):

```bash
node --import tsx docs/area-game-night-operations-20261116/generate-packet.ts
```

The generator only reads repository games and the saved aggregate audit and writes this documentation folder. It never queries or writes production. It regenerates the matrix, kickoff windows, Regional dependency documents and summary only; reconcile the priority plan, gaps, source caveats and current audit manually before a new shift. Its outputs are a dated snapshot, not permission to apply stale assignments to future games. Follow the separate Regional publication checklist after winners are verified. No production code, logos, permissions or database data changed; no merge or deployment is requested.

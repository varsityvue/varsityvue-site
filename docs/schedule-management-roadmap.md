# VarsityVue Schedule Management Roadmap

Status: DEFERRED IN SEASON — POST-SEASON / OFFSEASON  
Recorded: September 2026  
Current interim method: schedules are submitted manually and added through the existing repository-backed workflow.

## Why this work is deferred

VarsityVue needs an internal schedule-management system so administrators can create and correct schedules, moderators can help manage future games, and verified coaches can propose changes for their assigned schools. The architecture audit showed that this is a substantial database transition, not a small administrator-form feature.

The transition is intentionally paused to avoid leaving the product between two schedule systems or consuming implementation capacity without reaching a safe production milestone. No code, migration, production data, or deployment was changed by the audit.

## Reconciled baseline — September 30, 2026

Status: POST-SEASON / OFFSEASON — Phase 1 DEFERRED IN SEASON unless schedule maintenance becomes a demonstrated bottleneck. Product priority authority: [ROADMAP.md](ROADMAP.md). This refresh authorizes no implementation, backfill or cutover.

Repository main: `81e5f8225a6ebd52850045a3e2a19f61301f769a`. Production deployment: `dpl_AVwXRNP6nSL8fcvYEYZk1XsbkteC`, READY and assigned to varsityvue.com/www.varsityvue.com. Read-only database snapshot: September 30, 2026, 18:55:28 UTC (13:55:28 CDT).

- 269 total `getGames()` rows: 249 actual regular/district games, 19 scrimmages, 1 bye.
- Eligible real-game catalog for this baseline: season 2026, gameType `regular` or `district`, explicit two-school matchup and stable unique ID. Do not replace 196 with 269; scrimmages/byes are excluded. Playoff eligibility requires an explicit future scope decision.
- 158 actual finals after verified game_state overlay; 91 upcoming; 0 awaiting results at this snapshot. Repository alone has 137 finals and 21 scheduled/awaiting rows; overlay resolves those 21. Never describe repository-only status as live truth.
- 30 game_state rows, all verified FINAL; 15 distinct Pick ’Em-linked games (15 rows); 114 approved score submissions; 0 active contributor assignments; 249 private.canonical_game_identity rows.
- Historical FINAL identities: 29 rows with both participant slugs NULL remain STILL ACTIVE; no repair performed. Resolve or explicitly account for them before cutover.
- Team Feed Phase 1 and Followed-Team Personalization V1 are shipped; cash contests are active. Existing school/game identity registries must be reused/reconciled, not blindly recreated as a new competing source.

Frozen baseline ID digest: `1ee13c4b81e3eedf95e0456c6f0fe3f360bbc260d91af2a017e9c74fcdfd0abf` (SHA-256 of eligible IDs sorted lexicographically, joined with LF, with one trailing LF; UTF-8). Expected count: 249 at the stated main. This ID digest does not certify field equality. At implementation, freeze a fresh eligible ID manifest, expected count, ID digest and deterministic normalized field digest at an exact commit; separately freeze overlaid fields and downstream reference snapshot. Count/digest must be reviewed, never mechanically updated to conceal drift. See [baseline evidence](roadmap-reconciliation-baseline-20260930.md).

September 22's 196-game/59-migration/deployment snapshot and counts were historical, not current acceptance criteria. Live migration count, precise-time gaps and schedule/outcome audit totals were not remeasured for this documentation refresh and are not asserted as current zeroes.

## Current architecture

### Schools and districts

School and district master data is repository-backed through:

- `data/schools.ts`
- `data/district-school-additions.ts`
- `data/districts.ts`
- `lib/schools.ts`
- `lib/districts.ts`

The rich school catalog remains repository-backed. Existing database-side identity registries now enforce selected writes; inventory them before adding any minimal school catalog.

### Games and schedules

The schedule is repository-backed. `lib/games.ts` assembles games from several data files, including the base catalog and later schedule/result additions. The public text game ID is used by Game Center URLs, statistics, scores, Pick ’Em, notifications, and other downstream records.

Supabase `game_state` is only a dynamic overlay. A `game_state` row whose game ID does not exist in the repository catalog does not create a visible game. Therefore, a simple administrator form writing to `game_state` cannot safely add schedules.

### Statistics and Pick ’Em

- Statistics remain repository-backed and keyed by immutable text game IDs.
- Pick ’Em weeks, configured games, picks, grades, and totals are database-backed.
- Existing game IDs must remain unchanged so statistics, Game Centers, score history, and Pick ’Em references remain intact.

## Approved target architecture

Move to one canonical database-backed game catalog. Do not build a permanent overlay that leaves repository games and database games as two independently editable schedule sources.

The target has:

- One canonical `public.games` row for each real game.
- One immutable public text ID per game.
- Both participating schools stored on that one row.
- School schedules derived by querying games where the school is home or away.
- Date, time, week, venue, and home/away corrections applied to the same row without changing its ID or URL.
- Existing repository games used as the frozen backfill source, then retired as a runtime source after verified cutover.
- Statistics allowed to remain repository-backed initially, still using the preserved game IDs.

### Required school identity foundation

Phase 1 must reuse/reconcile the existing database-side identity mechanisms and provide any missing minimal school catalog generated from normalized repository school data, without creating conflicting identity sources. Trusted database operations cannot securely validate school slugs against TypeScript-only records.

Schedule entry must use canonical school selections. Arbitrary typed school slugs or permanent free-form opponent names are not allowed.

## Authority model

### Administrators

- Create and publish games for any school.
- Edit schedules with revision, duplicate, state, and Pick ’Em protections.
- Approve or reject coach proposals.
- Use the existing dedicated outcome workflow for verified-final outcome corrections.
- Reopen Pick ’Em locks only through the existing audited administrator operation.

### Active moderators

- Directly create or update future, unplayed games.
- Approve or reject coach proposals.
- Cannot alter verified-final scores or exceptional outcomes through schedule management.
- Cannot reopen locked Pick ’Em games.
- Played, live, cancelled, or verified-final identity changes escalate to an administrator.

### Verified coaches

- Submit schedule drafts and correction proposals only for games involving a school to which they have an active coach assignment.
- Cannot publish directly.
- Cannot approve their own proposal.
- Cannot directly change game state, scores, outcomes, or Pick ’Em locks.
- May withdraw an unresolved proposal.

Coach verification will reuse active `contributor_school_assignments`, approved by an administrator. Production currently has no active assignments, so coach access must remain disabled until assignments are deliberately established.

### Other users

- Scorekeepers retain score authority only unless they separately hold another authorized role.
- Members and anonymous users have no schedule write authority.
- Inactive or suspended users are rejected regardless of a retained role or token.

## Planned database objects

### Minimal school identity catalog

A database-enforceable catalog of canonical school IDs/slugs sufficient to validate both participants and coach assignment scope.

### `public.games`

Expected fields include:

- Immutable text ID
- Sport and season
- Week
- Game type, phase, and occurrence/rematch identity
- Away and home school slugs
- Required local game date
- Nullable local kickoff time
- Nullable resolved `kickoff_at`
- `America/Chicago` time-zone handling
- Venue and venue address
- Neutral-site and district-game flags
- Source label and optional source URL
- Publication state
- Creation/update metadata
- Monotonic `schedule_revision`
- Soft-retirement state instead of ordinary deletion

### `public.schedule_proposals`

Stores coach proposals and corrections, including the proposed payload, target game when applicable, assigned-school context, source, reason, expected revision, workflow state, reviewer, review timestamp, and reviewer reason.

### `private.game_schedule_events`

Append-only audit history for create, update, approval, rejection, retirement, conflict override, and backfill events. It records actor, authority basis, before/after state, reason, source, revisions, proposal, and duplicate-conflict details. Direct client writes are prohibited.

### Trusted operations

Narrow, audited RPCs should cover:

- Submit schedule proposal
- Publish a new game
- Update a game
- Review a proposal
- Retire a game
- Read duplicate candidates

Any privileged function must authenticate with `auth.uid()`, verify active status and authoritative roles/assignments internally, use a fixed safe search path, revoke default execution, and receive only minimum grants.

## Core correctness rules

### Identity and corrections

- Preserve all existing game IDs exactly during backfill.
- A date, time, venue, week, or home/away correction updates the existing row.
- Never delete and recreate a game as an edit.
- Never change a public game ID merely because its descriptive wording becomes imperfect after a correction.

### Duplicate detection

- Normalize each matchup as an unordered school pair so reversed home/away submissions collide.
- Compare sport, season, pair, game type/phase, date, and week.
- Known-time and unknown-time versions on the same date are duplicate candidates.
- Use a transaction-scoped advisory lock so concurrent submissions from both schools cannot silently create two games.
- Reject ambiguity rather than guessing.
- A legitimate rematch requires an explicit occurrence/phase and administrator conflict override with a reason.

### Unknown kickoff times

- Store a real local date.
- Store kickoff time and absolute `kickoff_at` as nullable.
- Display `Time TBD` when the time is unknown.
- Never use midnight as a placeholder.
- Do not make a time-TBD game eligible for time-based Pick ’Em configuration or locking until a real kickoff is supplied.

### Byes and external opponents

- A bye is not a fake game with two participants. If the product later needs bye display, use a separate team schedule-event model.
- External opponents require a minimal canonical school identity. Do not accept permanent free-form opponent names.

### Emails and notifications

Schedule creation and editing must not add, enqueue, or send emails or notifications in the initial release. Registering newly created games for final-score notifications is a separate future product decision.

## Atomic publication behavior

Each canonical create, update, or approval must complete in one database transaction:

1. Authenticate the actor.
2. Confirm active account status.
3. Resolve administrator, moderator, or coach-assignment authority internally.
4. Lock the target row or duplicate advisory key.
5. Validate canonical schools and assignment scope.
6. Validate lifecycle and Pick ’Em restrictions.
7. Compare the expected schedule revision.
8. Run duplicate detection.
9. Create or update the canonical game.
10. Increment the schedule revision once.
11. Synchronize only eligible future, unlocked Pick ’Em lock data.
12. Supersede affected pending proposals.
13. Insert immutable audit events.
14. Return the authoritative row.

A failed operation writes nothing. Two editors starting from the same revision cannot both silently succeed.

## Planned administrator and contributor experience

Future route: `/internal/schedule-management`

The workspace should support:

- School, season, week, and status filters
- Full-season multi-row entry
- Canonical searchable school selectors
- Explicit home/away swap
- Date plus separate `Time TBD` control
- Venue, district-game, source, and reason fields
- Inline duplicate warnings
- Clear stale-revision recovery without losing entered data
- Coach proposal review with before/after differences
- Responsive desktop table and mobile game cards

Administrators and authorized moderators may publish an all-valid future batch. Coaches submit proposal batches. Batch results must be explicit and must never conceal partial success.

## Phased implementation roadmap

### Phase 1 — Canonical catalog and shadow parity

Status: DEFERRED IN SEASON — POST-SEASON / OFFSEASON. Resume early only for a demonstrated maintenance bottleneck and a separately reviewed controlled milestone.

- Add the minimal database school identity catalog.
- Add `public.games`, proposal storage, immutable audit storage, protected operations, grants, and RLS.
- Freeze the explicitly eligible real-game ID set at a known commit, with expected count and deterministic ID/field digests; exclude byes/scrimmages and separately decide playoff scope.
- Generate deterministic backfill SQL rather than manually retyping games.
- Insert exactly the frozen eligible IDs unchanged; fail on missing/extra IDs or any digest/field drift.
- Do not write `game_state`, trigger grading, change Pick ’Em, or create notifications.
- Record expected count and a deterministic catalog digest.
- Add a shadow reader that compares database and repository results while production still serves repository games.
- Do not expose schedule-management UI or change production reads in this phase.

Required parity includes the exact eligible ID set/count/digests and fields, school schedules, records, standings, Game Center URLs, score/stat associations, follows/notifications and homepage editorial links. Also require Team Feed game associations; existing school/game identity registries; current cash-contest frozen entry deadlines and per-game/tiebreaker locks; VOID handling when kickoffs move earlier; and score-correction/outcome revisions, grades, finalizations and winner-claim/payment relationships. Do not reopen locks, move a frozen deadline, generate notifications, rewrite audits or re-finalize claims as a side effect of schedule cutover.

Rollback: revert application code while leaving additive tables dormant. Existing behavior remains repository-backed.

### Phase 2 — Read cutover and administrator pilot

Status: DEFERRED / PARITY-GATED. No cutover until Phase 1 evidence and historical identity treatment are accepted.

- Cut reads to the database only after exact catalog and page-level parity.
- Enable schedule management for administrators only.
- Keep moderator publication and coach proposals disabled during the pilot.

Rollback: disable mutations, restore the frozen repository reader, and export any approved post-cutover schedule deltas before reverting reads.

### Phase 3 — Moderator publication and coach proposals

Status: DEFERRED; follows the administrator pilot and reviewed contributor assignments.

- Enable active moderators for future unplayed games.
- Enable verified assigned coaches to submit proposals.
- Monitor duplicates, stale revisions, audits, and downstream parity.
- Keep new-game notification registration out of scope.

## Required verification before any cutover

- Complete clean database rebuild
- RLS and role allow/deny tests
- Active/suspended account tests
- Coach assignment-scope tests
- Coach cannot publish or self-approve
- Administrator and moderator boundary tests
- Same and reversed matchup duplicate tests
- Known-time versus time-TBD duplicate tests
- Genuine two-session duplicate and stale-revision tests
- Proposal approval/rejection race tests
- Batch atomicity tests
- Pick ’Em lock and schedule-revision race tests
- Exact frozen eligible ID-set/count/digest and normalized field parity
- Unchanged Game Center URLs, records, standings, scores, statistics, Pick ’Em data, and locks
- No email or notification creation
- No ordinary schedule edit reopening a locked game
- Typecheck, lint, application tests, production build, database lint/advisors, and `git diff --check`

## Interim manual schedule process

Until the transition is implemented:

- Continue sending authoritative school schedules manually.
- Add them through the existing repository-backed schedule process.
- Reconcile each matchup once and share the same canonical game across both schools’ schedules.
- Check season, unordered team pair, date, and week to prevent duplicates.
- Preserve any existing game ID and downstream statistics or score references.
- Represent unknown kickoff times honestly rather than inventing a time.
- Keep schedule additions separate from outcome corrections, Pick ’Em lock changes, emails, and notifications.
- Validate school hubs, district hubs, Game Centers, records, standings, tests, and production safety after each bounded publication.

## Deferred items that remain separate

- Removing legacy standing overrides after schedules are complete
- Moving repository-backed statistics into the database
- Adding final-score notification registration for database-created games
- A dedicated bye-week calendar model
- Broader school-master-data administration beyond the minimal database identity catalog

## Resume condition and next implementation task

Resume post-season unless a documented schedule-maintenance bottleneck justifies separate owner review. Require enough time and capacity to complete and verify Phase 1 as one controlled milestone. Do not start with the UI and do not publish a partial catalog.

The single next implementation task is:

> Implement Phase 1 only: the minimal database school identity catalog, canonical games catalog, protected schedule operations, immutable proposal/audit storage, exact frozen eligible-set backfill, and shadow parity verification—without changing production reads or exposing schedule-management UI.

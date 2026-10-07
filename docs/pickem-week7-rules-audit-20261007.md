# Week 7 Pick ’Em rules audit — October 7, 2026

Reviewed main commit `d559dc6d3c74e5517261a3982851f5e53aa81747`, repository instructions, public contest/rules source, and live Supabase configuration, function definitions and trigger bindings. Production queries were read-only. Public contest retrieval independently showed the ten matchups and Friday deadline; the rules URL could not be retrieved by the web reader, so the exact rules text was inspected in the current repository.

## Verified configuration

All ten canonical identifiers and their display order passed live read-only assertions:

| Order | Canonical identifier |
| --- | --- |
| 1 | albany-at-stamford-2026-week-7 |
| 2 | anson-at-cisco-2026-week-7 |
| 3 | comanche-at-millsap-2026-week-7 |
| 4 | crawford-at-hubbard-2026-week-7 |
| 5 | de-leon-at-hawley-2026-week-7 |
| 6 | eastland-at-clifton-2026-week-7 |
| 7 | lampasas-at-stephenville-2026-week-7 |
| 8 | merkel-at-jacksboro-2026-week-7 |
| 9 | miles-at-winters-2026-week-7 |
| 10 | rio-vista-at-tolar-2026-week-7 |

- Status: open. Combined-points tiebreaker: Albany at Stamford.
- Frozen new-entry deadline and every individual game lock: October 9, 2026, 7:00 PM CDT (`2026-10-10T00:00:00Z`).
- Exclusive result cutoff: October 13, 2026, 12:00 AM CDT (`2026-10-13T05:00:00Z`). This includes the complete preceding Monday 11:59 PM minute.
- New entrants are rejected at or after the frozen deadline. Existing entrants can edit unlocked picks without changing original completion time. Predictions lock at the tiebreaker kickoff.
- Verified played and explicit-winner forfeit results grade picks. Ties, cancellations and no contests are VOID. A first verified final after the cutoff cannot revive a deadline VOID. Timely qualifying finals remain correctable.
- VOID tiebreakers omit the combined-points comparison; original completed-entry time and recorded entry order remain the fallback.

## Confirmed discrepancy and correction

`admin_resolve_pickem_contest_week` existed and correctly persisted cutoff VOID decisions, but repository-wide inspection found no application caller. The live database had no `cron.job` relation. The admin action called `admin_finalize_pickem_contest_results` directly; that database function rejects unresolved games. Consequently a missing result could block normal finalization after the cutoff until someone invoked the resolution RPC separately.

The admin finalization action now reads the saved cutoff and, at or after it, calls the existing authorized resolution RPC before finalization. A resolution error stops finalization. Before the cutoff, the existing finalization guards continue to apply. Missing or invalid cutoff data fails closed. Both public and internal contest views are revalidated after the attempt because VOID resolution can succeed even if finalization subsequently fails.

This remains an administrator-driven finalization workflow. The change does not introduce a background scheduler or promise automatic winner selection at midnight. No contest configuration, migration, rules, entry identity, original completion time, or historical grading data is rewritten by this package. Ordinary cutoff resolution uses the existing function to null any ineligible VOID grades, as intended by the established grading logic.

## Validation

- `npm run test:pickem-rules`: 10 focused tests passed.
- Four database tests execute the repository PL/pgSQL and standings view in an isolated PGlite PostgreSQL engine against synthetic tables/identities. They cover frozen deadlines, new-entry closure, individual locks, tiebreaker locks, original entry time, timely/late results, explicit-winner forfeits, tie/cancellation/no-contest VOID outcomes, idempotent resolution, retained entries/picks and VOID-tiebreaker ranking.
- Six orchestration tests cover the exact cutoff, pre/post-cutoff ordering, resolver failure, database finalization rejection, and invalid cutoff data.
- Existing lifecycle, client-state, week-summary and admin-submission suites: 38 tests passed.
- TypeScript compilation, targeted ESLint and whitespace checks passed.
- `supabase/tests/pickem_week7_configuration_readonly.sql` passed against the live project. This script contains no fixture writes and can be rerun through the contest's opening period; it intentionally asserts current Week 7 open status and configured locks.

The PGlite fixture verifies the actual function bodies and view, but does not recreate the entire Supabase schema, RLS policies, Auth service, or independent concurrent connections. No full Supabase integration/concurrency or authenticated browser flow is claimed. Live trigger bindings and deployed function bodies were inspected separately. No production write was used to test entry submission or grading.

The read-only live snapshot contained 29 entries, 290 picks, zero graded picks, zero contest resolutions and zero finalizations. These are observations, not a promise that entrant counts remain fixed while the contest is open.

GitHub searches returned no matching open Pick ’Em issue/PR. That is a bounded search result, not proof that no relevant work exists under another title.

## Release state

Prepared for review on an isolated branch. No merge, deployment, production migration, contest mutation or entrant contact was performed.

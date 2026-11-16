# Area game-night and Regional readiness — November 16, 2026

Baseline: main `32541117a5fca3719dcf5ec227c443ba49029c0b`, PR #161 merged.
Production deployment: `dpl_2vnWQDXB1M7K7CLdXWssT1YCwPna`, READY. Both production aliases assigned and HTTP responses identify that deployment.

## Production acceptance

`production-acceptance.json` records 18 live route/domain checks: three updated Game Centers; Tulia, Ballinger, Carlisle, Beckville, Franklin and East Chambers hubs and schedules; Playoff Central; both production domains. All passed. Live snapshot: 288 playoff games, 192 verified first-round finals, 96 unscored Area games. Direct browser inspection confirmed Playoff Central renders Area opponents and pending Regional slots.

## Confirmed fixes

- Shared explicit decimal score parser rejects blank/missing/file/scientific/hexadecimal/negative/out-of-range input in operational scoring and public report submission. Explicit zero remains valid. Existing roles, report review and final confirmation are preserved.
- An incomplete verified final payload cannot borrow a missing score from a previous live state and manufacture a winner.
- Operational score publication invalidates Playoff Central and both school schedules. Moderated approvals, corrections, outcomes and schedule changes also invalidate playoff readiness and school layouts.
- Existing admin-only, read-only publishing page now includes 48 Regional semifinal slots across all six divisions. It uses existing bracket topology and verified advancement; no hypothetical games or scores are published. Missing schedules, missing details and duplicate schedules are distinguished.
- New tests exercise all 96 Area finals into 48 Regional pairs, pending/partial/tied/unverified/no-contest results, duplicate schedules and winner-reversing corrections.

## Actual operational workflow

1. Admin/moderator enters an explicit score in `/internal/scoring`, reviews the final confirmation and publishes through `submit_trusted_score_update`. Optimistic concurrency rejects stale updates. Assigned scorekeepers retain the existing trusted-live-only pathway; other reports remain pending review.
2. A verified, complete, non-tied final advances its winner automatically in bracket views. Forfeit advancement requires an explicit official winner. Missing, disputed/unverified, tied and no-contest outcomes do not advance. Resolve disputes through existing moderation; do not infer a winner.
3. View `/admin/playoff-publishing` for the 48 Regional slots. Once both Area results establish a pair, publish a reviewed canonical `Regional Semifinal` record through the existing repository schedule workflow. Include school slugs, season, division/region, source attribution, neutral-site/designated-side presentation, and verified scheduling details; preserve TBD where unknown. Register the exact score slots before score entry. The runtime does not create Game Centers or database identities automatically. School schedules consume the same canonical Game catalog.
4. Correct results through the existing audited moderation correction/outcome flow, with reason and expected revision. Brackets recalculate automatically. If a correction changes a participant after a later-round canonical schedule was published, reconcile that schedule in the repository before further Regional publication. The readiness queue stops linking a schedule that no longer matches the confirmed pair; it does not delete historical records or rewrite downstream scores automatically.

## Production blocker: one missing scoring identity

Read-only SQL against production project `outsnqcwrqfllusnljtv` compared all 96 canonical Area IDs and both score slots to `private.canonical_game_identity`. **95 match exactly, zero conflicts, one absent:** `2026-area-2a-d2-iv-4` (away score slot Chilton, home score slot La Villa). These are canonical scoring slots, not confirmed physical sidelines.

The database trigger rejects an unregistered game with SQLSTATE 22023. Therefore La Villa–Chilton score publishing remains blocked until owner-authorized execution of `docs/release-sql/2026-la-villa-chilton-score-identity.sql`. This insert-only transaction is idempotent and aborts rather than overwrites an existing conflicting identity. Tested locally in PGlite for insertion, replay and conflict rollback. **Not applied to production.** No production writes occurred.

La Villa–Chilton kickoff and venue remain TBD. No Regional participants are confirmed yet. Logos and their separate inventory (88 Area participants, 93 eliminated schools requiring review) are unchanged.

## Validation

671 repository tests passed, including preserved first-round hashes and all 96 Area identities/school connections. Targeted ESLint and TypeScript passed. Isolated production build passed using the established network guard and local logo fixture. Final release and CI results are recorded in the draft PR. Authenticated score writes were not exercised against production; this was intentionally read-only acceptance.

## Release restriction

Draft PR only. Owner approval is required for merge/production deployment and separately for the exact identity SQL. Do not enter test scores into production, change permissions, or apply unrelated database changes.

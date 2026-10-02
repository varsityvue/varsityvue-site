# Public UUID Hardening V1 release sequence

This PR is draft-only. No production migration, grants, data, or deployment is authorized by implementation approval.

## Required three-stage release

Stage A clean checkout: `30474494e87201cfc0048215b11028aa57d6dc44`.
Stage B application checkpoint: `a817e4fcaa66e100fa16d3a53f8f0ec5cbe02963`.
The final PR tree also contains Stage C; it must not be used for the initial unrestricted migration push.

1. Apply ONLY `20261002200220_public_uuid_safe_contracts.sql` from a clean worktree containing that migration but not Stage C. The authenticated CLI dry run must list ONLY Stage A. Stop if it includes Stage C. New contracts coexist with existing readers.
2. Deploy the application commit from this PR after owner release approval. Verify the public, owner, reviewer, contributor, and winner readers use the new contracts. Existing production exposure remains until Stage C.
3. Apply ONLY `20261002200333_public_uuid_restrict_legacy_reads.sql` after the migrated application is READY and verified. Reverify the ledger and authenticated CLI dry run. Verify anonymous/ordinary-member REST denial and all safe contracts afterward.

Do not run an unrestricted `db push` from the final PR tree before stage 2: it would propose both migrations. Use an isolated Stage A checkout containing only the first new migration; after deployment use the final checkout for Stage C. Do not repair migration history, rename versions, or change SQL between release stages.

Rollback after Stage C cannot restore the old application alone: old leaderboard reads are deliberately denied. Prefer rolling forward; any access-control rollback requires separate owner approval. The old identity-bearing standings views remain internally available to trusted SECURITY DEFINER winner/grading/reporting routines but are not selectable by anon/authenticated.

## Read contracts

- `public_pickem_season_standings(integer)`: contextual presentation, point rank and row ordinal; original accuracy/UUID tie order stays internal.
- `public_pickem_week_standings(uuid)`: existing eligible locked weekly ranking, sanitized presentation and row ordinal.
- `own_pickem_season_summary(integer)`: current active account only, counts and existing point rank.
- `internal_pickem_week_standings(uuid)`: active reviewer only; internal stable identity preserved.
- `own_score_report_status()`: active current account only; report object ID, numeric tuple, status and times; no actor/reviewer/source/note/payload.
- `public_game_state`: verified rows only; explicit safe score/canonical/revision fields, no actor or source submission.
- `internal_pickem_weeks` (added with Stage C): active reviewer only; preserves full internal configuration snapshots.
- `internal_score_submissions`: active reviewer guard; explicit review fields, no ordinary-owner access.
- `internal_publication_provenance(text,text)`: active reviewer only; feed provenance additionally requires admin. Supports game/week/roster/feed identifiers, not arbitrary relation names.

Views intentionally use owner privileges with fixed column/predicate contracts. They are not generic profile directories. Profile base SELECT becomes self/reviewer scoped; public usernames resolve inside contextual definer contracts. No new base tables, IDs, hashes, profile pages, scoring authority or content behavior.

Score Scout's invoker orchestration changes only its approved-submission invariant read to the guarded reviewer view. Its signature, authority, game/evidence locks, stale checks, FINAL semantics and trusted publication call are unchanged.

Score submissions retain safe owner column grants for the unchanged community invoker INSERT/RETURNING contract; raw review fields move to the guarded reviewer view. Scoring events retain reviewer SELECT only; ordinary event writes are explicitly revoked. Trusted trigger/helper writes remain available.

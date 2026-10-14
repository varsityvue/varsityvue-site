# Explicit halftime scoring

Halftime can be selected in ordinary score reporting and the moderator scoring board, or selected/typed in the trusted LIVE form. It remains a LIVE period, preserves scores, clears the running clock, and displays `Halftime` on public surfaces using the shared live-period formatter. Moving to third quarter restores clock entry. Existing overtime text entry is retained.

Historical/current base: `5e1b8039c709efabde1642533469e9e359d23602`.
Local branch: `fix/score-halftime-20261014`.

The new `20261014175756_score_halftime.sql` migration modifies only `private.publish_trusted_score`: allow Halftime and clear its clock. The existing function fingerprint must match the audited production definition before replacement. Function signature, grants, authority checks, optimistic concurrency, PT409 errors, score-decrease confirmation and terminal protections remain intact. No historical migrations are edited.

Validation: 25 focused application tests; three local PGlite publication/migration tests; TypeScript; targeted ESLint (zero errors, two inherited warnings); isolated webpack production build and its prebuild suite; Package 1 static migration guard; diff check. PGlite tests exercise real publication and review function bodies but use synthetic identity/authority/corroboration scaffolding; they are not hosted Auth/PostgREST end-to-end verification. No production score submissions or other production mutations were performed.

Release order under separate production authorization:

1. Refresh main, deployment, migration ledger and exact trusted publication fingerprint.
2. Publish/review the narrow code candidate and verify an isolated preview with the migration installed there. Do not route synthetic writes to production.
3. Apply only the new halftime migration before releasing UI; do not push the repository's dormant optional migrations.
4. Release reviewed code and inspect score-entry/public display read-only. No dummy production score.

Rollback: revert the code to remove offered Halftime selection while retaining the migration's backwards-compatible allowance and existing halftime records. A database rollback would require separately reviewed SQL and is unnecessary for a code rollback. Do not restore retryable conflict codes or overwrite records.

Status: implemented and verified locally; no PR publication, production migration or production deployment performed. Existing restrictions on those actions remain in effect.

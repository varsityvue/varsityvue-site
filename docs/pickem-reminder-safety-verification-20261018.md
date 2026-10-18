# Pick ’Em reminder safety repair — October 18, 2026

## Scope and baseline

Repository/main and production both confirmed at `e165e600833c1da59efc9841d3d09a84773837ff`.
Production deployment: `dpl_2piLWWX9JLChiuSyycVUY5zRt7C2` (READY).
Read AGENTS.md, ROADMAP.md, pickem-growth-retention-plan.md, original reminder preference/enqueue/claim/delivery migrations, cash-entry migration, worker, unsubscribe logic and cron route. Production enqueue/claim definitions match the original September 20 migrations; the September 26 receipt/deadline work never updated those reminder functions.

## Root cause and changes

Reminder eligibility compared all games against public `pickem_picks`, even though unfinished cash-contest work lives in private draft tables and accepted entries have authoritative receipts. It also used individual kickoff windows and omitted the frozen new-entry deadline at claim.

Migration: `supabase/migrations/20261018184856_pickem_reminder_entry_safety.sql`.

- Private progress helper distinguishes no choices, partial choices, complete choices without a receipt, accepted receipt, disqualified receipt, ineligible account and closed contest. Counts validate matchup selections, deduplicate draft/public choices, and exclude void games. Complete choices do not prove prediction, phone or attestation completion; only the receipt proves acceptance.
- Both valid and disqualified receipts suppress new-entry reminders. Operator accounts are excluded consistently with contest acceptance. Existing account, consent, suppression and confirmed-address checks remain.
- Queue window uses stored `entry_deadline_at` (1–12 hours ahead) and retains the Texas daytime restriction. Claim, including stale/retry claims, requires the contest to accept new entries and uses `clock_timestamp()` rather than transaction-start time for deadline comparisons. Existing pending work is cancelled when examined and ineligible.
- Claim RPC signature stays compatible; its `lock_at` result now means frozen entry deadline. Public/game lock timestamps are unchanged.
- A worker-secret-gated pre-send RPC rechecks claim ownership, receipt, account, consent, address, suppression, contest state and deadline. The worker fails closed on errors/false and checks the returned deadline immediately before dispatch.
- Email text distinguishes no choices, partial choices and complete draft choices, describes remaining acceptance requirements without certifying eligibility, and preserves consent/preferences/unsubscribe links and one-click headers.
- Existing queue uniqueness, claim tokens, SKIP LOCKED, stale recovery, retry/backoff, provider acceptance records, frequency ceiling and provider idempotency key remain.

No historical migrations, production data, contest deadlines, game locks, eligibility/one-entry rules, schedules or credentials changed. No real emails were sent and no paid resources were provisioned.

## Verification commands

```
node scripts/test-pickem-reminder-safety.mjs
node --experimental-vm-modules --test scripts/test-pickem-reminder-worker.mjs
npx tsc --noEmit
npx eslint lib/product-email-worker.ts scripts/test-pickem-reminder-worker.mjs scripts/test-pickem-reminder-safety.mjs app/api/cron/product-emails/route.ts
npm run build
git diff --check
```

Worker tests use the actual transpiled worker source with synthetic RPC/provider boundaries and an `.invalid` recipient. They prove request construction, wording, suppression and error behavior, not provider acceptance, delivery or inbox placement.

Production read-only access verification: private queue and draft tables have RLS enabled and owner-only ACLs; preference policies require the active authenticated owner for reads/writes; receipt SELECT is restricted to the entrant. Existing privileged worker RPCs have empty search paths and secret checks. The new private helper has all PUBLIC/anon/authenticated privileges revoked; new send authorization has explicit worker-only secret enforcement despite API-role execute grants.

The existing isolated Supabase project `vedzxirmdrcerlnmcsdf` lacks reminder infrastructure. Remote tests therefore use namespaced synthetic tables/functions, rollback the entire transaction, and substitute schema references. This verifies actual PostgreSQL behavior without provisioning unrelated infrastructure, but does not constitute an end-to-end Supabase Auth/Data API deployment test. Local PGlite executes the migration SQL unchanged against fixture dependencies. Fixture authorization/digest stubs are documented in the test script.

## Production release sequence — separate authorization required

1. Refresh main, exact candidate tree, required CI, independent review and exact-candidate preview; reconcile intervening migrations. Confirm sender/worker configuration without disclosing secrets.
2. Coordinate a short reminder-processing pause/drain under separately authorized operational control. Do not allow an old in-flight worker to send during migration/application transition: old wording would misdescribe complete drafts, and old code lacks pre-send checks.
3. Apply ONLY the new migration transaction. It depends on existing cash-entry, reminder, preference, account-status, roles, suppression/config and receipt objects. Do not push unrelated pending migrations.
4. Verify function definitions/ACLs, private table RLS, migration ledger and rollback-only synthetic checks. No real member/email writes.
5. Merge/deploy the exact approved candidate. Confirm production SHA/tree and READY deployment, unauthorized cron returns 401, unsubscribe route remains accessible, and normal public Pick ’Em rendering works.
6. Resume the existing reminder cadence only after the new worker is active and old invocations have drained. Never invoke a real delivery as a smoke test without separate authorization.
7. Observe aggregate queued/processing/cancelled/provider-accepted counts, claim/authorization RPC errors, retries, suppressions and acceptance-persistence failures through the next normal reminder window. Check frozen deadline comparisons, duplicate acceptance IDs and valid/disqualified receipt exclusions without logging picks, phones, emails or member identifiers publicly.

## Rollback

Keep the safety migration installed if reverting unrelated application behavior. The old worker is not a safe fallback for reminders: pause reminder processing before an application rollback and leave it paused until compatible safety checks are restored. Prefer a forward corrective migration; do not restore historical deadline-free SQL or rewrite migration history. Queue acceptance/audit rows must be retained, and frozen deadlines/receipts must never be edited as a rollback mechanism.

## Limitations

A database authorization and local deadline check cannot guarantee that an email provider accepts, delivers or places a pre-deadline dispatched message in an inbox before the deadline. Network/provider latency and already dispatched messages are outside transactional database control. Tests assert no claim or dispatch when the relevant deadline checks are reached at/after the stored deadline. A concurrent consent/receipt change after final authorization is similarly not atomic with the external provider; existing idempotency prevents duplicate provider requests from becoming duplicate deliveries within provider guarantees.

No live-provider/inbox, real-recipient, production migration, production worker execution, schedule change, merge or production deploy is included in this preparation.

## Executed results and independent review

- TypeScript `npx tsc --noEmit`: PASS.
- Relevant ESLint on worker, both test scripts and cron route: PASS.
- Worker synthetic tests: 15 passed, 0 failed. Includes missing/invalid/reached/passed deadline suppression, revoked/failed send authorization, incomplete versus complete draft wording, provider/network errors, idempotency headers, one-click unsubscribe and repeated Texas fall-back hour CDT/CST labels.
- Local migration/PGlite tests: 49 assertions passed. Includes receipt/status distinctions, missing phone/prediction/attestation without receipt, deadline before/at/past, staggered kickoffs, queued retry/delayed claim, void games, operator/suspended/unsubscribed members, suppression, duplicates/stale tokens, pre-send revocation, queue window/dedup and function grants.
- Existing isolated Supabase PostgreSQL 17 project: 16 assertions passed with namespace-substituted fixture SQL; transaction rolled back. Result: `PASS: 16 isolated PostgreSQL17 fixture assertions; namespace-substituted SQL, stub auth/config/digest; rolled back`. An earlier tool invocation stalled without a result; subsequent bounded execution returned PASS. No success is inferred from the stalled call.
- Production build: PASS, including 67 prebuild tests (0 failures).
- `git diff --check`: PASS.
- Independent read-only final reviewer: PASS, no implementation blockers. Reviewer independently ran the initial 35 SQL assertions and all 15 worker tests. Expanded 49-assertion SQL suite was additionally executed by the SQL test author and primary implementer. Runtime implementation remained unchanged during that expansion.
- Reviewer observation: a send-authorization RPC error or final local deadline suppression can leave the row processing until existing stale recovery. This fails safely; no provider request is initiated.

Unexecuted: real-provider email/inbox delivery; full Supabase Auth/Data API end-to-end workflow with the repaired public RPCs; simultaneous multi-connection load/concurrency test. Duplicate and stale-token behavior is exercised sequentially; existing SKIP LOCKED/claim-token/unique-queue behavior is preserved. Production was not used for synthetic writes or delivery tests.

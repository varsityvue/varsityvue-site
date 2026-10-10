# Package 1 isolated verification

Never run these commands against production. The native harness rejects non-loopback hosts and uses the dedicated disposable sandbox path `/vercel/package`, database port 54322, API port 54321, Auth port 9999 and app port 3000. Vercel exposed routes must be empty and test execution must use deny-all egress. No production environment files, records or credentials may be copied. Runtime JWTs/passwords are generated or scoped exclusively to the disposable fixture and must not be included in release evidence.

The verified native components are PostgreSQL 17.11, PostgREST 14.5, GoTrue Auth 2.197.0 and Playwright 1.63.0. Application dependencies use package-lock.json through npm ci; extra test tools live separately in `/vercel/test-tools`. Storage catalogs are migration scaffolding, not a running Storage service or Storage certification. No external email, OAuth, captcha or production stress verification is claimed.

Bootstrap official binaries in a temporary sandbox with an allow-list for official package sources, then disable external egress before application execution. Initialize a fresh PostgreSQL cluster on loopback port 54322; the test-only postgres password is `isolated-fixture-only`. Run:

```sh
cd /vercel/package
python3 supabase/tests/week8_p0_platform.py
PGHOST=127.0.0.1 PGPORT=54322 PGPASSWORD=isolated-fixture-only \
  python3 -u supabase/tests/week8_p0_migration_verify.py
node supabase/tests/week8_p0_runtime_bootstrap.mjs
```

The runtime bootstrap remains running in its own process; launch the HTTP/browser tests from another controlled sandbox command:

```sh
cd /vercel/package
node --import tsx scripts/test-week8-p0-runtime.mjs
```

Use a whole-command 240-second deadline for database verification, 180 seconds for runtime verification, and the runner's 60-second race deadlines. `game_score_corrections.sql` deliberately crosses a real 30-second contest close; a 30-second outer deadline is insufficient. Its actors and phone bindings are now independent from other suites. A failed run with committed synthetic fixtures may require disposal/recreation of the environment; do not use cleanup patterns against any shared database.

Fresh repository replay includes dormant coverage and ingestion migrations solely to verify installation compatibility. Production upgrade scope is the 80 installed versions plus the Package 1 migration. The emergency mirror is already applied. Never add dormant migrations to a production release because a fresh-install test passed.

Actual Supabase CLI 2.100.1 upgrade and duplicate-skip verification uses `db push --db-url` with an explicit loopback disposable database and an isolated migration directory containing exactly the installed 80 files. Add only `20261010013150_week8_p0_nonretryable_business_conflicts.sql`, push, and push again: ledger must contain 81 entries, one emergency mirror, one Package 1 entry; second push must say up to date. Do not use `--include-all` to accidentally apply dormant migrations. The direct SQL runner additionally proves repeat execution is rejected by fingerprint guards. An isolated altered-definition fixture must reject the complete new migration atomically.

Build with real repository logo resolution and an external-fetch prohibition:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=isolated-build-placeholder \
NODE_OPTIONS="--import=$PWD/scripts/week8-p0-build-network-guard.mjs" \
P1_LOGO_FIXTURE="$PWD/public/logos/varsityvue-logo.png" \
npm run build -- --webpack
npx tsc --noEmit
node scripts/test-week8-p0-migration.mjs
node --import tsx --test lib/member-status.test.ts lib/business-conflict.test.ts lib/score-conflict.test.ts
```

Webpack is supported by the installed Next version and avoids the local worktree's external node_modules symlink restriction. The fetch guard changes only verification dependencies: one exact production-logo URL resolves from the identical local file; all other non-loopback fetches fail. It is not loaded by production application configuration. The CI build now uses the same loopback settings and guard.

Release evidence must distinguish the initial failed fixture/configuration attempts from the successful reruns. GoTrue bootstrap must set its connection search_path to auth before its first migration and API-created synthetic users must explicitly use authenticated JWT role. Browser sessions are obtained through real Auth, not manually signed contributor tokens. Database permissions are granted only to synthetic fixture actors. Exact final head/tree, tested-source hashes, raw redacted logs, catalog-comparison digests and the independent whole-package review belong in the release report.

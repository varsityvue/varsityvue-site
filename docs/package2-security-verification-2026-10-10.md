# Package 2 dependency remediation and verification — 2026-10-10

The preserved dependency patch is now applied to package.json/package-lock.json; its redundant compressed transport artifact is removed. Package 2 includes the inherited public resilience changes and the final optional article follow fix, cancellation fix, monitoring unknown states, operations/runbook and real-platform verification harness. No application publication logic, migration, permission or RLS change is included.

## Dependency disposition

- Next.js and eslint-config-next pinned to 16.4.0; Sharp pinned to 0.35.5; nested source-map-js remediation retained.
- Fresh npm audit: **five high, zero critical**, all inherited lint-chain findings through `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces@3.0.3`. Registry latest braces is 3.0.3. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version. No runtime application import of that linter chain was found. The suggested downgrade to eslint-config-next14 is an incompatible framework mismatch and is not applied. Track upstream; do not claim zero vulnerabilities. Isolated lint inputs are trusted repository files.
- Previously applicable Next Server Action DoS/conditional image concerns no longer appear in current audit ranges. No exploitation or compromise was established or tested. This candidate is not a penetration test.

## Verification

Evidence is retained in `docs/package2-evidence/`.

- 23 focused public resilience/monitor runner/verified-score/account-status tests: pass.
- Broad lib/data unit suite: 391/398 pass. Seven failures reproduce on unchanged production main using the same tooling: historical Week4 stat reconciliation, three coverage-demand count expectations, district schedule and two Week5 catalog/homepage expectations. These unrelated baseline failures are recorded explicitly, not repaired or hidden.
- Required prebuild:64/64 pass. TypeScript passes. Lint:0 errors,13 existing warnings. Production Next16.4 build:80/80 static route generation, pass.
- New native isolated PostgreSQL17.9 with client17.10, GoTrue2.197.0, PostgREST14.5 and Playwright1.63/Chromium153 fixture: production baseline replay, all11 fingerprint checks, guarded Package1 upgrade and exact ACL/RLS preservation, duplicate guard, full fresh replay,12 SQL regressions,4 independent-connection races and genuine40001 behavior all pass.
- Package2 production-browser failure matrix: normal, follows503, editorial503, feed503, slow follows/editorial, all Data API503/504, score503 and recovery; anonymous and authenticated visits pass. Synthetic published79/83 scores disappear under unavailable score data and return on recovery; unaffected public content and warning messages remain accessible; private diagnostics and identity are excluded. Missing follows remain usable. Eight concurrent local requests retain one score RPC per request. Local availability runner passes.
- Package1 real Auth/HTTP/browser regression rerun against the production build passes: PT409 single execution, stale save cannot overwrite winner, account service failures preserve sessions and deny mutation before RPC, restored service recovers, revoked assignments/suspension denied, anonymous protected-route denial and admin/moderator access preserved.
- Initial disposable-image browser failures were traced to missing fonts/fontconfig; after installing fixture dependencies, full production-browser checks passed. This was test-environment remediation, not a weakened assertion.
- Independent whole-package review found no remaining material code/security/privacy defect; requested browser score/warning assertions and counter reset were implemented and verified. Final exact-tree review evidence is included in the release report.

## Boundaries and remaining verification

Main/production baseline is ae2860b13f27108c38e169a26e035d1bd10b23bb, production deployment dpl_4skqFgMzFgixbYoVGEYNVwvqPkdo READY; migration20261010013150 and trusted-publication fingerprints confirmed read-only. No production deployment/write/load, scoring changes, permission/RLS change, monitoring activation, notification or subscription change occurred.

Storage uses fixture schema scaffolding; OAuth/email delivery, production region/capacity behavior, plan entitlements, actual recurring monitoring cost and alert delivery remain unverified. The50/100/250/500 visitor specification remains separate. Broad baseline test failures and the five lint-chain audit findings remain visible release limitations. Deployment/merge and monitoring activation require separate owner authorization. See `package2-game-night-operations.md` for configuration, thresholds, costs, deployment/rollback proposal and acceptance criteria.

# Package 2 dependency remediation checkpoint — 2026-10-10

Status: **NOT release-ready. Do not merge, deploy, or activate monitoring.**

Parent checkpoint `760fb86f8de745873bc048b292f8b257201e5580` is preserved. Expected production/main `ae2860b13f27108c38e169a26e035d1bd10b23bb`. This branch changes only dependency versions/lock and adds this verification handoff; the Package 2 resilience work is inherited unchanged.

## Dependency disposition

- `next` exact `16.2.6` -> `16.4.0`, corresponding `eslint-config-next` exact `16.2.6` -> `16.4.0`. The previous version was within GHSA-m99w-x7hq-7vfj (Server Action denial of service); current package clears the Next advisory ranges flagged in the fresh npm audit. Applicability to App Router/Server Actions was established; exploitation was not.
- `sharp` previously floated `^0.34.5` -> pinned `0.35.5` to address affected native-image advisories. User-uploaded bytes reach Sharp metadata parsing; format filters alone were not a complete defense. No exploitation or compromise evidence.
- `npm audit fix --ignore-scripts` updated one nested `source-map-js` package, removing its event-loop-DoS advisory.
- Fresh npm audit changed from nine findings (eight high, one critical) to five high, zero critical. All five remaining advisories are inherited transitive lint tooling under `eslint-config-next@16.4.0 -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces@3.0.3`. On this registry braces@3.0.3 is the highest available version. npm suggests downgrading eslint-config-next to 14.2.35, which is an inappropriate framework mismatch. Do not claim zero vulnerabilities; track official patched tooling or upstream remediation. No application runtime import of the linter chain was established.

## Executed tests

- `node --import tsx --test lib/package2-resilience.test.ts lib/public-read-contracts.test.ts lib/public-score-loader.test.ts lib/member-status.test.ts lib/follow-personalization.test.ts` — 24/24 passed.
- Additional focused public-score/follow/unified Games tests — 27/27 passed.
- `npx tsc --noEmit` — passed.
- `npx eslint app lib scripts --quiet` — passed.
- `npm run build -- --webpack` — passed including prebuild and route compilation.
- `git diff --check` — passed.

## Outstanding release gates

NOT run/verified in this resumed workspace: full isolated database/PostgREST/GoTrue/Auth/RLS integration and concurrency, authenticated/anonymous browser failure injection, package-wide concurrency under a contained runtime, complete monitoring runner/delivery integration (monitoring must remain disabled), and an independent exact-head whole-package review. The previous checkpoint also lists these as missing. Do not reuse Package 1's isolated tests as proof of Package 2.

No production deployments, database writes, load testing, live score changes, permissions/RLS changes, monitoring activation, notifications, billing or compute adjustments occurred. The Vercel sandbox is isolated and exposes no ports; production credentials and data were not supplied.

## Next required action

Finish a disposable native Auth/PostgREST/DB/browser verification boundary, execute missing Package 2 failure/recovery tests and independent review, and evaluate remaining tooling advisories. Keep the PR in draft until all required gates pass and obtain a separate production release authorization.

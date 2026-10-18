# PR #97 final verification — October 18, 2026

## Identity and scope

Approved starting candidate: b78c84d46b057bbc4e876827e053337146ec1769.
Refreshed main: d163799b863056c424cbca41e64d48f6220ba858 (unchanged, no intervening reconciliation needed).
PR remains draft. No production release, production configuration, migrations or production writes.

The follow-up commit containing this report changes only three presentation components and verification documentation. Browser tests demonstrated two issues: compact historical dates measured 2.59:1 contrast, and Stephenville's title split mid-word at 375px. Fixes are restricted to enhanced/compact pilot modes: brighter result metadata and coverage labels, plus a 28px mobile heading for long school names. Default non-pilot classes remain intact. Source data, authentication, follow actions and analytics modules are unchanged.

## Supported browser method

Playwright with npm-packaged @sparticuz/chromium 153.0.0, installed outside the repository. Its documented Playwright launch method uses an explicit executable path. Packaged Brotli assets were extracted with ownership preservation disabled because the runtime rejects archive chown. No application dependency changes. No retry of the failed Playwright CDN download.

Remote Vercel access from this local browser returned ERR_EMPTY_RESPONSE. Therefore exact-source production-build responsiveness was tested locally; Vercel preview rendering and SHA identity are checked separately through the connected preview tools. This is not evidence from physical iOS/Safari devices.

## Executed browser matrix

| CSS viewport width | De Leon | Cisco | Goldthwaite | Albany | Stephenville | Hico |
| --- | --- | --- | --- | --- | --- | --- |
| 375px | PASS | PASS | PASS | PASS | PASS | PASS |
| 390px | PASS | PASS | PASS | PASS | PASS | PASS |
| 768px | PASS | PASS | PASS | PASS | PASS | PASS |
| 1366px | PASS | PASS | PASS | PASS | PASS | PASS |

All 24 checks passed: HTTP 200, correct heading/pilot boundary, one existing Follow control, no horizontal document overflow or application page exceptions, and keyboard traversal reached Follow. Stephenville's corrected phone heading was explicitly measured as one line. Browser image checks found no broken loaded content images. Screenshots were inspected internally.

Both original-candidate and fixed-candidate matrices ran. The fixed-candidate matrix blocked external API fetches at the server boundary, exercising existing public fallback data and honest unavailable-feed states without production writes. It is not a claim that fresh production scores were fetched in that matrix. The original-candidate Vercel desktop checks already confirmed current verified results and attribution.

## Isolated rendering and interaction fixtures

Actual candidate components and production CSS were rendered with explicit boundary adapters: Next Link became a normal anchor; follow server actions and telemetry were replaced with in-memory test endpoints/event recording; storage URLs were fulfilled with synthetic image bytes. No synthetic records were published or sent to production.

44 render checks (11 variants at each of four widths) passed. Variants: unchanged/default component comparison, corrected final, verified live/halftime/contributor attribution, unverified live, kickoff window, future scheduled game, forfeit/outcome provenance, long school name with missing logo/photo, existing unusual school logo, empty content, and feed pagination failure. Unverified numbers 999/888 never appeared in the game focus. Public schedule/Game Center links remained present.

Populated feed checks used portrait 900×1600, wide 1600×600 and square 1000×1000 synthetic graphics. Images loaded, object-fit remained contain, hub image height stayed at or below 640px, long unbroken captions wrapped without overflow, and associated Game Center links remained. Empty-feed and load-more error states rendered correctly. The read/publish/storage authorization pipeline was not recreated or exercised.

Five additional actual FollowControl UI workflows passed at 375px: signed-out intent, authenticated follow/unfollow, initially following, finish-following, and unavailable account state. Keyboard Enter activated the control. Error/retry behavior passed. Asserted request/event counts: signed-out 1/1, follow 4/3, initially-following 1/0, finish-following 4/3, unavailable 0/0. Each follow click emitted one Follow Intent, unfollow emitted none, and school/surface/authenticated fields matched. These are UI/action-adapter tests, not real Supabase authentication/session/cookie or database-write tests.

## Accessibility

Axe WCAG 2 A/AA and 2.1 AA checks ran across all hub/viewport pairs. No non-contrast violations were reported. Contrast failures remain in inherited shared site branding/navigation, standings labels and footer styles; full pages are not claimed WCAG AA compliant. Fixed pilot result and editorial labels no longer appear in the contrast failures.

The isolated enhanced component fixture reported zero A/AA violations at all four widths. The default/unchanged component comparison reported contrast failures (five at 375px). Keyboard traversal and Enter activation were tested; the retained Follow control remained focusable. No screen-reader or physical-device certification is claimed. Shared legacy contrast debt affects low-vision readability and should be addressed in a separately bounded accessibility change; no scores, authorization or data integrity are implicated.

## Automated checks and independent review

- TypeScript, targeted ESLint and git diff --check: passed after the fixes.
- Ten affected pilot/render tests: passed locally and independently.
- Twenty-one adjacent member-status, business-conflict, follow and feed/image-validation tests: passed locally.
- Production build: passed, including all 67 prebuild tests.
- Independent original-candidate review: 32 tests and targeted lint passed; no authority/provenance, pilot-isolation, media-containment or follow-wiring defects. Reviewer identified the compact-date contrast concern, subsequently confirmed and fixed in browser tests.
- Independent review of the minor fixes: no defects found; changes correctly pilot-gated.

Both required original-candidate GitHub workflows completed successfully: Followed-team V1 verification and Unified Games and Scores. The final published SHA, its new CI results and matching Vercel preview result are recorded in PR #97 after publication; original CI is not substituted for changed-candidate CI.

## Authentication and release risk

Real isolated Supabase/Auth end-to-end testing was not available in this runtime (no local Supabase/Docker/Postgres service). Production login, follow mutations, scorekeeping and Pick 'Em submissions were not executed. Existing unchanged authorization logic, regression tests, actual-component UI fixtures and independent review provide proportional evidence for this presentation-only change, not proof of real authentication success.

The original candidate's mobile-verification blocker is resolved. Remaining release gates are successful required CI and exact-preview reconciliation for the published follow-up commit. Existing shared contrast debt and unexecuted real Auth/physical-device tests are explicit limitations, not hidden passes. No production merge/deployment is authorized. Revert the presentation commits to restore the prior UI; no database rollback is needed.

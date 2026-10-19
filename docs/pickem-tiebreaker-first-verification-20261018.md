# Pick ’Em tiebreaker-first presentation — October 18, 2026

## Scope

Base main/production: `cc597027e85060261aded61dfb3dc3396940f532`.
Branch: `fix/pickem-tiebreaker-first`.

The existing helper applied only to 2026 Week 6. It now moves the saved tiebreaker row to the first public slate position for any week/season, preserving all other rows’ relative order and object identities. Both guest and authenticated views receive the same ordered array from the page. Game numbers follow presentation positions; selections still use game IDs. No database writes, stored sort order, deadlines, locks, grading, receipt handling, prize/rules or homepage changes are included.

Missing/outside-slate tiebreakers return the original order; cash-contest page logs a diagnostic containing only season/week. Existing void-game omission and void-tiebreaker notice remain unchanged. Historical member picks, weekly standings, season standings and administrator records retain their existing order. The administrator setup remains a representation of stored configuration rather than being renumbered as the public slate.

## Executed verification

- `node --import tsx --test lib/pickem-display-order.test.ts lib/pickem-client-state.test.ts lib/pickem-page-loader.test.ts`: 19 passed.
- `npx tsc --noEmit`: passed.
- Targeted ESLint on four changed implementation/test files: zero errors; one pre-existing unused-variable warning in the browser harness boundary adapter.
- `npm run build`: passed, including 67 prebuild tests. Existing image width/height warnings appeared during static generation.
- `PICKEM_CHROMIUM_EXECUTABLE=/tmp/chromium node scripts/test-pickem-mobile-browser.mjs`: passed at 375, 390, 768 and 1280 pixels across nine states per width, plus keyboard, short-viewport, navigation overlap and uncertain-write recovery checks.
- Browser fixture renders actual production components and CSS with isolated network/server boundaries. It verifies Game 1/tiebreaker badge, the full guest/member input-name order and retained saved selection; no production session or real entry submission is involved. This is not full authenticated preview end-to-end verification.
- `git diff --check`: passed.
- Independent reviewer ran 30 ordering/client-state/week-summary tests, TypeScript and targeted lint; initial implementation review passed. Final browser-test review and exact-candidate preview evidence are reported in the PR/final release report.

## Production read-only baseline

At `2026-10-18T22:34:55.477114Z`, Week 9 was open, revision 3, with 0 valid accepted entries.
Week ID: `22dff9a9-4786-468f-93d2-6371b5074ae9`.
Entry deadline: `2026-10-24T00:00:00Z` (October 23, 7 PM CDT).
Outcome boundary: `2026-10-27T05:00:00Z` (October 27, midnight CDT).
Stored slate fingerprint: `52002e1d41ca3c6614a82dfa4da20b86`.

## Release and rollback

No migration is required. After separate merge/deployment authorization, refresh main, review exact candidate/checks/preview and confirm Week 9 stored slate/deadlines remain unchanged. Verify public guest and member Game 1 after deployment. Rollback is an application revert only; do not edit the live database slate. Production is deliberately unchanged during preparation.

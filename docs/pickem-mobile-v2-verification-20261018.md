# Pick ’Em Mobile Experience V2 — October 18, 2026

## Baseline and scope

Main/production: `3cef8fb2c2af5b47548e22f0526074ecb52c3b36`, deployment `dpl_96HaA2bJn2v28CTvxxde4x9GHFRw` READY. Read AGENTS.md and installed Next.js page/use-client guidance. Reviewed released PR100 (entry status, optional recovery, safe-area action bars) and PR102 (shared stable tiebreaker-first ordering).

Picks, My Results and Standings are separate accessible tab panels. Picks is the open-contest default; closed contests emphasize Standings, with existing selections still available in Picks. Signed-out Results explains sign-in while leaving public Picks/Standings available. All panels remain mounted: hiding a form does not reset selections, required fields, dirty/uncertain state or reconciliation. Existing form/action identity and server authorization are unchanged.

URL fragments preserve query strings and same-document browser history. Legacy `#my-picks`, `#weekly-standings`, `#season-leaderboard` reveal and scroll the corresponding panel, including late optional server sections. Arrow Left/Right, Home/End, Space/Enter, roving tab focus, selected state, panel names and stranded-focus recovery are supported.

Header, receipt-status framing, progress and cards are more compact. Logos, school colors, names, home/away labels, selected feedback, kickoff/lock state and Game 1 tiebreaker remain. No extra fixed navigation was added. Existing safe-area-aware action offsets and the global bottom navigation are unchanged. Required fields remain visible in Picks with authoritative receipt and uncertain-save language intact.

## Safety boundaries

No database, migrations, actions/recovery, loading queries, acceptance calculations, deadlines, game locks, grading, winner/prize/eligibility rules, reminder logic, consent, homepage or unrelated PR changes. History order and standings calculations remain authoritative. Optional reads remain server Suspense/recovery slots under the existing bounded read scope; they cannot disable the entry form. Switching views does not submit a request or claim acceptance.

## Executed checks

- TypeScript: PASS.
- Relevant ESLint across changed source/tests: PASS, zero errors (an existing unused-variable warning in the isolated adapter was removed when expanding the baseline adapter).
- 27 targeted tests: `node --import tsx --test lib/pickem-view.test.ts lib/pickem-display-order.test.ts lib/pickem-client-state.test.ts lib/pickem-page-loader.test.ts lib/pickem-entry-presentation.test.ts`.
- Production build PASS, including 67 prebuild tests.
- `git diff --check`: PASS.
- `PICKEM_CHROMIUM_EXECUTABLE=/tmp/chromium PICKEM_AXE_MODULE=axe-core node scripts/test-pickem-mobile-browser.mjs`: PASS.
- Actual production components/CSS tested at 375/390/768/1280px: guest empty/selected, draft, accepted, locked, graded/finalized, disqualified, closed draft, failed optional sections (including open entry), long names. Checks cover no horizontal overflow, first tiebreaker and remaining ID order, mounted-node identity, preserved selection/phone/prediction/attestation, history/Back/deep links, Arrow/Home/End keyboard navigation, keyboard selection/save, short-height viewport, no mobile action/navigation overlap, and uncertain-write reconciliation without replay.
- Axe WCAG2A/AA and WCAG2.1A/AA tags: zero violations across all three visible views in guest/draft/accepted/locked/graded/optional-failure fixtures. This is partial automated verification, not a full accessibility-compliance certification.
- Independent reviewer: PASS after correcting legacy-anchor scroll restoration. Reviewer independently passed TypeScript, 20 targeted tests and the browser/axe matrix; final header/focus refinements reviewed with no blockers. Primary expanded final matrix passed afterward.

The standard Playwright CDN download was unavailable. Browser checks used isolated npm `@sparticuz/chromium@143.0.4` binary with the existing Playwright harness, without runtime dependency or lockfile changes. Network/server boundaries are synthetic; no real member data or email delivery is used. Hardware iOS keyboard/safe-area behavior and live authenticated preview submission are not established by these fixtures.

## Before/after comparison

Same 375px accepted-member fixture, same ten games, long-name data and production CSS; baseline components loaded from the exact production commit. Header fixture uses sponsor text fallback rather than a network-loaded logo.

- Stacked page height: 3815px -> 2565px (33% reduction).
- First card top: 633.5px -> 405px (228.5px earlier).
- First card height: 161.5px -> 141.5px (12% reduction).
- Default V2 view exposes one panel; Results and Standings are no longer stacked below Picks.

Metrics describe isolated component fixtures, not universal live-page dimensions. Both screenshots were visually inspected.

## Production preservation

Read-only check `2026-10-19T03:39:47Z`: Week9 open, revision3, 0 valid entries, entry deadline `2026-10-24T00:00:00Z`. Stored slate hash `52002e1d41ca3c6614a82dfa4da20b86`; homepage hash `4120a622f4f1e1684daa3039b8d34ddd` unchanged from released baseline.

## Preview and release

Exact-candidate preview and PR evidence are recorded in the PR/final report after publication. Release is separately unauthorized. No migration required. After approval, refresh main/checks and exact tree, deploy through normal reviewed release, then verify all three views, direct legacy hashes, guest/member state preservation and unchanged production contest rows. Rollback is an application revert; never alter contest data or restore old reminder functions as part of UI rollback.

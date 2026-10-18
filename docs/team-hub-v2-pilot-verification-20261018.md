# Team Hub V2 pilot — October 18, 2026

The initial verification limitations below are superseded by [the final verification report](team-hub-v2-final-verification-20261018.md), which records real mobile/tablet browser checks and demonstrated presentation fixes.

## Scope and baseline

Continues `feature/team-hub-v2-pilot`, preserving c55dbcdb and 72d28d7. Main was refreshed and remains d163799b863056c424cbca41e64d48f6220ba858. No intervening changes required reconciliation. Existing unrelated scratch checkouts were left intact. Read AGENTS.md, the installed Next.js 16.4 Server and Client Components guide, ROADMAP.md and team-feed-plan.md.

Only De Leon, Cisco, Goldthwaite, Albany and Stephenville opt into V2. No routes, IDs, database schema, production config, content records, authentication actions or analytics events change. No externally sourced media was introduced: the hero uses existing school logos/colors/stadium images; coverage uses already published article images and credits.

## Design assessment

Before: desktop next-matchup hero and mobile season pulse diverged; repeated matchup/record cards dominated; editorial coverage followed standings; the initial spotlight omitted date, author, excerpt and photo credit.

After: mascot-led identity with existing branded background/watermark; one server-rendered game focus across breakpoints; verified live > kickoff window (explicitly unavailable live score) > latest final > scheduled next game. Next opponent is a compact companion. Older finals use compact cards and are labeled Earlier results when the latest final is already featured. Coverage precedes the existing feed, results and statistical sections, includes a dated feature with byline, excerpt and existing photo credit, and does not repeat its article among secondary cards. Older secondary stories are dated. Team Feed graphics remain uncropped and long captions wrap; empty/error states remain honest. Existing follow control is present once and unchanged.

Pilot removes the duplicated Season Pulse Last 5/PF/PA/differential summary; hero record/averages, standings totals, player leaders and schedule/roster links remain. Underlying data is unchanged.

## Executed local checks

- `npx tsc --noEmit`: passed.
- Targeted ESLint on changed TypeScript/TSX: passed.
- 189 regression tests covering pilot game selection, game presentation/discovery, scores, follows and Pick ’Em: passed. Includes six new selection tests.
- Four server-rendered regression checks: passed (earlier-result label/default non-pilot mode, verified versus unverified score display, empty-game fallback/schedule access, editorial credits/dates/unique URLs).
- `npm run build`: passed, including its existing prebuild suite.
- `git diff --check`: passed.

## Independent review

Separate reviewer found an undated final could outrank a dated final. Fixed date ordering and added regression coverage. Reviewer also requested sharing featured-game selection and gating wrapping changes to pilots; both resolved. Re-review found no remaining material findings and independently passed all six selection tests. Later compact-results/date changes require final reviewer reconciliation.

## Preview verification

First implementation tree 657da5338ebf6f755f6f12b6b2cf6519d0edf04c was published via GitHub API because direct git push lacked credentials; remote tree equals locally tested tree. Its commit is 6a6edd56b9338e64dd4d762006a7c1e7adefe616, Vercel deployment dpl_Bh8fXEU3Z2gqLCLaqF2ge517SAo1, READY.

Cloud-browser desktop inspection at 1363 CSS pixels opened all five pilots and non-pilot Hico. Each rendered its correct heading, existing Follow control and expected pilot/non-pilot mode; no horizontal overflow, broken loaded images or unnamed buttons were observed. Live production data was read only; De Leon showed Hico 7–De Leon 49, Cisco showed Cisco 31–Hawley 35, Albany/Goldthwaite showed Goldthwaite 56–Albany 0, Stephenville showed China Spring 21–Stephenville 55, each with verified labels and attribution. No score changes were performed.

This browser inspection caught an older result retaining the Latest badge after the actual latest result had moved to the game focus. The follow-up compact Earlier results presentation corrects that issue. Final exact-candidate checks are recorded in the PR.

## Limitations and release gate

**BLOCKED for production release pending required responsive verification.** Local Chromium is absent; the official Playwright browser download repeatedly returned an invalid/truncated archive. The available cloud-browser API has no viewport resizing or mobile emulation method. Therefore 375px, 390px and tablet browser verification, long-name/unusual-logo mobile cases, full accessibility automation and fixture game-state browser checks are not claimed as passing. Basic desktop DOM/accessible-name and image checks are not a complete accessibility audit.

No authenticated follow/unfollow, login, scorekeeping or Pick ’Em submission writes were performed against the preview's connected data. Their existing code is unchanged and automated regressions passed, but full authenticated end-to-end verification remains unexecuted. Existing feeds were empty during checks; published media rendering was reviewed in code rather than populated by unauthorized test content.

Keep PR draft and do not merge until responsive checks are completed and any resulting issues are resolved. No production deployment, migration or production configuration change is authorized or performed.

## Rollback

Before release, close the PR or revert pilot presentation commits on this dedicated branch. If separately released later, revert the V2 presentation commits to restore the prior hub layout; no data rollback or migration is required.

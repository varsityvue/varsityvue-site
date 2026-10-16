# Game Center published preview discovery verification

## Baseline and change

- Base main: `e5c2a0ff35e30ab06af4635eb087b8e3cf8f2fa6` (remote main rechecked unchanged before publication).
- Public Hico–De Leon Game Center showed only hub and general Coverage links; the page selected the Albany–Stamford article by hardcoded slug.
- Replace that lookup with the existing `getPublishedGamePreview(game.id)` and use the matchup-neutral label “Read Game Preview →”.
- Preserve the canonical Albany–Stamford destination, hub links, general Coverage link, layout, scores, metadata, and other Game Center behavior.
- No article content, publication rules, database, configuration, or migrations changed. The selector continues requiring `humanReviewed === true`, matching game ID, and article type `preview`, selecting newest first. No new date-based publication policy is introduced.

## Verification results

| Check | Result |
| --- | --- |
| Focused selector regressions | 3 passed: Week 8/Week 7 destinations; no-match/recap/feature exclusions; unreviewed preview excluded |
| Prebuild suite, including new regressions | 67 passed |
| `npx tsc --noEmit` | Passed |
| Targeted ESLint | Zero errors; one pre-existing `no-img-element` warning in Game Center |
| `npx next build --webpack` | Passed; existing static-render warnings about SVG width/height `104` remain |
| Browser: Week 8, 390 and 1440 px | Correct canonical link; visible, clickable; destination HTTP 200 and article heading rendered; no horizontal overflow |
| Browser: Week 7, 390 and 1440 px | Same checks passed for Albany–Stamford |
| Browser: recap-only game, both widths | No preview button |
| Visual inspection | Week 8 screenshots at both widths: clear button, mobile wrapping, existing hub/Coverage links retained |
| Independent code review | No blocking defects; requested page-level coverage supplied by browser regression script |

The browser checks exercised the actual local optimized production build, using Chromium 153, not a reconstructed component fixture. Supabase was directed to a closed localhost port and external browser requests were blocked; the app used its existing static-data fallback. Live scores, authenticated follow actions, and production services were not exercised. No production writes or deployments were performed.

## Reproduction

Run `npm ci`, `npm run prebuild`, `npx tsc --noEmit`, targeted ESLint, and `npx next build --webpack`. Start the built app with isolated service configuration. With Playwright and a Chromium executable available:

```sh
BASE_URL=http://127.0.0.1:3101 CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/test-game-center-preview-browser.mjs
```

Optional `EVIDENCE_DIR` points to an existing screenshot directory. The script checks three games at each viewport and follows both published preview links. The selector regressions run automatically in `prebuild` and `test:games`.

## Release boundary

Dedicated PR only. Merge and production deployment require separate authorization. Local verification is not a claim that the public production page has changed.

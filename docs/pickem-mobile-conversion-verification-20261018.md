# Pick ’Em mobile conversion and results UX — verification

Baseline: `88f58a712f8657cacc7021d26768eee3d375da72` (main, PR #99 released; PR #98 untouched).

## Scope

Presentation only: existing action-bar placement, receipt-based entry status, local results navigation, shared optional season summary, and state-aware recovery/restored-selection wording. No actions, RPC definitions, contest configuration, migrations, ranking calculations, entry records or prize logic changed.

## Reproduction and correction

Actual `PickemSlateForm` and `MobileNavigation` with repository Tailwind/global CSS, isolated server boundaries, Chromium:

| Width | Original Enter button y range | Navigation y range | Corrected Enter y range |
| --- | --- | --- | --- |
| 375 | 783–818 | 779–844 | 707–742 |
| 390 | 783–818 | 779–844 | 707–742 |

The new action offset includes the safe-area inset and stays above mobile navigation until its 1024px disappearance. The member fixed bar retains its existing mobile-only breakpoint. Guest sticky controls were also checked at tablet width.

## Executed checks

- TypeScript no-emit: pass.
- Targeted ESLint across changed TS/TSX: pass.
- 44 targeted regression tests: pass (entry presentation, client state, page loader/reconciliation, entry errors, lifecycle and weekly summaries).
- `npm run build`: pass, including the existing prebuild suite and normal Turbopack production build. An initial external node_modules symlink was rejected by Turbopack; local hardlinked dependencies resolved that environment issue without repository configuration changes.
- Actual-component browser matrix: guest, draft, valid, locked, graded, finalized-presentation, disqualified, closed draft and optional-read errors at 375, 390, 768 and 1280px: pass.
- No horizontal overflow in those fixtures.
- Keyboard selection, draft action and history disclosure: pass.
- Reduced-height 400px viewport: submission and uncertain-save recovery without replay pass.
- Axe WCAG A/AA/2.1 AA on main content for guest, draft, valid, locked, graded and optional-error fixtures: pass. Existing low-contrast Pick ’Em labels were raised within the touched presentation surfaces.
- Independent review: pass after receipt-aware restored copy, tablet offset, populated-field wording and closed-state instructions were corrected.

Commands:

```sh
node --import tsx --test lib/pickem-entry-presentation.test.ts lib/pickem-client-state.test.ts lib/pickem-week-summary.test.ts lib/pickem-page-loader.test.ts lib/pickem-entry-error.test.ts lib/pickem-lifecycle.test.ts
node scripts/test-pickem-mobile-browser.mjs --baseline
node scripts/test-pickem-mobile-browser.mjs
npm run build
```

Browser harness requires Playwright and Chromium in the test runtime. Optional `PICKEM_CHROMIUM_EXECUTABLE`, `PICKEM_AXE_MODULE`, `PICKEM_SCREENSHOT_DIR` and `PICKEM_BASE_REF` configure installed tooling/evidence location. These do not affect the application. No fixture route is shipped in the app.

## Limits and preview gate

The harness imports actual production components and CSS but stubs Next routing/link/image, loaders, actions, recovery and analytics. It does not verify real authentication, RPC/server-action transport or backend finalization. The finalized fixture uses the same read-only graded presentation; no finalized-prize claim is inferred. Reduced viewport checks are not real iOS/Android keyboard tests, and actual nonzero device safe-area insets are not emulated.

Vercel exact-candidate results are recorded on the draft PR after publication. Preview readiness and live page access must be distinguished from authenticated fixture verification. Production release remains unauthorized.

# Pick ’Em V2 header and status polish

Base: `9032ca757da40c36afe1e604716143c6c981dbc4`.

## Scope

- Approved sponsor bitmap unchanged; mobile display box grows from 80×56 to 112×84, using object-contain. Desktop box is 144×96.
- Pick ’Em Share is a 16px icon beside the season label, with the existing 44×44 target, accessible name, focus ring and share handler. Other ShareAction callers retain their defaults.
- One existing authoritative prize counter sits immediately after the view navigation, in two centered columns. Query, initial read, 30-second refresh and capped server values are unchanged; switching views does not mount a second counter.
- Initial status says “Your entry isn’t submitted yet.” Instructions progress from the short introduction to the next missing requirement. Accepted status says “Entry accepted.” Closed, disqualified and uncertain-save precedence remain unchanged. Draft-save success explicitly says the entry is not submitted.

No migration, mechanics, deadline, reminder, homepage or production-record changes.

## Verification

- Typecheck and production build pass.
- Full lint: no errors, 13 existing unrelated warnings. Changed-file lint passes.
- 53 targeted presentation, client-state, lifecycle, finalization, isolated database-boundary and view regressions pass.
- Independent review: PASS, no actionable findings; 21 independently executed tests pass.
- Actual React components and production Tailwind CSS are exercised by `scripts/test-pickem-mobile-browser.mjs` at 375, 390, 768 and 1280px. Network/server boundaries use isolated fixtures, not production writes.
- Matrix covers guest, draft, accepted, locked, graded, finalized, disqualified, closed draft, optional-section failures, zero values and $100 cap. It checks logo sizing/object fit, 44px Share target, metrics placement, overflow, keyboard tabs, view/selection preservation, mobile action bar and unknown-save recovery without replay. Share native/cancel/clipboard branches are isolated browser stubs.
- Before/after mode loads released source with `--before-polish`. At 375px accepted fixture, first game moves from y=504.5 to y=480.5 (24px earlier); the larger sponsor no longer competes with a boxed Share beneath it.

Browser prerequisites: installed Playwright, Chromium and optional axe-core. Override with `PICKEM_PLAYWRIGHT_MODULE`, `PICKEM_CHROMIUM_EXECUTABLE`, `PICKEM_AXE_MODULE`; use `PICKEM_SCREENSHOT_DIR` for screenshots.

Exact candidate preview verification is reported in the PR/release handoff; deployment creation alone is not rendering verification.

## Payment reconciliation (read-only)

Owner confirms Teri’s Week 8 $80 payment occurred externally. Current generation-1 winner claim is confirmed, response recorded, not superseded, with `payment_recorded_at = null`. Administrator payment recording remains outstanding. No payment or payment-status mutation was performed.

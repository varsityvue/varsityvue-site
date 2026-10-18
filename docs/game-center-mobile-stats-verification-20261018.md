# Game Center mobile statistics repair — October 18, 2026

## Scope and root cause

Base: `1a1cbc01a26fe7d81d89cd7a0500f5328fcc3035`.

`ExtendedGameStatsPanel` rendered composite source strings in three compressed comparison columns and used `notes` indiscriminately as Standout performances. Its mobile player labels were 8–10px. The repair changes presentation only; source datasets, game outcomes, standings, scoring authority, and leaderboard calculations are untouched.

## Implementation

- Two named team cards with labeled statistics, followed by player cards with school identity and readable two-column definition lists. Desktop uses side-by-side cards without wide statistics tables.
- Structured player headers/values remain authoritative. A narrow numeric-token/exact-field-count adapter decodes recognized composite team headers; malformed or unknown schemas retain verbatim reported values with wrapping.
- Missing values remain dashes; explicit zeroes, negatives, rates and precision remain unchanged. Unknown yards per attempt is shown as a dash, never calculated.
- Week 8 source Avg 15.1 for De Leon is not relabeled as yards per attempt. Source averages and completion rates retain source formats (e.g. `.714`), with an explanation. Explicit Y/Att and Y-Att fields are supported.
- Known historical football highlights use an exact-text allowlist. Unknown future notes default to Sources & completeness. Material discrepancies remain visible; full original reconciliation wording is preserved in native keyboard-accessible details/summary.
- Original source labels and URLs remain available. No client JavaScript, database migration or configuration change is required.

## Verification

Read AGENTS.md, the installed Next.js server/client and CSS guides, and Week 8 import provenance documentation before implementation.

- 19 targeted tests: presentation parsing, unusual formats and safe fallback, partial/missing rows, complete and partial real games, explicit yards-per-attempt headers, source immutability, all player values preserved, special teams and provenance, source-note separation, plus Week 8 leaderboard/source invariants and unknown-value semantics.
- TypeScript: pass.
- Full repository ESLint: pass; 0 errors and 13 existing warnings in unrelated files.
- Final production webpack build: pass, including 67 prebuild tests, TypeScript and 80 generated pages.
- Independent review: no blocking findings; exact-string highlight matching replaced positional matching after review.
- Responsive evidence and exact-candidate preview evidence are recorded in the consolidated handoff, including any environment limitations. No synthetic test route is committed.

## Release

Independent of Team Feed targeting. No migration and no production data writes. After separate production authorization, refresh release gates and merge this branch normally. Smoke-check Hico at De Leon Week 8, Goldthwaite at Albany Week 8, historical special-teams data, source notes, keyboard expansion and mobile layouts. Publishing this repair does not alter any statistics or feed post.

## Responsive accessibility follow-up

The initial browser fixture matrix covered five data cases at 375px, 390px, 768px and 1366px: no horizontal overflow or target compressed offensive string, with technical-details keyboard interaction passing where present. Axe identified insufficient contrast on the inherited unknown-completeness badge. A panel-scoped white/80 text override fixes this without altering shared badge styling; the final component fixtures and production CSS were regenerated for repeat verification. Final repeat matrix: 20/20 cases passed (five cases at each viewport), zero horizontal overflow, zero axe WCAG A/AA violations, zero compressed target strings, and native details Enter/Space interaction passed in all 16 applicable cases. These are actual-component server-rendered fixtures with final production Tailwind CSS; hosted application hydration and physical iOS were not exercised by this matrix.

# VarsityVue Stat & Roster Ingestion

This document defines the repeatable workflow for turning coach/school-supplied information into VarsityVue roster profiles, game pages, season totals, and leaderboards.

## Source hierarchy

Use information only when it is defensible. Preferred order:

1. Coach or athletic department directly
2. Official school roster, stats sheet, game book, or school website
3. Trusted media copy that can be independently verified

A screenshot may be used as the transmission format without making the screenshot website the source if the underlying information came directly from the school or coaching staff.

## Roster workflow

Roster and bio information belongs in `data/player-profiles.ts`.

Create one stable player ID per athlete and season. Recommended format:

`school-slug-first-last-season`

Example:

`de-leon-lane-couch-2026`

Keep the same player ID anywhere that player appears during the season. This prevents spelling differences from splitting season totals.

Only add fields that have actually been verified. Jersey number, grade, positions, height, weight, hometown, photo, and bio are optional.

## Game stats workflow

Game-level statistics belongs in `data/game-stats.ts`. Every game entry must include:

- `gameId` matching the canonical VarsityVue game
- explicit `season`
- `sourceStatus: "verified"`
- an internal `sourceLabel`
- quarter scores when available
- scoring plays when available
- team stats when available
- rushing, passing, and receiving lines when available

Use a roster-backed `playerId` whenever the athlete already exists in `data/player-profiles.ts`. If no verified roster profile exists yet, `playerId` may be omitted and VarsityVue will temporarily derive the season player identity from school + player name + season.

When the roster becomes available, future game stat entries should use the stable roster-backed ID. Historical lines can then be normalized to that same ID.

## Internal review tool

A gated review interface exists at:

`/internal/stats-import`

The route is disabled unless the server environment includes:

`ENABLE_INTERNAL_TOOLS=true`

The tool accepts one game at a time by pasted JSON, uploaded JSON, or VarsityVue-format CSV. Every format is converted into the same `GameStats` object before review. The workflow:

1. checks the complete nested object shape, school-slug syntax and finite integer/count fields before accepting JSON/CSV
2. suggests canonical games from the live VarsityVue schedule using season, existing game ID, and school overlap
3. requires an explicit canonical-game confirmation before approval
4. replaces the draft `gameId` with the selected canonical game ID
5. checks imported school slugs against the selected matchup and compares imported final quarter-score totals with an existing canonical final when available
6. resolves known roster-backed player IDs by school and player name
7. generates temporary deterministic player IDs when no verified roster match exists
8. runs `validateGameStats`
9. separates blocking errors from warnings
10. blocks a new import when that canonical game already has a `GameStats` record
11. supports correction mode by loading the current record first and showing a change summary
12. requires a finalized internal correction audit before replacement output is approved
13. generates normalized JSON for manual insertion into the production data files

The approval-copy action remains blocked until a canonical game is confirmed and all blocking validation checks pass. This prevents a valid stat sheet from accidentally being attached to the wrong game record.

The tool intentionally does **not** write to GitHub or publish production data. That is a safety boundary until VarsityVue has authenticated internal tools and a proper persistence layer.

### Correction audit trail

Every intentional replacement of an existing `GameStats` record should also create an internal audit entry in:

`data/stat-corrections.ts`

Correction mode requires:

- who reviewed the correction
- what prompted it, such as a coach email or corrected stat sheet
- a short note explaining the change
- the sections that changed
- an ISO timestamp created when the audit entry is finalized

The review tool generates this audit object separately from the replacement `GameStats` object. Both should be committed together. Audit data is internal operational metadata and should not be rendered on public game or player pages.

If the stat draft changes after the audit has been finalized, the audit timestamp is invalidated and must be finalized again. This prevents an audit record from describing an earlier version of the correction.

### CSV format

Use the **CSV Template** button in the internal tool rather than rebuilding the columns manually. Each row has a `section` value describing the record type. Supported values are:

- `meta`
- `quarterScore`
- `scoringPlay`
- `teamStats`
- `rushing`
- `passing`
- `receiving`

A file requires one `meta` row with `gameId`, `season`, and `sourceLabel`. Other rows only need the columns used by that section. Quarter scoring uses `|` separators, for example `7|0|7|0`.

CSV is the first spreadsheet adapter because it can be supported without introducing another production dependency. Native XLSX support should be added only when a spreadsheet parsing package is deliberately added and locked in `package.json` / `package-lock.json`; do not use a browser CDN as a shortcut.

PDF, screenshot, and email parsing remain future adapters and should feed this same review layer rather than bypassing validation.

## Pre-publish checks

Before committing a new stat sheet:

1. Confirm the draft is matched to the correct canonical VarsityVue game.
2. Confirm home/away teams and final score.
3. Confirm quarter scores add to the final score.
4. Confirm team passing completions do not exceed attempts.
5. Confirm individual passing completions do not exceed attempts.
6. Compare team rushing totals against individual rushing totals when the source provides both. Differences can occur because of sacks, kneel-downs, or team rushing entries; investigate rather than automatically changing the source.
7. Compare team passing totals against individual passing totals.
8. Confirm touchdown totals are plausible against the scoring summary.
9. Check player spellings against the roster.
10. Reuse existing `playerId` values wherever possible.
11. For corrections, commit the replacement record and its correction-audit entry together.

`lib/game-stats-validation.ts` contains reusable validation checks used by the internal review workflow.

## What updates automatically

Once a verified game stat entry is added, the current VarsityVue data layer automatically feeds:

- game box score
- player weekly game log
- player season totals
- school team leaders
- district leaders
- VarsityVue coverage-area leaders
- player profile ranking cards

Do not manually maintain separate season totals or leaderboard numbers.

## Public wording

Until VarsityVue has complete statistical coverage for every program in a district or coverage area, public leaderboard copy should make clear that rankings are based on verified statistics currently loaded into VarsityVue.

Do not describe a player as the definitive district or area leader unless the statistical coverage supports that claim.

## Future import target

The approved Trusted Data Ingestion & Review Console evolves this foundation into one persistent authenticated workflow. Intake priority is screenshot/image, pasted text and structured forms, preserving JSON/CSV; native XLSX/PDF and other adapters follow only when justified. Manual staging and the administrator roster-publication pilot precede extraction; detailed statistics and parity-gated schedules migrate later. AI produces drafts only. Each publication phase requires separate authorization.


## Phase 0 deterministic ingestion foundation

The version-1 contracts in `lib/ingestion-contracts.ts` are the shared intake
boundary for schedule, roster, core game-stat and underlying-class correction
drafts. `normalizeIngestionDraft` validates structured drafts and detaches them
from mutable adapter input. It does not persist, approve or publish anything.
Schedule/roster optional fields explicitly distinguish known, unknown, omitted
and unavailable values. Core statistics retain the existing `GameStats` value
layout and completeness semantics, without the canonical `sourceStatus` marker.
An unresolved game is represented by `gameId: null`, not an invented canonical ID.
Absent optional numeric metrics remain absent; `availability` can additionally
record unknown/omitted/unavailable status by category/row/metric path. Supplied
zero is a known value and cannot be masked by absent-metric metadata. Required
numeric metrics must be resolved before normalization; invalid input returns
reviewable errors rather than a fabricated line. Future extraction must retain
its raw representation separately until that deterministic boundary succeeds.

`lib/ingestion-adapters.ts` routes existing JSON/CSV to those same contracts.
Existing export APIs and valid supported fixtures remain compatible. CSV
interceptions are optional, matching the domain; blank touchdowns/interceptions
are not zero. Malformed nested rows, null numeric values, fractional count fields,
non-finite/unsafe numbers and unsupported keys now produce errors. Unknown-key
rejection intentionally catches misspelled fields instead of silently dropping
source information. Negative yards and finite decimal punt averages remain valid.

`lib/ingestion-matching.ts` offers exact scoped school/game/player candidates;
unique candidates still require explicit confirmation. Static profiles and
managed roster references bridge only through explicit profile links. Managed
IDs stay internal, and unmatched statistical identities remain deterministic
and explicitly temporary. Same-name distinct candidates are never auto-selected; statistical `identityMatches`
bind explicit row confirmation to the scoped canonical candidate and supplied ID.
Existing public identity helpers and player URLs are unchanged.

`lib/ingestion-stats-review.ts` previews the affected effective core/extended
catalog through the existing `reconcileStatCatalogs` engine. Supply resolved
canonical/effective catalogs, not raw pre-correction files. It separates blocking
shape/domain/revision checks, reconciliation conflicts, completeness limitations
and documented partial-source notes. The wrapper explicitly reports missing passing
interceptions rather than treating the legacy engine's zero fallback as evidence
of a complete total; the global engine is unchanged. Corrections replace exactly one affected
record in memory and require its expected hash/current snapshot. It never
rewrites statistics to satisfy a total. `reviewable` is a preview result, not
approval or publication permission. This reusable boundary is not yet wired
into the legacy review UI; its existing approval-copy workflow is unchanged.

`lib/ingestion-review-identity.ts` is server-side only. Versioned SHA-256 review
bindings cover normalized values, target/revision, evidence, matching and reason.
Source/catalog row order is canonicalized where irrelevant; scoring chronology
and quarter order are preserved. Positional evidence binds to stable row identity.
Correction diffs preserve before/proposed values and omission; edited drafts or
changed canonical snapshots invalidate prior bindings. Review disposition and
regenerated validation issues are not source content. Human authorization,
validation recomputation and transactional compare-and-swap remain mandatory in
later phases; a hash or `confirmedBy` string is not authorization.

Phase 0 adds no persistence, source uploads, AI adapter, authenticated console,
canonical writer or new permissions. Schedule identity/parity gates, roster
read/write authority and public statistics remain unchanged. Phase 1 must add
persistent sources/review events, scoped server authorization and conflict UX;
canonical publication follows separate roster, statistics and schedule gates.

Focused foundation checks: `node --import tsx --test lib/ingestion-foundation.test.ts`.
Keep the repository reconciliation/completeness/touchdown checks alongside them.

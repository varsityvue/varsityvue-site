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

1. checks the basic object shape
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

The next evolution should add native XLSX support, then adapters for PDF, screenshot, or email-derived data. Every format should convert into the same structured review screen. After authenticated internal access and a real persistence layer exist, approval can become a controlled production write rather than a manual code change.

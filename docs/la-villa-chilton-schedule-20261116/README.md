# La Villa–Chilton: final Area schedule completion

Base main: `a85ad9a118a8659463e74b16b95062c9bb5aacee` (PR #162).

## Single canonical change

`data/playoff-d2-completion-20261114.ts`, existing Game ID `2026-area-2a-d2-iv-4`:

- Friday, November 20, 2026, 7:00 PM CST: `2026-11-20T19:00:00-06:00`.
- Bulldog Stadium, Somerset, TX. City is carried in the canonical venue string, following existing schedule conventions.
- Attribution: corroborating published reports, not official school confirmation.

No duplicate record, database change or alternate schedule source was created. Scoring slots remain away Chilton / home La Villa; neutral-site state remains `null`, designated sides remain unconfirmed, and the Area game remains unscored. De Leon–Axtell remains Thursday November 19, 7 PM CST, Bob and Norma Cervetto Stadium, Dublin, TX; its entire canonical record is unchanged.

## Evidence and limits

1. Dave Campbell’s Texas Football, [TXHSFB Playoffs: Game Times and Locations](https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations), retrieved November 16, 2026. Its 2A DII Region IV entry lists La Villa–Chilton at 7 PM Friday at Somerset’s Bulldog Stadium; the page specifies CST. The owner explicitly supplied Friday November 20, 2026.
2. Owner-provided screenshot of South Texas Gridiron Grooves announcing the same date/time/stadium, supplied as corroborating published-report evidence in the task. The source label preserves that provenance. No independently retrieved post URL or locally retained screenshot is invented, and this is not presented as official school confirmation.

The existing Chilton 42–Brackett 31 owner-confirmed final retains its original attribution. This schedule update neither changes that score nor upgrades the owner-confirmed result to a different source category.

## Integrity verification

`before.json` is the immutable pre-change target record; `baseline.json` anchors the hash of every other Game, all 192 first-round finals, and the identities/score/neutral fields of all 96 Area games. The focused test permits only kickoff, venue and sourceLabel changes for the target and verifies both school schedules, Playoff Central, all 96 scheduled/unscored Area rows and the confirmed De Leon schedule. The schedule catalog fingerprint is updated to `schedule-e44fcf98b8c2`, as required when canonical kickoff geometry changes; location fingerprint and all unrelated data remain unchanged. Older integrity tests replay their historical snapshots without changing archived baselines. Browser acceptance now expects the scheduled venue/time instead of TBD.

Applicable operations-packet changes are maintained separately on the existing `docs/area-game-night-operations-20261116` branch, preserving the latest solo-owner plan. They are a staged schedule snapshot until this app release is approved; that branch is not included in this focused app PR. No production score, identity, permission or data repair is authorized or performed.

## Release gates

Run repository tests, affected lint, TypeScript and the isolated production build with the established network guard and local logo fixture. Require an exact-head READY preview; verify the target Game Center, Chilton/La Villa hubs and schedules, Playoff Central and the unchanged De Leon Game Center/schedule. Verify all 288 playoff identities/scores and all 96 Area schedule details via the preview snapshot. Preserve draft status until explicit owner release approval. Final test/preview/CI evidence is recorded in the PR description.

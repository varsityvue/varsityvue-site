# De Leon–Axtell owner-confirmed home/away correction

Base main: bdded546ab4df72b9c8e9a0a274ba0ed386922b9 (production PR #163). Exact game: 2026-area-2a-d1-ii-4.

The owner explicitly confirms HOME De Leon and AWAY Axtell. Canonical slugs and names are swapped, designatedSidesConfirmed becomes true, and the source label records owner confirmation rather than claiming official school confirmation. Unknown neutrality remains null. Thursday November 19, 2026, 7 PM CST, Bob and Norma Cervetto Stadium, Dublin, TX, participants, game ID, bracket position and unscored state remain unchanged. All other canonical games and all 192 first-round finals retain their baseline hashes. All 96 Area games remain unscored. Schedule fingerprint is schedule-a95428375498.

Existing derived presentation follows the corrected slots: school schedules show De Leon designated home and Axtell designated away. The pre-existing De Leon home-only Hudl broadcast rule now applies to this game alongside its existing radio lead; no broadcast URL or rule was authored or independently confirmed by this change. It is a school broadcast lead, not a promise of game coverage.

## Read-only production observation

At 2026-11-17T03:25:05Z (November 16, 9:25 PM CST), private.canonical_game_identity had away de-leon / home axtell. This exact game had zero game_state rows, score_submissions, internal_score_submissions reports or missing_score_intelligence candidates. The internal reports view was verified to read score_submissions. No production SQL correction, score entry or repair was executed.

## Proposed SQL: separate owner approval required

Review docs/release-sql/2026-de-leon-axtell-home-away.sql. It is a standalone proposed transaction, NOT an automatically applied migration. It locks the identity, score, submission and evidence tables against concurrent writes, imposes short lock/statement timeouts, and refuses any existing state/report/candidate, missing identity or unexpected orientation. It updates exactly the existing target row from the known old orientation, verifies the desired postcondition and is idempotent while still scoreless. It neither inserts an identity nor updates any result or other game. Table-level locks briefly block writes across those tables during the approved transaction; SELECT reads continue.

Do not enter or publish this game's final during cutover. The PR merge/deployment and SQL execution each require explicit owner authorization. Under that authorization, coordinate the approved catalog release with the guarded identity transaction, then verify actual production and registry both show away axtell / home de-leon before reopening score entry. If a score/report appears before execution, the SQL must abort; do not force it or transpose data automatically. The preview still reads production's old scoreless registry and is not permission to submit scores.

## Verification

Six focused tests cover only the intended canonical fields, every unrelated game, immutable 192-final hashes, all 96 unscored Area games, both school schedule slots, both possible verified winners into the unchanged Regional destination, SQL success/idempotence and SQL rollback for missing/conflicting identity or existing state/report/evidence. SQL tests use disposable PGlite databases only. Historical integrity tests replay the immutable pre-correction target snapshot rather than rewriting archived baselines. The new tests are included in prebuild. Browser acceptance checks actual Game Center designated-home/away labels and unchanged date/time/venue at each existing device size.

Repository tests, TypeScript, lint, isolated guarded build, exact-head preview and CI evidence are recorded in the draft PR. Do not merge, deploy or run production SQL until separately approved. No assignments, permissions, logos, unrelated scoring identities or production data changed. PR #164 is a separate, unmerged score-correction reliability change and is not included here.

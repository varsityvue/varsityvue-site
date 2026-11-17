# Game-night score correction reliability

Base: production/main bdded546ab4df72b9c8e9a0a274ba0ed386922b9 (PR #163).

An isolated real-action fixture confirmed that an empty correction score was coerced by Number("") to zero and passed to correct_game_score. The fixture prohibited all network access; no production score was entered. The correction form also initialized null scores to zero.

Reuse the existing parseScoreInput validator so both correction scores must be explicit decimal integers from 0 to 150; explicit zero remains valid. Preserve null form fields as blank. Successful corrections now invalidate Playoff Central, Regional readiness, the operational scoring board and both school schedules as well as the existing public views. Existing administrator-only final corrections, confirmation/reason requirements, revision arguments, audit RPC and no-retry behavior are preserved. No permissions, database schema/data, canonical game, scoring identity, schedule or logo changes are included.

Six network-prohibited real-action/rendering tests cover missing/blank/file/malformed input, explicit shutouts, source reason and confirmation, final-correction role restrictions, stale conflicts/no retry, refreshed public paths and null form presentation. The tests run as a prebuild gate. Winner-reversing corrections still require downstream reconciliation; this change does not publish Regional participants or create Game Centers.

The existing solo packet remains on docs/area-game-night-operations-20261116 at 2df3896b746c99c9980daa4dbeff57ddd88a91c6. Canonical counts are 26 Thursday / 67 Friday / 3 Saturday and 9 Thursday / 23 Friday priority 2A games. All 192 first-round finals, 96 unscored Area identities and 48 pending Regional dependency pairs matched production at the read-only audit. Production internal routes reached login; no authenticated owner session was exercised.

Draft only. Require an exact-head READY preview and owner approval before any merge or production release. Test/build/preview evidence is recorded in the PR.

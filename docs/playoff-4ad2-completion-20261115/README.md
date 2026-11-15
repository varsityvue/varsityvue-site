# 2026 4A Division II release inventory

Production baseline: main `1f71377766944d19673aa9d683ea4c75cd5e484d` (released PR153). Source review: November 14, 2026 Central / November 15 UTC.

## Coverage

- Existing: 18 first-round Game Centers, one Area game (Cuero–Brownwood), 11 verified finals across repository (2) and production scoring state (9).
- Candidate: all 64 participants and seed slots, 32 first-round Game Centers/finals, 16 Area games. Adds 14 first-round and 15 Area games.
- All 64 school identities already exist; no school registry, colors or logo changes.
- `baseline.json` retains pre-change catalog records; `coverage.json` is the complete per-game candidate including evidence and canonical sides.
- Existing IDs, home/away identity ordering, kickoff/venue metadata, neutrality and designated-side confirmation remain unchanged. Previously unknown first-round schedules remain unknown.
- New Area kickoff/venue details come from DCTF, not inferred from bracket seeding. New sides are unconfirmed display ordering. The existing Cuero–Brownwood schedule is retained exactly.

## Structural authority

Official UIL: https://www.uiltexas.org/football/playoff-brackets/4AD2

UIL-linked 2026 field, G1–G32 and G33–G48:
https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/Qa_WshJMxEaACBr4Xd5zQQ/football-26/2026-uil-texas-football-state-championships-2026-football-conference-4a-d2.htm

All 64 source seed cells match the shared standard mapping. G28 is R15 Bandera/T16 King; it does not inherit 4A DI's reversed G28 exception. No field arrays or topology code changed.

## Results and schedule evidence

DCTF: https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations

All 32 winners agree between UIL-linked field, DCTF and existing production finals. Score disagreements are explicitly listed in `conflicts.json`:

- Pecos–Irvin: current UIL-linked field and both team schedules support 52–14; DCTF says 52–7. No production final existed. Candidate uses official current field 52–14.
- Mineral Wells–Levelland: production 71–49 retained; eyewitness Big Country Preps and Shotwell statistician support 71–49. UIL says 71–52; Chronicle says 71–50.
- Liberty–Burkburnett: production 42–0 retained, corroborated by DCTF/Chronicle; UIL/team pages say 42–7. Unresolved score detail; same winner.
- Brock–Perryton: production 63–0 retained, corroborated by KFDA/AP; UIL/DCTF say 77–7. Unresolved score detail; same winner.

These are retained existing authoritative results, not silent corrections. This PR changes no production scores. Any future correction must use the existing authorized scoring workflow with independently reviewed evidence. Dynamic authoritative corrections retain precedence over repository fallbacks.

Historical kickoff reporting also conflicts for Irvin–Pecos (current field 6:30 p.m. versus existing catalog 7:30 p.m.) and Brock–Perryton (linked game page reports a different time/site from the existing published schedule). Existing published metadata is retained, not silently rewritten during expansion.

## Scoring identity registration

`scripts/sql/register-playoff-4ad2-20261115.sql` uses the existing guarded identity-only transaction. Baseline 19 identities; adds 29, read-back 48/48. It rejects existing side mismatches and duplicate same-round identities. No schema, RLS, permissions, score state or configuration changes.

Production `game_state` before/after: 180 rows; fingerprint `2bdc1754453347d4e055ec1493a30f50` unchanged.

## Validation / release policy

Focused integration tests verify 64 school schedules, 32 finals, source-edge advancement, 16 unscored Area games, seed topology, preservation of existing metadata and all previously completed divisions. Browser CI adds four-region fit and Glen Rose–Carthage path/Game Center checks on desktop/iPhone/Android emulation.

No merge or production application deployment without owner approval. Do not merge PR144 or touch logo work.

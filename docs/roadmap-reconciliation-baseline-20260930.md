# Roadmap reconciliation evidence — September 30, 2026

Status: READ-ONLY SNAPSHOT. Documentation review evidence, not a continuing claim that counts never change. Reverify before implementation or a release.

## Repository and deployment

Starting main: 81e5f8225a6ebd52850045a3e2a19f61301f769a. Clean public clone; AGENTS.md read. Current production deployment: dpl_AVwXRNP6nSL8fcvYEYZk1XsbkteC, READY, main at that SHA, assigned to varsityvue.com and www.varsityvue.com. No deployment or production write was performed.

Merged release evidence on main includes Team Feed Phase 1 (#12), personalization V1 (#14), Friday scoring V1 (#17), sponsor polish (#18), simplified rules (#19), `/scoreboard` hotfix (#20), Account username/password (#21) and Pick ’Em social/redirect (#22). Existing source routes/migrations corroborate the shipped inventory; this task does not repeat every functional release test.

PR #21's accepted report records isolated same-browser PKCE recovery/reset, username security/concurrency, authenticated password changes and suspension tests. Production authenticated Account rendering/recovery was not executed in that release because no safe production session was available; this task likewise sends no recovery email or password/account mutation. Record “shipped; isolated verification accepted,” not “fresh production recovery PASS.”

## Catalog and read-only production counts

Database snapshot: 2026-09-30T18:55:28.265526+00:00. Queries used SELECT only, no private member identities exported. `getGames()` evaluated through existing TypeScript code at starting main.

- 269 total rows: 184 regular + 65 district = 249 eligible real games; 19 scrimmages and 1 bye excluded.
- Repository statuses in eligible set: 137 final, 21 scheduled awaiting result, 91 upcoming. Applying the 30 verified game_state rows yields 158 final, 91 upcoming, 0 awaiting results. All kickoff_override values in those rows are null at snapshot.
- 30 game_state rows, all verified FINAL; 15 distinct Pick ’Em-linked games/15 rows; 114 approved submissions; 0 active contributor-school assignments; 249 canonical_game_identity rows; 29 verified historical finals with both participant slugs NULL.
- Team Feed posts: 0. Activation evidence is absent; no content published here.
- Eligible sorted-ID SHA-256: 1ee13c4b81e3eedf95e0456c6f0fe3f360bbc260d91af2a017e9c74fcdfd0abf. Algorithm: UTF-8, lexically sorted IDs, LF-separated with trailing LF. Count: 249. Future cutover also requires normalized field digests and exact downstream parity; ID digest alone is insufficient.

## Operational snapshot and discrepancies

- Week 6 OPEN, six-game slate, tiebreaker goldthwaite-at-miles-2026-week-6. All six stored game locks independently rechecked and match the repository kickoff. Frozen entry deadline 2026-10-03T00:00:00+00:00 = Friday October 2, 7:00 p.m. CDT. Resolution boundary 2026-10-06T05:00:00+00:00 = Tuesday midnight CDT; public Monday 11:59 p.m. Central cutoff wording remains unchanged.
- Week 5 retains stored enum OPEN, but its effective closure is time-derived. Do not mistake database enum alone for permission to enter. Week 7 has no configured row at this snapshot.
- Active homepage editorial feature: Week 6 district_preview, “District Races Take Center Stage,” article week-6-district-races-what-matters-october-2026; no game_id. Older Stamford–Hamlin feature proposal is superseded, not an active publication instruction.
- `/internal/pickem` still filters/offers Weeks 5–7. Save action derives tiebreaker from a Game of the Week specialEvent; Week 6 repository games currently lack that flag despite the stored tiebreaker. Focused audit must cover safe resaves and explicit independent designation; no production experiment here.
- Account contributor game shortcut is bounded at week <= 6. This is NEXT scope, not proof contributor infrastructure is missing.
- Existing conversion dashboard's saved-pick participants/complete slates are not authoritative valid cash entries. Repeat valid-entry and leaderboard-return results are NOT VERIFIED here.
- Generic `game_state.updated_by` exists, accepted report propagation uses reviewer identity, and audited correction resets source-submission provenance. Public dynamic game reads do not select an actor. Future attribution needs a focused audit, especially metadata writers and safe public identity projection.
- Auth provider delivery/DNS/spam-root-cause evidence is NOT VERIFIED. Shipped Spam/Junk guidance is not a delivery repair.

## Planning authority and history

docs/ROADMAP.md is proposed canonical Product Roadmap. Schedule architecture is imported/refreshed in docs/schedule-management-roadmap.md; Library Product and Schedule copies become explicit pointers, not competing priorities. docs/2026-season-operations-plan.md owns rolling weekly work; older Library Week 6/7 plan becomes historical with a pointer. Existing May archives PDF remains historical strategy; docs/school-legacy-strategy.md explicitly supersedes its sequencing and preserves principles.

Repository old Week 5 audit/rules draft are labeled historical, while existing 29-row review and statistics source workflow remain useful. No separate Team Feed/personalization roadmap file was found in repository or scoped Library title discovery; consolidated phase/retention plans now document their current status. Unrelated pasted source/images were not treated as planning authority. No unseen prior audit report is asserted to have been reread; owner-supplied numbers were independently recomputed where written current.

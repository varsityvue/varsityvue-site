# Historical canonical identity reconciliation — REVIEW ONLY

Status: STILL ACTIVE. September 30 read-only recheck confirms 29 verified FINAL rows still have both school slugs NULL. No repair performed. Handle as a bounded separately reviewed release, ideally after Week 6 unless an affected correction requires earlier action. Resolve or explicitly account for these rows before canonical schedule cutover. Priority authority: [ROADMAP.md](ROADMAP.md). September 28 mappings below must be revalidated before execution.

Production snapshot: 2026-09-28, 30 game_state rows; 29 verified FINAL rows have both school slugs NULL. The Early at De Leon row is already complete. No repair SQL in this document has been executed.

Mapping authority: getGames() at starting main e9cbb3b, captured in private.canonical_game_identity in migration 20260928223000. The repository game ID selects one explicit away/home pair. The ID text alone is not parsed to infer direction; the neutral-site “vs” game follows its repository away/home fields.

Category A: 24 game IDs map uniquely to two entries in the school registry.
Category B: 0 missing or ambiguous repository matchups.
Category C: 5 uniquely mapped IDs include one slug absent from the school registry. Obtain owner review of those school identities before including them in a repair. The proposed slugs are explicit in the game record.

Affected rows (game ID | proposed away slug | proposed home slug | category):

- abilene-texas-leadership-at-coleman-2026-week-3 | abilene-texas-leadership | coleman | A — deterministic
- albany-at-coleman-2026-week-4 | albany | coleman | A — deterministic
- bowie-at-city-view-2026-week-5 | bowie | city-view | C — confirm Bowie school identity
- breckenridge-at-anson-2026-week-5 | breckenridge | anson | A — deterministic
- bridgeport-at-henrietta-2026-week-5 | bridgeport | henrietta | C — confirm Bridgeport school identity
- chico-at-abilene-texas-leadership-2026-week-5 | chico | abilene-texas-leadership | C — confirm Chico school identity
- cisco-at-stamford-2026-week-4 | cisco | stamford | A — deterministic
- clifton-at-rio-vista-2026-week-5 | clifton | rio-vista | A — deterministic
- comanche-at-clifton-2026-week-4 | comanche | clifton | A — deterministic
- crawford-at-santo-2026-week-5 | crawford | santo | A — deterministic
- de-leon-at-goldthwaite-2026-week-4 | de-leon | goldthwaite | A — deterministic
- dublin-at-millsap-2026-week-5 | dublin | millsap | A — deterministic
- early-at-hawley-2026-week-4 | early | hawley | A — deterministic
- florence-at-hico-2026-week-5 | florence | hico | A — deterministic
- hamilton-at-eastland-2026-week-5 | hamilton | eastland | A — deterministic
- hamlin-at-cross-plains-2026-week-5 | hamlin | cross-plains | A — deterministic
- hawley-at-post-2026-week-5 | hawley | post | A — deterministic
- hico-at-meridian-2026-week-4 | hico | meridian | A — deterministic
- holliday-at-whitesboro-2026-week-5 | holliday | whitesboro | C — confirm Whitesboro school identity
- jacksboro-at-cisco-2026-week-5 | jacksboro | cisco | A — deterministic
- meridian-at-hubbard-2026-week-5 | meridian | hubbard | A — deterministic
- miles-at-stamford-2026-week-5 | miles | stamford | A — deterministic
- roscoe-at-santo-2026-week-4 | roscoe | santo | A — deterministic
- san-angelo-texas-leadership-at-merkel-2026-week-5 | san-angelo-texas-leadership | merkel | C — confirm San Angelo Texas Leadership school identity
- stephenville-at-abilene-wylie-2026-week-4 | stephenville | abilene-wylie | A — deterministic
- stephenville-vs-canyon-west-plains-2026-week-5 | canyon-west-plains | stephenville | A — deterministic
- tolar-at-comanche-2026-week-5 | tolar | comanche | A — deterministic
- winters-at-goldthwaite-2026-week-5 | winters | goldthwaite | A — deterministic
- wortham-at-mart-2026-week-5 | wortham | mart | A — deterministic

Review and execution plan (future, separate authorization):
1. Confirm the production game_state count and these exact 29 game IDs/NULL fields again; verify each current game score, status, verified_at, updated_at, outcome_revision, winner, and relevant event/grade counts. Resolve the five Category C school records with the owner.
2. In a single reviewed transaction, stage the approved game_id/away/home mapping. Require exactly 29 matching rows, verified FINAL status, both slugs NULL, and a one-to-one match to the canonical registry. Abort on any difference. Record a secure pre-change snapshot of the two identity columns and immutable comparison fields.
3. Lock the target rows and disable game_state_set_updated_at, game_state_bump_score_revision, and enforce_canonical_game_identity only within the reviewed transaction; the last deliberately blocks incidental historical repair. Prevalidate all proposed pairs against the registry before disabling these triggers. Set away_school_slug and home_school_slug only, preserving updated_at and score_revision. Do not run a score or status update.
4. Re-enable all three triggers in the same transaction. Compare all protected fields and product events, correction audits, Pick ’Em grades/totals, and standings with the pre-change snapshot. Commit only if exactly the approved rows changed only the two identity fields.
5. Rollback strategy before commit: ROLLBACK transaction. After commit, a separately authorized guarded reversal may set only the two identity fields to NULL for the exact 29 captured rows, while preserving updated_at and other fields. Do not reflexively roll back if any row has since changed; stop and review.

Verification queries to prepare for the future transaction:
```sql
select game_id,status,verified,away_school_slug,home_school_slug,away_score,home_score,updated_at
from public.game_state
where away_school_slug is null or home_school_slug is null
order by game_id;

select count(*) as incomplete_verified_finals
from public.game_state
where verified and status = 'final' and (away_school_slug is null or home_school_slug is null);
```

The V1 prevention migration creates a registry and write guard, but intentionally contains no UPDATE of these historical rows.

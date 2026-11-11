# Bi-district research handoff — November 10, 2026

This is an offline review packet, not a published schedule or an import authorization.
No file here is imported by a public page, game catalog, API, or database writer.

## Inventory and evidence

- Authoritative inventory: `data/statewide-playoff-brackets.ts`, `data/playoff-bracket-fields.ts`, and `getBiDistrictReadiness(getGames())`.
- Snapshot: 192 positions; seven scheduled records; 185 missing records. A read-only production query found no bi-district `public_game_state` overrides at review time.
- Research covers all 192 positions exactly once: all 64 Class 2A, all 64 Class 3A, all 64 Class 4A. Every region has eight positions per division.
- `class-2a.json`: 64 rows, 20 corroborated reports, 43 single-source rows, one unresolved kickoff conflict. Corroboration does not prove independent reporting. Its timezone offsets are geographically inferred.
- `class-3a-4a.json`: 64 rows, 16 with explicit CST schedule evidence, 48 partial rows; two conflict rows.
- `remaining-3a-4a.json`: remaining 64 partial rows; nine conflict rows.
- `inventory.json`: bracket readiness snapshot, including the seven existing game IDs.
- `reviewed-candidates.json`: reproducible review output; 185 structurally valid new-record proposals and seven existing-record reconciliation entries. Structural validity is not factual verification.

Only seven rows currently resolve both school identities to existing catalog slugs by exact name and classification. Unknown or ambiguous identities remain null; no statewide slugs were invented. Of 192 rows, 191 lack an explicit neutral-site designation in the research evidence. No row is publication-ready.

## Reproduce

Run from repository root after installing locked dependencies:

    node --import tsx scripts/review-playoff-schedule-research.ts > docs/playoffs/research-20261110/reviewed-candidates.json
    node --import tsx --test scripts/review-playoff-schedule-research.test.ts

The script reads repository files and writes only to stdout. It has no database client, no network access, and no publishing operation. It uses the validator released through PR #136. Regenerate against the latest inventory immediately before any later publication review.

## Meaning of fields

- `kickoff` in original evidence can be null; `proposedKickoff` is an explicitly provisional timestamp. Class 2A rows record inference in `timezoneBasis`.
- The normalized `proposed` object is a review convenience, never approved data. Always read `provenance` and `publicationIssues` with it.
- `source-verified` means one selected credible source explicitly supplies date, time, venue and CST. It does not mean independent two-source confirmation, resolved identity, neutral-site confirmation, or owner approval.
- `readyForPublication` is always false, including when structural validation passes.
- Existing games are `reconcile-existing-only`; do not insert duplicates or overwrite results.
- Home/away order is not established by bracket order. Confirm the actual designation before constructing game records.

## Priority discrepancies

1. Shelbyville–Waskom: Nov 13, 7 versus 7:30 p.m.; local Shelby County announcement, KLTV and MaxPreps support 7:30, but contrary reports are preserved.
2. Wall–Bowie: Nov 13, 6 versus 7 p.m., Cisco; school confirmation needed.
3. Hooks–Arp: 7 versus 7:30 p.m.; source confirmation needed.
4. Millsap–Trinity Leadership: internally inconsistent “Thu 11/13” and 7:30 versus Nov 12 at 7; do not resolve by guessing.
5. Bells–Lone Oak: Murphy versus Plano venue-city listing.
6. Lincoln–Southwest: Clark Stadium in Fort Worth versus Plano; stadium identity unresolved.
7. Athens–Hamshire-Fannett: one source prints January rather than November.
8. Five Class 3A DI Region IV games have conflicting broad-source dates.
9. Resolved-preference notes remain for Bosqueville–Johnson City (official Granger, not La Grange), Axtell–Bangs (weekday/date typo), and Lockney–Iraan (Thursday versus Friday).
10. Coahoma–Holliday stadium naming needs identity review (Eagle versus Don Lacy).

Do not trust broad SI/syndicated date groupings over school announcements. Keep CST and Mountain local time distinct for El Paso venues; DCTF explicitly uses CST statewide.

## Next publication work

Confirm conflicting details with schools or venues; reconcile exact school identities, home/away order, timezone and neutral designation; recheck existing games and verified results; then request explicit approval of an exact publication batch. No production insertion, schema change, score change or merge is authorized by this packet.

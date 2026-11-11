# Publication staging checkpoint — November 11, 2026

This packet prepares exact offline review records. It does not authorize or execute publication.

## Release candidates and baseline

- Released main: `ea1b4a57da0dc07e1b5418772ca2f3a2842ebe0f` (PR #136 is already released).
- Research PR #133: `feat/playoff-schedule-research-staging-20261110`; this checkpoint extends parent `5da0176f88ff06dfba9001b28b61d5dbb3191f17`.
- Application/catalog PR #137: `feat/playoff-school-catalog-integration-20261110`, reviewed head `058e54e0d71960f791e7b7b65ef04d87ab91f0bc`.
- Refresh GitHub heads before use; the final PR description identifies the committed research checkpoint SHA.
- Catalog integration remains unmerged; its 341 schools and 85 districts are release dependencies, not published catalog records.
- Houston Sterling remains held for an unverified secondary color; no color was invented.

## What is prepared

All 192 authoritative bracket slots have qualified identities, source provenance, proposed schedule fields, an explicit operation, and blockers. Seven are existing-record reconciliations; 185 are proposed new records.

A new 33-game evidence batch (12 Class 2A, 13 Class 3A, eight Class 4A) adds 31 core confirmations and retains two held rows, expanding the previous 21 selected-source-complete schedules to 52. These are source-supported core schedules, not blanket primary confirmation. The packet distinguishes exact-stadium, campus-only, date/time-only, and city-only corroboration. Original candidate values, contrary reports, existing-record operations, and all publication flags remain unchanged.

- 21 supported side mappings across the 52 schedules.
- 16 explicitly name both roles, including the ten previously reviewed pairs.
- Five name one role and infer the complementary participant's role; these remain explicitly held.
- Zero adopted primary formal neutral-site confirmations.
- No candidate is execution-enabled or publication-approved.

The Class 2A school feed cards for Highland Park (13762950), Granger (13753294), San Augustine (article 2253403), and Vega (13752004) were inspected in the current live browser. This upgrades the retrieval method from the earlier index-only evidence; no missing timezone or stadium detail was invented. Post–Ozona and Thorndale–Groveton host ticket pages were inspected directly with their explicit CST and side assignments. Exact source URLs and retrieval limits are in the supplemental JSON.

## Manifests

| File | Records | Meaning |
|---|---:|---|
| all-candidates.json | 192 | Complete offline master with fingerprints and evidence |
| core-and-both-sides-explicit-held.json | 16 | Core evidence and both designated roles explicitly named; other blockers remain |
| core-and-one-side-explicit-held.json | 5 | Core evidence and one explicit role; complementary role remains held |
| core-supported-sides-held.json | 31 | Core evidence complete; no adopted explicit side mapping |
| partial-evidence-held.json | 133 | New-record proposals retaining broader evidence gaps |
| existing-record-reconciliation.json | 7 | Existing IDs preserved; insertion forbidden |

All manifests set executionEnabled:false and approval:null. Each record sets insertAllowed:false, readyForPublication:false, writePayload:null. A proposed manifest ID is an offline engineering identifier, not a created game record.

Qualified school IDs come from existing catalog IDs or explicit catalog proposal fields. Ambiguous names are qualified by official UIL name, division, region, and district. Home/away order is never derived from bracket order or generic VS/AT labels.

## Reproduce and verify

Run from the repository root:

    python scripts/review-playoff-schedule-expansion.py > docs/playoffs/research-20261110/schedule-expansion-20261111.json
    python scripts/prepare-playoff-publication-manifests.py
    PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s scripts -p test_playoff_publication_manifests.py -v
    node --import tsx --test scripts/review-playoff-schedule-research.test.ts scripts/review-playoff-school-identities.test.ts scripts/review-playoff-school-catalog.test.ts

The Python scripts use only standard-library local file operations. They contain no database client, network access, credentials, publication endpoint, or execute switch. Repeated generation must be byte-identical. The original reviewed-candidates.json still reports the preserved 21-game baseline; this supplemental master reports the expanded 52 without silently rewriting earlier research.

Tests reject duplicate slots, cross-qualified identities, incorrect districts and opponent side assignments; preserve seven existing IDs; hold complementary roles and incomplete Sterling; reject --execute; verify reproducibility and unchanged selected schedules.

## Policy decision isolated once

Existing review safeguards require formal neutral-site status. All 52 core-supported rows remain held because that field is unconfirmed. A third-party location or designated home team does not prove neutrality.

A future owner decision could allow unknown neutrality to remain nullable, suppressing any Neutral site label. That would require a separately reviewed safeguard change and an exact publication batch. This sprint does not make that decision or relax the rule. Continue other field verification instead of repeatedly searching the same unresolved neutrality or eleven old side assignments.

## Next executable work

1. Review the exact PR #137 application/catalog candidate and its desktop/mobile evidence.
2. Obtain owner approval for any merge/production release; no schedule publication is included.
3. Rebase/retarget research against the released catalog only after approval; regenerate and compare input fingerprints/operations.
4. Resolve the five complementary role statements and other held side assignments with current school/host statements.
5. Preserve naming limits (including Carlisle stadium alias and campus-only evidence) and the newly retained Wink–Ralls contrary 6 p.m. report; the selected 7 p.m. value did not change.
6. Resolve formal neutrality policy or obtain primary evidence, then prepare an exact approved publication payload in a separate step.

No merge, production release, score/result/winner change, database mutation, schema change, access change, or message to another person was performed to prepare this packet.

## Catalog release compatibility

The three legacy offline review scripts now read `catalog-baseline-20261111.json` through the script-only `playoff-research-catalog-baseline.ts` loader. The snapshot contains the exact 70 schools and 11 districts from released main `ea1b4a5`. All three original generated JSON outputs reproduce byte-for-byte. This prevents PR #137's 341 added school records from being mistaken for pre-existing identities or collisions when regenerating the historical proposals. Runtime school pages never import this snapshot or loader. A combined checkout verifies the same research tests against the new runtime catalog.

The final additional batch retains Aubrey–Andrews as timezone-held and Stafford–Bridge City as kickoff-conflict-held; neither is promoted. Randall's contrary bracket date and excluded January 1, 1900 placeholders remain recorded. Smithville host events 202/203 were read directly for Thrall–Brazos and Bay City–Lampasas, including CST and full venue address; generic AT does not supply designated roles.

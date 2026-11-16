# Existing tools and candidate-final queue decision

## Decision: reuse existing review, no new application PR

A new read-only candidate-final page would duplicate existing evidence displays while still requiring the owner to authenticate, establish final status, check provenance and explicitly approve each result. It would not supply missing trustworthy scores. The practical reduction now is a static priority/Regional-dependent worklist, exact editor deep links, small next-morning batches, bounded research and one evidence note per publication. Those are delivered in this packet without an app release.

## Inspected capabilities

| Existing tool | What it already does | Solo use / limits |
|---|---|---|
| `/internal/scoring?week=13&game=GAME_ID` | Preselected canonical game; scores and current state; pending reports; explicit FINAL review; stale-write handling; links to corrections/reports | Use the exact links in `solo-queue.csv`; no repeated search. Filters include All, Live, Awaiting Result and Pending Reports; this is not a division/Regional priority sorter. The packet supplies that order. |
| `/internal/score-review` | Groups pending submissions by game, compares score lines/current state, permits moderation, outcomes and scheduling review under existing authority | Prefer a supported pending final over retyping the same candidate in a second tool. Pending does not mean verified. |
| `/internal/score-intelligence` | Existing missing-score candidates, source attribution/captured time, consensus/conflicts, manual evidence entry, explicit approve/reject/defer review and current-state snapshots | This is already the candidate-evidence review surface. Do not add the same evidence here and also originate a duplicate direct update. No guaranteed evidence exists for every game. |
| `/internal/score-review/correct?game=GAME_ID` | Existing audited correction workflow with reason/current state | Use for real corrections. Winner changes require downstream reconciliation; no silent reassignment of a score. |
| `/admin/playoff-publishing` | Read-only Area and 48-slot Regional readiness under existing admin access | Check only newly completed dependencies at block end; it does not publish Regional Game Centers. |

Inspected source: `app/internal/scoring/page.tsx`, `ScoringBoard.tsx`, `actions.ts`; `app/internal/score-review/page.tsx` and correction workflow; `app/internal/score-intelligence/page.tsx`, `EvidenceReviewForm.tsx`, `actions.ts`; `lib/score-scout-review.ts`, `lib/missing-score-intelligence.ts`, `lib/score-evidence-discovery.ts`, and `vercel.json`.

## Discovery timing and safety

The existing sync includes unresolved games with known kickoffs between four and 48 hours ago. A 7 PM game is not eligible until 11 PM CST; 7:30 PM is not eligible until 11:30 PM. Eligibility is not proof of a final or a guarantee that the next cron succeeds. `vercel.json` schedules the existing combined product-email route every five minutes, but this preparation does not verify deployed worker/provider configuration, secret presence, provider quota, successful future executions or game-specific extraction. No secret value was accessed.

The worker depends on its existing worker secret; automated evidence discovery depends on the existing search-provider key and claim/rate controls. Do not assume it is operational because the UI exists. Current read-only production aggregates show **zero Area candidates and zero Area evidence rows**, consistent with games not yet being eligible. No cron or discovery RPC was invoked.

`/api/cron/product-emails` also enqueues/drains product and contest email jobs. Calling it as a read-only score helper would be wrong: it has write and communication side effects. This packet does not call it, enable automation or purchase provider access. Evidence never becomes a final merely because it was discovered automatically or has a high source weight.

## Genuinely missing convenience versus justified change

There is no demonstrated one-screen pre-4-hour, division-prioritized external-final feed with guaranteed independent evidence. Building one requires reliable source integration, mapping and operational validation; a second empty page is not that integration. There is also no supported bulk-final publishing path; preserve explicit per-game confirmation. The delivered exact links and batches remove repeated navigation without weakening safeguards.

If actual game-night use later shows that finding already-existing candidate evidence consumes substantial time, measure it and consider a narrow filter/sort improvement within the existing Missing Scores or scoring screen. Do not create a competing queue now or change ingestion timing just to populate a new page. No genuine software defect was found during this review, so no feature branch, draft PR or preview deployment is warranted.

## Authentication

Existing internal tools require an active authorized account. The previous live acceptance session redirected to login; this run inspected source and isolated fixtures, not an authenticated production moderation session. Use the owner’s normal authorized sign-in on game night. If it is unavailable, retain evidence and defer publication. No permission changes or alternative unapproved submission path are authorized.

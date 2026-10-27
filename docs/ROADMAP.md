# VarsityVue Product Roadmap

Status: CANONICAL PRODUCT ROADMAP — proposed reconciliation for owner documentation review.
Reconciled: October 26, 2026, using the October 25 assessment. Supersedes all older product priority sequences, including the Library roadmap and September 20 execution plan. Documentation approval authorizes no implementation or production mutation.

October focuses on conversion, retention, contest administration, reliability and owner-workload reduction. Preserve useful public access without an account. Enter verified information once and reuse it across scores, hubs, standings, contests and eventual archives. Never invent outcomes or statistics; missing statistics are not zero. Preserve stable identities, sources, consent, correction provenance and active-account authorization.

Weekly publishing, coverage, support and prize administration belong in the [2026 Season Operations Plan](2026-season-operations-plan.md). Editorial features and Pick ’Em tiebreakers are independent selections. Architecture documents define deeper safeguards; this document determines product horizons.

## COMPLETED / SHIPPED

Shipped means present on current main and its production deployment, not mature adoption. See [baseline and verification limits](roadmap-reconciliation-baseline-20260930.md).

- Friday-Night Scoring Operations V1; public Scores hotfix to `/scoreboard`; pending score-report indicators; score review/history/correction tooling; audited scoreless outcome workflow; canonical identity prevention guard. Historical identity repair is completed, as noted below.
- Team Feed Phase 1: administrator publishing, school/game associations and public read surfaces. Activation remains operational; Phase 2 is not shipped.
- Followed-Team Personalization V1 and existing follow/notification foundations. Better onboarding and repeat use remain active.
- Weeks 6–11 cash-contest foundation: valid-entry controls, frozen deadlines, individual locks, grading/tiebreakers, Monday unresolved-result cutoff, correction reconciliation and winner/claim/payment records. Week 6 launch; Pick ’Em submissions/admin tools. Weeks 8–11 administration, independent tiebreaker selection, receipt-based reporting and mobile improvements are shipped.
- Gilder Storage sponsor treatment, responsive presentation/logo polish, simplified Official Rules, evergreen Pick ’Em social/Open Graph preview and uppercase `/Pickem` redirect.
- Account username management and authenticated Change Password; shipped recovery/reset with accepted isolated same-browser verification. Production authenticated account/recovery testing was not repeated. Existing display_name remains primary; username remains secondary.
- Signup Spam/Junk guidance; School directory Featured/All improvements and Last 5 ordering; homepage editorial-feature administration.
- Existing public scores/schedules/Game Centers/hubs/districts/coverage, member access controls, conversion foundations, product email and Score Scout/contributor foundations. Operate and measure these rather than rebuilding them.

## ACTIVE OPERATIONS — October 26 to November 25

Priorities: audience and registration growth; consistent editorial and engagement operations; useful unfinished work; reliable game nights; and defensible 2026 evidence for 2027 sponsorships. The target remains 500 registrations.

- Seven-school pilot: De Leon, Cisco, Goldthwaite, Albany, Stephenville, Hico and Comanche. Use existing hubs and feed; the five V2 hubs are unchanged. See [operations](2026-season-operations-plan.md), [Team Feed](team-feed-plan.md) and [measurement](pickem-growth-retention-plan.md).
- Pick ’Em: Week 10 is open, Goldthwaite at Stamford is the independently designated tiebreaker, and entry closes October 30 at 7 p.m. Central. Week 11 is a ten-game draft requiring owner confirmation and separate authorization to open.
- Public score attribution, bounded 30-second Game Center refresh, mobile stats, five-school Team Hub V2, accepted-entry and retention reporting, and the 29-row identity repair are SHIPPED / COMPLETED. Team Feed has three published posts and six active school assignments at the assessment. These are not reasons to restart completed work.
- Follow adoption, content publishing, staffing confirmation, score verification and sponsor evidence are ACTIVE OPERATIONS. Address actual new incidents; do not restart scoring, authentication recovery, mobile or hub projects without evidence.
- Week 9 had six first-time entrants and 51/80 direct prior-week returns (63.8%). Acquisition is the principal concern; this does not establish a retention collapse.

## BLOCKED / DEFERRED

PR #98 Team Feed targeting is built but BLOCKED: no diagnostics, merge or migration without demonstrated placement need and separate approval. PR #58 trusted runtime remains draft and DEFERRED. Grafana/Cloudflare monitoring is not verified operational; do not provision, upgrade, activate or rebuild. Persistent manual ingestion production installation is not authorized. Coverage-demand infrastructure is DEFERRED. Code and migrations alone do not create priority.

## POST-SEASON / OFFSEASON

- **Season preservation / 2027 rollover.** Outcome: retain 2026 IDs, outcomes, stats, contests and usable season access while opening 2027. Why then: full-season evidence. Dependency: season-bound reads, identity/storage/retention inventory. Acceptance: reviewed design with deterministic season tests and no silent historical rewriting. Horizon: preserve before next-season defaults change.
- **Sourced School Legacy / Trophy Room pilot.** Outcome: verifiable small histories from school hubs and existing directory. Why then: current conversion/reliability outrank research. Dependency: sourced claims, verification states and correction provenance. Acceptance: honest archive gaps, working historical URLs/directory continuity and no live-outcome rewriting. Horizon: bounded offseason research. See [Legacy strategy](school-legacy-strategy.md).
- **Canonical Schedule Management Phase 1, then parity-gated read cutover.** Outcome: one protected catalog with preserved references. Why then: substantial transition. Dependency: frozen eligible IDs/count/digest, registries, historical debt and downstream parity. Acceptance: Phase 1 shadow parity with unchanged production reads; Phase 2 requires reviewed cutover evidence. Horizon: deferred in season unless maintenance is a demonstrated bottleneck. See [schedule roadmap](schedule-management-roadmap.md).
- **Verified-contributor media pilot — CONDITIONAL / DEFERRED.** Outcome: selected contributors submit one image with provenance/display permission for admin publish/reject. Why then: only if Phase 1 demonstrates value. Dependency: usage/moderation evidence. Acceptance: bounded verified group with safe review/retention policy. Horizon: no broad fan uploads, video, comments, reactions or ranking. See [Team Feed plan](team-feed-plan.md).
- **Web push pilot — CONDITIONAL / DEFERRED.** Outcome: useful opted-in alerts. Why then: only demonstrated demand justifies infrastructure. Dependency: channel consent, device management and delivery reliability. Acceptance: reviewed narrow pilot with adoption/revocation measurement. Horizon: evidence before new operating burden; no active implementation commitment.
- **Deeper statistics ingestion.** Outcome: reusable sourced rosters/stats, never gaps as zero. Why then: season source-quality evidence. Dependency: [existing workflow](STAT_INGESTION.md), stable identity/provenance. Acceptance: separately scoped design and reconciliation. Horizon: avoid a large current-season rewrite.

## DEFERRED / ARCHITECTURAL

Web push infrastructure beyond a demand-gated pilot; broad community/fan uploads; video hosting; comments/reactions/algorithmic ranking; rewards/redemption and merchandise; native apps; broad statewide expansion; deep archive/search infrastructure. Resume only with demonstrated value, workload/cost evidence, reliable data and new owner scope approval. PWA installation education is not an immediate infrastructure priority. Conditional Team Feed Phase 2 is not the default next task.

## DATA INTEGRITY / TECHNICAL DEBT

**Historical FINAL Identity Reconciliation — COMPLETED.** The October 25 assessment reports the 29-row repair completed and 89 live FINAL rows checked without double-null participant slugs. The old 29-row review remains historical. Preserve scores, revisions, timestamps, grading, notification and immutable audit safeguards; investigate newly observed defects separately.

Other integrity work stays bounded: sourced school/player deduplication, verified-final versus detailed-stat completeness, registry synchronization without public ID changes, and preservation of correction/claim relationships and Team Feed associations at cutover. Safeguards constrain work; they do not authorize cleanup.

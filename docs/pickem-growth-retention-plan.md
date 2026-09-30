# Pick ’Em administration, conversion and retention

Status: ACTIVE — NOW / NEXT under [ROADMAP.md](ROADMAP.md). Reconciled September 30, 2026. No contest mechanics changes are proposed here.

## Existing foundation and immediate administration audit

Weeks 6–11 cash-contest rules/entry/lifecycle foundation is SHIPPED. Week 6 is OPEN at the snapshot; Week 7 is not yet configured. Preserve eligibility, phone/attestation, entry acceptance, frozen earliest included kickoff, per-game locks, tiebreakers, prize calculation, Monday cutoff and correction/claim behavior. Current public policy is `/pickem/rules`, backed by current implementation; older rules drafts are historical.

Known bounded issue: `app/internal/pickem/page.tsx` filters weeks 5–7 and uses `[5, 6, 7]` for forms. Do not misdescribe this as a database restriction. The save action accepts broader nonnegative weeks but derives the tiebreaker from `specialEvent === "Game of the Week"`. Read-only baseline shows Week 6’s stored tiebreaker is Goldthwaite–Miles even though current repository Week 6 records have no such flag. Audit safe configuration/resave before proposing any UI extension; adding week options alone is insufficient evidence.

Focused next audit: available canonical real-game slates for Weeks 8–11; independent tiebreaker selection; admin/moderator boundaries and database authority; draft versus OPEN transitions; preservation of accepted entries, frozen deadlines and locks on edits; schedule revisions/earlier-moved kickoff VOID behavior; rules/sponsor configuration; outcomes/grading/finalization/correction/claim relationships. Use isolated fixtures only for future verification, then a bounded draft implementation PR under separate authorization. Never resave an active production slate merely to test it.

## Measurement definitions

- Saved draft: at least one saved pick/draft state; not a valid accepted entry.
- Complete selections: every required game choice exists; still not sufficient without tiebreaker, phone and attestation/deadline acceptance.
- Valid accepted entry: authoritative accepted cash-contest entry meeting the existing complete-entry rules, initially accepted before the frozen deadline. Later invalidation/disqualification must be reported separately. Edits do not reset its original acceptance timestamp.

Existing conversions UI counts participants with at least one pick and complete slates with all games selected. Those metrics are useful but must not be relabeled as valid entries. Reconcile any dashboard extension to existing authoritative entry records and current eligibility status.

Define each observation window, numerator and denominator before reporting:

- Signup → valid entry: distinct newly registered cohort members with a valid accepted entry in the target week / distinct registrations in the stated acquisition window. Also report confirmed accounts separately and time remaining before deadline; an all-time account count is not this denominator.
- Week 6 → Week 7 repeat: distinct stable account IDs valid in both weeks / distinct Week 6 valid entrants at the declared snapshot. Report later disqualifications/cohort changes. Account ID is an analysis key, not public output; enforce one-person rules separately.
- Leaderboard return: distinct eligible cohort members who revisit the leaderboard after grading/finalization in a stated interval / cohort size. Audit existing telemetry; NOT VERIFIED until sufficient events exist. Do not infer a return from pick rows.
- Follow adoption: distinct cohort members adding or already holding a follow / distinct eligible cohort, distinguishing newly added from preexisting follows. Selection remains optional and never blocks Pick ’Em.
- Winner/admin funnel where useful: finalization → actual notice sent → timely response → decision → actual payment. Record timestamps and delays; a button/record does not prove external notice or payment occurred.

Operations takes entry snapshots at opening/promotion, deadline and grading/finalization, with observation time and query definition. Week-over-week repeat requires Week 7’s actual acceptance window; no repeat result can be declared yet. Preserve phone/email/UUID privacy and existing consent; do not add tracking solely to fill a chart.

## Bounded conversion and personalization

Followed-Team Personalization V1: SHIPPED. NOW: evaluate current-week return, entry-status clarity and leaderboard discoverability using observed friction. NEXT: optional skippable followed-team onboarding, contextual school return paths and post-grading/repeat-week participation. Do not require team selection before entry or change display_name’s primary identity role.

Acceptance: mobile members find the open contest, understand draft versus accepted entry and can return after grading; cohort measurements show adoption/retention or honestly state insufficient evidence. Avoid broad redesign, mandatory onboarding, unsolicited notification opt-in or a new rewards system.

## Sponsor and growth reporting

NEXT: give the owner aggregated valid entries, repeat rate, signup conversion, follow adoption and verified tagged traffic with dates/limitations. Separate visits/impressions from registered members, saved picks and accepted entries. Use stated campaign/source tags; do not claim causation from correlation. No sponsor access to private entrant data/contact information. The 500-member goal remains a growth target, not a substitute for retained users. Use observed 2026 traction for 2027 sponsorship proposals.

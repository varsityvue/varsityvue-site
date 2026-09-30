# Public score-update attribution

Status: SCOPED / AUDIT REQUIRED. Horizon: NOW, after contest administration and reliability. Product priorities: [canonical roadmap](ROADMAP.md). Documentation only; no implementation authorized here.

## Recommended policy to review

Use **Updated by @username** in small muted text below LIVE score/state information. It names responsibility for the state on screen, including later changes; “Submitted by” can misleadingly imply the original report. Example: Stephenville 7, opponent 0, 1st Quarter, Updated by @zachbowles. The next accepted authoritative update replaces the attribution.

Default to the authenticated actor whose action published the authoritative state. A pending community report is not a trusted update and receives no public attribution. When a reviewer accepts a report, attribute the publishing reviewer, not both reporter and reviewer. Original reporting credit could be separately reviewed later; do not turn the card into private moderation history.

Corrections: recommend neutral **Corrected by VarsityVue** for audited administrator corrections, rather than preserving a superseded submitter or exposing correction actors/history. Keep private stable-UUID audits intact. Distinguish genuine score/outcome corrections from metadata/schedule-only changes; the latter must not falsely take score credit.

FINAL: recommend no permanent personal byline in compact historical cards. Evaluate retaining neutral “Verified by VarsityVue” on the detailed Game Center if it explains trust; do not promise “Final verified by @username” unless an explicit final-verification event actually exists. This avoids converting a live recognition feature into unnecessary permanent personal endorsement. Owner review must settle LIVE/FINAL/correction policy before release.

## Public identity and lifecycle

- Allow only safe public identity. Prefer the actor’s current validated username. UUID remains authoritative internally; never use username as database identity. Preserve immutable audit evidence rather than replacing it with mutable handles.
- Default no-username fallback recommendation: **VarsityVue contributor**, role-neutral. Evaluate current public display_name only after a safe-name policy; never automatically expose email-like names. “VarsityVue” is appropriate for system/neutral correction treatment, not a misleading claim that every contributor is official staff.
- No email, phone, Auth UUID/internal user ID, private roles, moderation notes or private correction history may enter the public payload.
- Current username is recommended for public display; historical snapshots may remain in private audit evidence if already present. A rename changes the public label, not score identity or audit facts.
- Suspended/deactivated/deleted or unresolvable actors fall back to neutral attribution (or omit the line) without changing historical scores. For lost contributor authority, recommend neutral fallback after authority loss; audit whether historical recognition is justified and technically safe. No deletion cascades may erase outcomes/audits.
- Enforce existing reserved-name/impersonation rules. Resolve attribution server-side from trusted actor provenance. Clients must never provide arbitrary attribution text or choose another actor. Public identity lookup must not broaden profile RLS or expose private records.

## Focused audit required before implementation

1. Trace every authoritative writer: trusted submit, accepted community report, Score Scout review, scoreless outcome, score correction, schedule/lock changes and imports. Prove score-responsible actor rather than assuming generic `updated_by` always suffices.
2. Inspect `game_state.updated_by`, `source_submission_id`, score/outcome revisions and immutable submission/correction events. Existing V1 approval propagation writes `new.reviewed_by` into `updated_by`; audited correction sets the correction actor and clears the source submission. Public dynamic readers currently select no actor fields. Confirm production schema and actual null/legacy/system cases with aggregates, without exporting identities.
3. Audit a minimum safe public profile projection, username validation/reserved names, fallback, display_name email-like filtering and actor-status handling. Do not expose UUID to the browser simply to perform a lookup.
4. Decide LIVE, FINAL and correction wording, rename snapshot policy and whether schedule-only changes can misattribute the score. Resolve missing provenance honestly; no fabricated backfill credit.
5. Verify accepted-report reviewer versus original reporter, stale/racing writes and attribution/score consistency in one authoritative read. Pending/rejected reports must never appear as score credit.
6. Audit mobile layouts and screen-reader clarity; test long handles, no username, missing/deleted/suspended actor, lost authority, corrections, FINAL and renamed account. Scope the separately authorized release only after policy acceptance.

## Surface recommendation

- Scores `/scoreboard` full LIVE cards: YES.
- Game Center: YES for LIVE; reviewed neutral FINAL/correction treatment only if useful.
- School Hub current live game card: likely YES if it reuses the same public score model.
- Historical Last 5: NO personal byline.
- Compact homepage ticker/cards: NO by default; reconsider only with real space/usability evidence.
- Team Feed game-linked posts: do not copy a scorer into the post’s author credit. If a separate LIVE score widget is reused, audit that widget independently.
- Internal scoring: YES to useful responsible-actor context under existing access controls; no reason to publish private review notes.

Acceptance: a focused audit yields a reviewed actor/fallback/lifecycle/surface policy; any later implementation derives a safe byline from the same authoritative state, keeps scores/status/quarter/clock/school names dominant, and passes privacy, abuse, concurrency and mobile evidence. No feature was implemented by this plan.

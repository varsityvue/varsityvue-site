# Near Me simplification draft

Baseline: main 7fef91f9758c23dbbf2008ebc42db9bbd6a60c71. Draft only; no production release or measurement activation authorized.

Both aliases use the existing renderer and discovery/filter helpers. This change is presentation only:

- Unavailable weeks have one availability notice and an All Games link. Missing centers have one location instruction; neither state reports a misleading zero-game count or adds a second empty card.
- Genuine empty results retain the center, radius and all filters. Review Filters opens the existing panel and focuses its summary. Browse All Games changes only mode.
- Failed score refresh retains results/center and reports unavailable scores rather than asserting an empty result. Offline suppresses the second score-error notice. All Games notices remain unchanged.
- Measurement uses a compact status with separate collection availability and preference wording. Privacy stays visible. Sharing options are native details; an enabled preference exposes immediate withdrawal outside the collapsed details. Withdrawal focuses the summary. The existing consent hook, persisted values, cross-tab reconciliation, storage fallback, flags and delivery contract are unchanged.
- Location details move behind native details. Permission, synthetic/device center validation and cancellation stay unchanged.
- Only unified-page promotions opt into smaller Near Me styling. A live mode attribute controls presentation, including client mode transitions. Access notes, account authentication, signup destinations/tracking and Pick ’Em state/deadline checks remain unchanged. Full All Games presentation returns when leaving Near Me.
- Without JavaScript, Near Me shows one fallback link preserving public refinements; search/week/filter forms and Privacy remain available. Inert location/consent controls and misleading counts are hidden.

Read-only contest evidence on October 5: Week 6 raw status is open with closes_at October 3 00:00:01 UTC, already elapsed; Weeks 7–11 are drafts. Existing deadline logic correctly presents Week 6 as Closed. No contest state changed.

Verification: focused static-render preference tests and disposable browser fixtures cover both aliases, Weeks 6–11, missing/empty states, private-memory center preservation, exact legacy status restrictions, explicit status overrides, history/returns, refresh failure, immediate withdrawal, keyboard focus, mobile/desktop and 200% text. Existing consent browser tests exercise unchanged reconciliation and delivery in isolated enabled fixtures only. Hosted verification keeps consent declined.

Provider protection, real device geolocation, physical Safari/Android behavior and manual screen-reader operation are separate evidence limits. Shared footer/navigation are untouched; the original screenshot navigation-bar cause remains NOT VERIFIED. GOTW stays held and unfinished; Friday staffing remains a separate task.

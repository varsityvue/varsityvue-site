# Unified weekly Games and Scores

Owner-approved scope: one draft implementation PR. No merge, production release, migration, database grant, analytics enablement, or configuration change is authorized.

## Interaction contract

`/games` is the primary collection. The first ordinary visit selects the Central Monday–Sunday schedule week, then the nearest future slate, then the latest past slate. An explicit week remains selected even when empty. Scores intent selects a verified live slate, otherwise the latest final slate, otherwise the next upcoming slate. Search-only legacy URLs remain seasonwide. Week 0 scrimmages remain available; byes remain excluded.

All Games places Your Teams first (four initially, expandable), excluding every followed matchup from the remaining list. Canonical IDs deduplicate games even when both schools are followed. Near Me orders by distance with a Following marker inline, within the existing approved radius and venue pilot. Search, status, classification, district, Following-only and radius intersect. Changing weeks preserves public filters and clears the location center. Empty followed matches never hide other games.

LIVE requires the existing authoritative public score contract. Inferred kickoff windows remain distinct. Upcoming is the future/date-pending schedule; Completed includes final, exceptional and cancelled outcomes. Legacy current and verified-final scopes have an explicit explanatory treatment. Numeric zero is preserved, unknown scores use a dash, and forfeits/no-contests do not invent a numerical result.

Foreground refresh runs every 30 seconds for a slate containing authoritative live games or kickoff windows. Hidden/offline readers pause requests; returning refreshes. Requests are single-flight, cancellable and generation-guarded. Failures retain the last available snapshot. Score and attribution arrive together. Background updates hold row order and membership until Apply updates when membership/order changes; a LIVE-to-FINAL row remains readable in place. The clock is last reported, never a local countdown. The displayed refresh time is fetch time, not a publisher timestamp.

Near Me uses exactly the pre-existing 2026 Week 7/8/9 pilot gates and 10/25/50/100/150-mile straight-line radii. Choosing Near Me never requests GPS. Location requires an explicit button, has a ten-second timeout, zero cached-position age and a 1,000-meter accuracy ceiling. School venues provide the alternative center. Centers stay in component memory; stale callbacks cannot repopulate a departed week. No coordinates enter a URL, storage, analytics event or backend request. All weeks and unapproved slates keep the mode and show unavailable controls.

Rows use school names, white/grey text, VarsityVue red selected controls, public live attribution and separate Actions disclosures. Broadcasts, venue maps, pending/report links, previews, known team records and stat availability remain available. Game Center and school detail functionality is unchanged. Existing recruitment, membership and Pick ’Em links remain after the collection; historical signup-source identifiers remain intact pending a separate analytics definition review.

## Compatibility

- `/scoreboard` permanently redirects (308) to `/games?intent=scores`, copying only allowlisted public query keys. Its metadata image endpoints remain unchanged.
- `season`, `week`, `q`, legacy `status` and `view` retain their supported intent. New parameters are `filter`, `mode`, `classification`, `district`, `following`, `radius`, `state`, `result` and `intent`.
- `status=final` without a week becomes All weeks, Completed, verified-only; `view=completed` includes cancelled. `status=upcoming`, `view=current` and legacy district links preserve current/unresolved semantics, rather than adopting the new strict Upcoming chip.
- Legacy fragments `live-now`, `final-scores`, `upcoming` and `nearby-games` translate once into public state and normalize to the collection anchor. Explicit weeks win. No GPS is requested by a fragment.
- Public filter changes create browser history entries. Initial normalization replaces the entry. Game Center links carry an allowlisted same-origin collection return URL; direct detail visits return to the game's own season/week. Precise centers are deliberately not restored.
- Header/mobile navigation uses Games. Scores-oriented inbound CTAs and manifest shortcut use scores intent. The sitemap has one primary collection entry, `/games`; collection canonical metadata points there. Both routes retain existing cache invalidation compatibility.

## PR #39: required separate integration

PR #39 is not imported, modified or enabled here. Its existing `SummaryV1` definitions describe the old Nearby experience: `all` means live + upcoming, `live` includes inferred kickoff, district is a mutually exclusive filter, and final excludes cancelled. The approved unified controls have different meanings. Do not attach that measurement code to these controls without a separately reviewed contract revision.

Required integration work in a separate change:

1. Define true status dimensions (authoritative LIVE versus inferred kickoff, strict Upcoming, Completed including cancelled), independent district/classification/Following filters and weekly versus archive scope. Keep historical reports explicitly versioned; do not reinterpret V1 history.
2. Attribute `/scoreboard` traffic to the canonical collection while preserving scores intent. Count a redirect chain once. State normalization, server/client mount, refresh and back/forward restoration must not create new demand episodes or pageviews accidentally.
3. Scope demand episodes to deliberate week/center selection; define one lifetime per episode, cancellation and completion. A 30-second background refresh is not engagement, a new discovery episode or a reset of its inactivity window.
4. Preserve consent gates and cross-tab changes; never capture coordinates, accuracy, school-center geography, private followed-school sets, member identity or raw searches. Continue the existing sanitized/coarse reporting boundaries and minimum aggregation rules. Consolidation does not authorize broader collection.
5. Track game selection only for a deliberate Nearby Game Center action once; do not double-count body links and the Actions equivalent. Venue-map and broadcast links need explicit policy before expanding scope.
6. Verify coverage-demand meanings remain comparable. Distinguish unavailable week, no center, no games in radius and filtered-empty results, without reporting an unavailable venue pilot as lack of demand.

Optional future work, not included: status-chip adoption, Your Teams ordering usage, search demand, manual refresh usage, share intent or broader browse analytics.

## Review and acceptance

Review the normal weekly slate, LIVE, Nearby and Completed at 390/400/430px and desktop. The isolated browser suite uses illustrative scores and a local synthetic Supabase service; no real account, production writes or GPS are required. Screenshots and test output are GitHub Actions artifacts. Tests cover legacy routes/fragments, history, no-JavaScript browsing, deduplication, attribution, exceptional results, stale refresh, live-to-final preservation, explicit permission, stale location callbacks, unavailable weeks, text enlargement and focus visibility. Public contract and existing venue/scoring tests remain in CI.

Limitations: synthetic browser data does not establish production freshness or publisher latency. Real screen-reader, physical-device permission UX, production credentials and production database write paths are outside this verification. Production migration ledger was not queried and no migration is needed. Any unrelated, unpushed redesign-chat work cannot be identified from the repository; it is not incorporated.

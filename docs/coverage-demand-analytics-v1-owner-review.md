# Games Near Me coverage-demand analytics V1 — owner review

This draft measures accepted search summaries, not unique people, residents, accounts, or verified human activity. It does not change week approval, schedules, scores, contributor authority, Pick ’Em, Team Feed, follows or the Featured School list. It creates no coverage ranking, map or dashboard UI.

## Privacy and user choice

Discovery remains a local operation. Browser coordinates stay in component memory, are requested only after the existing Games Near Me button is activated, and are invalidated by Clear/cancellation and page departure. There is no watchPosition, automatic GPS request, reverse geocoding or IP geography.

An inline, equally weighted choice reads:

“Optional approximate regional usage helps VarsityVue decide where to expand coverage. Precise location is not saved. Games Near Me works without sharing.”

Buttons: “Allow regional measurement” and “Don’t share regional usage”. Both have keyboard focus and pressed state. Default is no measurement. Location permission is separate. The only stored preference is localStorage coverage_measurement_v1 = enabled/disabled. The preference is neither an identifier nor attached to a request. Storage failures fall back to in-memory choice for the mounted page. There is no modal or recurring nag. The inline controls remain available to reverse the choice. Declining discards the unfinished episode without sending it. Mounted tabs listen for preference changes in other tabs, including key removal, invalid values and storage clearing, and immediately discard unfinished measurement when permission is absent. Every finalization also re-reads the persisted choice, so delayed or blocked storage notifications cannot make stale enabled component state sufficient authorization. Cross-tab opt-in observes the current controls only; it does not reconstruct pre-consent interactions. When storage cannot be read, only the explicit mounted-page choice is used; a delivered cross-tab withdrawal event also revokes that memory fallback. If reads work but a preference write fails, readable persisted state remains authoritative and measurement fails conservatively. Already transmitted requests cannot be recalled, and previously accepted nonidentifiable counters cannot be individually located or removed.

The same optional choice applies to school-center summaries. A school-center summary is chosen search geography, never evidence of the person's actual location. Reporting always separates school_center from browser_location.

## Grid contract

Version: tx25-v1. Regional spherical Lambert conformal conic, earth radius 6,371,008.8 meters, standard parallels 27.5° and 35° north, central meridian −100°, latitude of origin 24°, zero false easting/northing. Formula is implemented directly without a new dependency. Cells are 40,233.6 × 40,233.6 projected meters: 25 × 25 international statute miles. Projection distortion means ground sizes are approximate; this is a coverage-planning grid, not a survey.

Valid client service rectangle: latitude 25°–37° inclusive and longitude −107°–−93° inclusive. Points outside it do not emit summaries; discovery still works. This rectangle includes Texas and nearby border areas and is not a claim about administrative boundaries. Server IDs are bounded to columns −18..17 and rows 2..36, the envelope of the service rectangle. The server cannot prove a submitted bucket corresponds to a real GPS reading.

Leaf ID: tx25-v1:c{integer column}r{integer row}. No latitude/longitude is encoded. Boundary ownership uses floor(easting / cell size) and floor(northing / cell size); a point exactly on an edge belongs to the cell east/north of it. Negative eastings also use floor, not truncation. IDs use canonical integers, without leading zeros or negative zero.

Parent ID: tx25-v1:p{floor(column/4)}r{floor(row/4)}. Parents contain a fixed 4×4 set of leaves and are approximately 100×100 miles. No arbitrary neighbor merging. Reporting always uses parents in V1, a conservative supported rollup rather than exposing eligible leaves. Any geometry, projection, origin, region or parent-scheme change requires a new grid_version and new validator/report implementation. Do not relabel old counts as a new grid.

## Episode and exact summary contract

An episode is one chosen center object and selected schedule week on the mounted page. It has no durable ID. Center/week changes and Clear finalize the current summary then reset. First nearby Game Center click (including middle click), 60 seconds without measured control changes, pagehide, hidden visibility or component departure may finalize. One summary maximum per episode; later interactions do not restart the finalized episode until a center/week change. Delivery is best-effort and can be lost on exit. Re-selecting a center starts a new episode. No cross-page or ordered search history exists. Opting in midway starts observation from the current controls, without reconstructing pre-consent interactions.

GamesNearMeSearchSummary has exactly these fields, all required:

schema_version: integer 2 (draft-only unified contract; V1 payloads fail validation)

grid_version: tx25-v1

coarse_bucket_id: validated leaf ID

center_source: browser_location or school_center

season: 2026 in V1

week: integer 1..11 in the shared parser; active ingestion permits only verified Weeks 7, 8 and 9

initial_radius_miles, final_radius_miles: 10, 25, 50, 100 or 150

radius_expansion_steps: integer 0..4, capped count of increases; radius_expanded: boolean consistent with steps

filter_scope: all, live, upcoming or completed. All includes every unified presentation category; LIVE requires confirmed public live status. Completed includes verified finals, exceptional outcomes and cancellations.

district_only, additional_filters_present, current_only, verified_only, held_results: booleans. held_results identifies the released UI’s retained result rows during refresh; presentation counts remain actual while selected status/current/verified filters describe the requested scope. Those status subset checks apply only to unheld results; count, sum, allowlist, bounds and approval validation always apply. additional_filters_present indicates classification and/or Following restriction without transmitting classification text, followed school slugs, member state or any identity. Combined exclusion is other_bounded_case; no unsupported attribution to a single status filter.

query_present: boolean; trimmed query text is never sent

week_real_game_count, week_located_game_count, week_unlocated_game_count: integer stage counts

in_radius_real_game_count: all real, verified-location games within radius, independent of status/query

in_radius_default_eligible_count: all real, verified-location in-radius games before optional filters; equal to in_radius_real_game_count in schema 2. This is the unified All default; the old LIVE + upcoming interpretation is retired.

returned_game_count, live_game_count, kickoff_window_game_count, upcoming_game_count, final_game_count, other_game_count: final returned result counts. live_game_count counts confirmed public LIVE presentation; kickoff_window_game_count separately counts schedule-inferred kickoff windows. other_game_count includes awaiting-verification, postponed and cancelled presentation; final_game_count includes verified exceptional outcomes. The five presentation counts sum to returned_game_count. LIVE cannot include inferred kickoff windows.

game_selected: boolean only; no selected game or school identity

zero_result_reason: none, no_games_in_radius, status_filter_excluded, query_filter_excluded, week_unapproved, week_location_incomplete, no_real_games or other_bounded_case

location_catalog_version: locations-edc8867688bf

schedule_catalog_version: schedule-1692cf167930

Counts are integers 0..512 with subset/sum and status-filter consistency checks. The current server revalidates approved slates and exact 17/17/0 completeness. Disabled/incomplete weeks never start measured geographic episodes. The broader zero enum documents stage semantics; week_unapproved, week_location_incomplete and no_real_games are not accepted for current complete approved slates. No generic coverage_gap boolean is used. Unknown locations never contribute fabricated nearby counts.

The server derives Central reporting date and approval validation. No client date, precise location timestamp or per-summary accepted timestamp is stored. created_at describes the first aggregate row creation, not individual searches.

Location version fingerprints the venue, school-to-venue and game-override source files; metadata-only source changes may conservatively update it. Schedule version fingerprints merged canonical ID, season, week, kickoff, type, school slugs and district flag, excluding scores. Runtime score/status changes and database kickoff overrides do not change the repository schedule version. This limitation is deliberate: it identifies the deployed canonical catalog, not a per-request dynamic-data snapshot. Tests require version refresh when catalog content changes. No canonical IDs are changed.

Prohibited fields are excluded through an exact allowlist: raw or rounded coordinates; GPS accuracy/altitude/heading/speed/timestamp; address, ZIP or county; account/profile/member UUID; email/phone/username/display name; auth or Supabase token; session, anonymous, device, visitor or contributor IDs; IP or IP geography; URL/referrer; free-text query; selected game/school; ordered centers or radius trail; movement; exact result-distance vectors; sourceReferences/verification metadata. No component state is spread into the contract.

## Ingestion and failure behavior

POST /api/coverage-demand. Browser fetch uses credentials: omit, no-referrer policy, JSON, keepalive and a 2-second deadline. No retry or correlated selection event. GPS results, radius changes, center selection, Clear and game navigation do not await it. No sendBeacon (which cannot offer the same explicit credential control).

The exact route bypasses session refresh in proxy.ts before updateSession. It reads no member/session, cookies, IP or user agent. Requires application/json and same Origin; returns no CORS permission. POST only. Reads at most 2,048 bytes even without Content-Length. Rejects unknown fields, missing fields, coordinate-like aliases (as unknown properties), invalid JSON/types/versions/buckets/enums/radii/count relationships/catalogs/slates. Responses: 204 accepted; 400 invalid; 429 process capacity; 503 disabled/unconfigured or database delivery failure. There are no payload-content application logs.

Abuse controls: strict contract, exact approved catalogs/slates, a transient instance-wide 120 requests/minute budget, database aggregate constraints and a single global 1,200 accepted requests/minute capacity row. No fingerprint or client/IP keyed counter. Database increments serialize through a transaction advisory lock; appropriate for bounded V1 volume, not a high-throughput analytics service. This is capacity protection, not strong bot defense. A replay with valid fields can inflate counters; IDs/deduplication are deliberately absent. Same Origin is not authentication against non-browser clients. Deployment-level rate limiting should be evaluated before activation, without writing IP into demand data.

## Database and reporting

Migration: supabase/migrations/20261003064603_coverage_demand_analytics_v1.sql. Do not apply it to production under this authorization.

private.coverage_demand_daily key: Central report_date + grid_version + coarse_bucket_id + center_source + season + selected schedule week + location_catalog_version + schedule_catalog_version. Radii, filters, query flags, reasons and counts are NOT joint row dimensions. This avoids a row per behavior combination.

Each row stores summary_count and flat counter/histogram metrics. Counters: radius_expanded, game_selected, zero_result, query_present, district_only, additional_filters_present, current_only, verified_only and held_results. All use the same value/complement suppression. Histograms: initial/final radius; capped expansion steps; filter; reason; week real/located/unlocated counts; in-radius real/default-eligible; returned/verified-live/kickoff-window/upcoming/final/other counts. Count bins: 0, 1, 2–5, 6–10, 11+. No raw payload is persisted. No median claim is made from coarse bins. No unique-person estimate exists.

private.record_coverage_demand_summary(jsonb) repeats validation and atomically increments/upserts. public.server_record_coverage_demand_summary(jsonb) is a narrow PostgREST bridge, executable only by service_role; no anonymous/member browser can invoke it. The private function and tables have no direct application-role grants. Trusted server config uses a server-only credential, never user credentials. RLS is enabled with no member policies. Definer functions use empty search_path and explicit schema qualification. public.server_retain_coverage_demand() is similarly service_role-only.

public.admin_coverage_dashboard(p_kind text, p_from date, p_to date) requires auth.uid(), active membership and existing admin role. Anonymous and ordinary members cannot report. Fixed period boundaries only: week means Monday–Sunday, max four weeks; month means calendar months; season means one calendar season year. Weekly requests whose start is before today minus 29 Central dates fail with “Weekly reporting start precedes retained daily coverage window”; the entire multiweek request fails rather than silently returning a retained fragment. Future-only requests fail with “Future-only coverage reporting periods are not supported”. Current/open periods are explicitly incomplete; output adds period_end, period_state (open/completed), reporting_as_of and effective_through. A period is completed only when its end is before reporting_as_of; effective_through is the earlier of period end and Central today. Ranges containing wholly future constituent weeks or months also fail with “Coverage reporting range includes future-only periods”; the current open period’s future end boundary is allowed. The public administrator function has no caller-controlled reporting clock. A revoked private coverage_dashboard helper takes a deterministic date solely for trusted isolated tests. Maximum range 400 days. No source/filter/leaf override or partial-day slicing. Returns JSON rows: period, period_kind, grid_version, reporting_region, center_source, season, accepted_summary_count and privacy-suppressed metrics. Rates can later be derived only from disclosed counters and their accepted-summary denominator. Selected schedule weeks and catalog versions are combined in these coarser reports, rather than exposed as sparse breakdowns. Week completeness is observed context in the count histograms, not a claim about unobserved searches or all unapproved weeks.

Suppression floor: 20 accepted summaries per weekly parent/source cell (not 20 people). Every leaf is omitted; deterministic parent totals below 20 are omitted, without a fallback geographic total. There are no simultaneous parent+leaf totals. Small counter values AND small complements are null. Histogram families with any small nonzero bin or complement are omitted as a whole to prevent subtraction. Monthly and season outputs use the same floor. Source categories are never combined to rescue a sparse category. Administrator UI/RPC cannot override these safeguards.

Limitations: a count threshold is not proof of anonymity. Repeat reporting over growing counters, moving retention boundaries and comparisons across weekly/monthly/season outputs can permit differencing; fixed boundaries reduce arbitrary slicing but provide no differential privacy or immutable release snapshots. Database operators with privileged direct SQL can inspect aggregate leaves (not raw events); admin RPC callers cannot. Sparse areas are underrepresented and opted-in summaries are a self-selected sample. There is no person-level attribution, movement history or scorekeeper-acquisition linkage.

## Retention and operation

private.retain_coverage_demand(p_today date) transactionally moves leaf rows older than 29 prior Central dates (30 calendar dates including today) into fixed parent-only monthly and season aggregates, then deletes leaves. Idempotent: moved leaves disappear in the same transaction. Monthly/season keys omit leaf, schedule week and catalogs and add only their coarser period, grid, source and season. Reports combine unexpired daily counts with archived counts exactly once. Expired daily rows cannot rescue unsupported weekly requests. For supported monthly/season reporting, any not-yet-rolled daily rows contribute only at the parent level within the long-term retention bounds; after transactional rollup they contribute from the matching archive exactly once. This keeps totals stable before and after maintenance without extending leaf retention.

Monthly rows keep 13 calendar-month cohorts including the current month: rows before the month boundary 12 months ago are deleted. The oldest cohort is therefore never retained beyond approximately 13 months. Season rows expire February 1 of season+2, about 13 months after December 31 season end. There are no long-lived sparse leaf records. Both monthly and season copies hold independent aggregate summaries for their respective planning periods.

No scheduler is installed in this PR. Daily execution of public.server_retain_coverage_demand() by a trusted scheduler is REQUIRED before launch; without it, deletion is not automatic. The RPC has no arbitrary-date argument; the private deterministic helper is testable with a date. Choose managed database cron or a separately approved server cron, ensure failures are monitored, and verify provider backups/log retention. Application deletion does not promise deletion from historical provider backups.

## Existing analytics and disclosure boundary

app/layout.tsx still mounts @vercel/analytics/next. components/ConversionViewEvent.tsx passes supplied contextual properties to Vercel; lib/conversion-analytics.ts logs and forwards supplied properties. Neither is used by this regional system. Audit found no new regional payload path into either utility. The helpers are not a guarantee against future callers accidentally supplying location data. A full analytics rewrite/redaction is deferred; there is no change to existing conversion reporting or events.

Precise GPS never enters a URL, cookie or persistent preference. Therefore existing page-view URL analytics receives no GPS from this feature. General analytics may independently use request metadata under its provider configuration. The only privacy page found is app/pickem/privacy/page.tsx, which is contest-specific. This PR does not repurpose it or write a large legal policy. A suitable general site privacy disclosure remains a launch follow-up.

Infrastructure/providers necessarily receive connection metadata (such as source IP and user agent) and the first-party request body in transit. Vercel/CDN/firewall access logs and Supabase/PostgREST/Postgres diagnostics or backups may retain metadata independently of application demand tables. We do not claim universal metadata absence. Application code neither reads nor writes it for coverage analytics. Disable body capture/session replay for this endpoint; review provider logging, retention, analytics and firewall configuration before activation. A server-to-database service credential is necessarily transmitted on that trusted hop; no browser/member authentication token enters a summary.

## Production release steps requiring later authorization

1. Review the exact draft head, migration, test evidence and these limitations. This PR is not a release authorization.
2. Reverify main, production and migrations; assess concurrent changes (including any coverage-presentation draft).
3. Apply the reviewed migration only under separate production authorization. Verify privileges and RPC schema cache, with no production synthetic events unless separately authorized.
4. Set dedicated COVERAGE_DEMAND_SUPABASE_URL and COVERAGE_DEMAND_SERVICE_ROLE_KEY server secrets. There is intentionally no production fallback or reuse of a member client. Preview must point only to disposable data, or remain unconfigured.
5. Configure/verify the trusted daily retention scheduler and provider safeguards, and complete the general privacy-disclosure follow-up.
6. Only then enable COVERAGE_DEMAND_ENABLED=true and NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED=true in the approved deployment. Defaults are off; unconfigured endpoint returns 503 while discovery works. Disclosure and consent controls can still render and store only the preference while collection flags are off; dormant release and activating collection are separate owner decisions. Never place the service key in NEXT_PUBLIC variables.
7. Verify ordinary/anonymous denial, admin suppression and discovery under disabled/failed telemetry. No changes to Week 10/11 approval occur here.

There is no down migration convention in this repository. For a later rollback: turn off ingestion/client flags first; reverse only the new coverage-specific objects under separate authorization. Do not rewrite UUIDs or remove other private-schema objects.

## Concurrent release integration

Starting main was 163624bb2b3b96cf7f953751735e67f166e716a3 with production dpl_FXhgo8CsEWWTETp4gGwVxb7LMfUc. During implementation, PR #38 merged as 7418f075a8778b9b90e90420a906aba989f0a178 and production became dpl_BddXnMkyTWqNhJ9rpEg3RFqssLhJ. This draft incorporates that main revision, preserves the new verified-score presentation and score-load reliability behavior, and adds its presentation/loader regression tests to this workflow. The single Nearby-card conflict was resolved by retaining PR #38 wording and adding only summary finalization handlers. Canonical catalogs and the migration baseline did not change. The analytics diff against the updated main remains bounded to this feature.

## Bounded owner-review corrections

The consent correction synchronizes withdrawal across tabs and reconciles persisted permission before every episode finalization. The reporting correction rejects retention-truncated weekly requests and explicitly labels open/completed periods and their effective date. The original draft migration is amended; no production remediation migration, weekly archive, scheduler, identity or dashboard is added. Tests exercise the November 1, 2026 cutoff, before/after retention totals, and withdrawal of an active unfinished episode in a second tab. Scheduling AND failure monitoring remain activation prerequisites. Released PR #41 is incorporated as described below. Its aliases, public filters, refresh and return behavior remain authoritative.

## PR #41 integration and evidence interpretation

Completion preflight verified main ca9db89ec9368624723453ef3e4be6a1176b7b0f, production dpl_5ejKXcKNmBe92Y3fpGpKW1nXYoGv READY on both public domains, and production migration baseline 20261002200333. Starting PR head was c47b62db8578467e95a7857ccfbdb71e4ffedc1b, draft/unmerged. Current main is incorporated as a merge parent; main is never rewritten. Earlier evidence is historical and is not proof of this integrated revision.

Both /games and /scoreboard remain direct aliases of UnifiedGamesPage and one WeeklyGamesExplorer. The old standalone GamesNearMe component is restored exactly to main and is not mounted by either alias. One useCoverageEpisode instance owns observation in the shared explorer; WeeklyNearbyControls holds the transient source-tagged center, and WeeklyGameRow supplies selection callbacks for the row, Game Center and preview links, including middle click. No duplicate renderer or second episode owner is added. Consent controls render only in Near Me, including when collection flags remain off.

Schema 2 consistently rejects schema 1 at client/server/database. It adapts only the approved search summary to the released unified filters; it adds no All Games measurement, new geography, identifying filter values, result identities or acquisition/conversion events. Week/season/mode changes, popstate departure and center/Clear actions finalize and discard old state. Hidden/pagehide/unmount finalization remains at most once. Full alias navigation ends the mounted episode; the destination has no restored center. Score refresh and Apply updates neither finalize/restart episodes nor reset the 60-second timer. Refresh and Apply updates update only the latest summary’s presentation counts; they do not reset its inactivity timer, center, initial radius or expansion count. Held results can temporarily contain rows outside the selected status category, explicitly identified by held_results. A separate observation effect updates that snapshot without introducing another episode owner or timer. Query presence reflects the committed public search, not unsubmitted input typing.

The released unified interface already puts public search/filter parameters in URLs and Game Center return links. This PR preserves those semantics. Search text never enters a coverage summary or database aggregate. It does not claim existing public query URLs are query-free. No point, bucket, measurement consent or identity is added to any navigation, contributor, signup or authentication return URL. Precise center and center source never enter the public parameter allowlist.

Application checks locally include the relevant 177 regressions, TypeScript, targeted lint, full build and diff checking. Local browser execution cannot supply evidence where the sandbox cannot download Chromium; the exact-head CI workflow installs its own browser and runs both the released unified suite and the revised coverage suite. The coverage suite includes actual two-mounted-tab withdrawal/removal/invalid/clear before inactivity and selection, delayed storage notifications, blocked reads/writes, cross-tab opt-in, aliases, refresh ownership, failure behavior, synthetic GPS and school centers, and retained screenshots/results. Browser artifacts record the checked-out head and tree. Never infer PASS from this test inventory: inspect the exact final workflow results attached to PR #39.

Database evidence must come from the coverage workflow's fresh disposable local Supabase reset using every repository migration, including the final revised original migration, not a stale remote verification project. The SQL suite checks role denial, source/parent/value/complement suppression, schema-2 validation, open/completed week/month/season state, November 1 cutoff crossings, unsupported multiweek/future ranges, stable before/after retention, long-term expiry and idempotence. The concurrency fixture uses 20 parallel connections, and the separate HTTP fixture traverses the actual first-party route and real isolated PostgREST aggregate bridge. Seven existing database suites run from fresh resets. No production fixtures are used. The coverage workflow now runs the released unified browser regression instead of the obsolete standalone Nearby harness.

Preview evidence is a separate category: a READY deployment and checks are not proof of authenticated/browser rendering. Preview keeps both flags off and ingestion unconfigured; active measurement browser/database evidence is isolated only. Record actual Preview browser observations and protection limitations in the final PR report. Manual screen-reader operation, provider request/body logging, diagnostics, backup deletion, session replay exclusion and infrastructure safeguards remain NOT VERIFIED unless separately evidenced. No provider changes, retention scheduler, monitoring setup, dashboard or general analytics rewrite occurs in this draft.

Dormant release readiness requires successful checks and review of the exact final tree. Measurement activation additionally requires separately authorized production migration/configuration, retention scheduling AND failure monitoring, provider logging/body-capture/replay/backup safeguards, suitable general disclosure, abuse-control evaluation and a separate owner activation decision. Residual repeat-report and cross-period differencing, opted-in sample bias, duplicate/replayed summaries and best-effort loss remain explicit limitations.

Actual integrated Preview browser observations at deployment dpl_BeSCSiymMNNGhZiUQRiFG6pWwPys: protected pages were accessed through the already-existing temporary Preview share access, without changing provider protections. Both aliases rendered Games & Scores, one consent disclosure and the released Near Me controls. Hamilton school selection returned seven Week 7 results; Clear and Week 8 navigation removed the center. Scoreboard retained its own public return path. No owner GPS was requested. Observed console messages came from the browser extension and Vercel sign-in screen, not VarsityVue application code. The inherited duplicate VarsityVue browser title on /scoreboard remains unchanged. Final exact-head Preview observations and artifacts are recorded in the PR completion report; isolated active-measurement evidence remains distinct from dormant Preview behavior.

Revised integrated Preview dpl_4Wde3EZvJAs8zAStP1mLiZAosb1u at head 16c9f792a6dd7926af0d5b7a2bb53cd3db5ae007 was READY and rendered in Cloud Browser. De Leon-centered Week 7 results, Clear, Week 9 enabled and Weeks 10/11 disabled were observed; the direct scoreboard alias also rendered the shared controls. An authorized protected-Preview HTTP session submitted only invalid {} to /api/coverage-demand and received 503 (disabled/unconfigured), with no accepted event. Public client compilation retains an unset NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED guard, so collection is off. Initial school interaction before hydration did not update the parent results; interaction after hydration worked. Active-measurement, timeout and focus assertions are verified in the isolated browser suite, not inferred from these dormant Preview observations.

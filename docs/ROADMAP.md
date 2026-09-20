# VarsityVue Product Roadmap

_Reassessed: September 20, 2026 after the Week 5 growth and engagement review_

This document is the permanent product direction for VarsityVue. It exists so short-term development work does not obscure the larger goal.

VarsityVue has soft launched. The immediate challenge is no longer building a participation backend from scratch; it is earning trust, converting useful public traffic into an identifiable local audience, and creating repeat Friday-night behavior.

## North Star

**VarsityVue should be built to operate and grow with as little routine manual intervention from the owner as practical.**

The platform should become the digital front door for local high school sports: useful on Friday night, useful throughout the week, and increasingly valuable as its data and community history compound over time.

A second architectural rule follows from that goal:

> **Every piece of verified information should be entered once and become reusable everywhere VarsityVue needs it, today and historically.**

A verified score should be capable of updating the scoreboard, matchup page, school schedule and record, standings, Pick 'Em grading, notifications, and ultimately the Legacy archive without separate manual edits.

## Strategic Pillars

### 1. Automation and Self-Operation

VarsityVue cannot scale if routine operation depends on one person collecting every score, updating every page, grading every Pick 'Em, or copying the same information into multiple places.

Build toward structured workflows that automatically propagate trusted data. Prioritize systems that reduce Friday-night workload and repetitive maintenance over cosmetic plumbing that does not materially improve the product.

### 2. Community Network

Build a trusted local information network around the platform. Fans, parents, coaches, photographers, historians, and other community members should eventually be able to contribute information while VarsityVue remains the verification and editorial layer.

The long-term advantage is not merely software. It is a network of reliable local contributors feeding structured information into VarsityVue.

### 3. Member Ecosystem

Basic scores, schedules, school hubs, and coverage should remain useful without an account. Membership should be earned by offering features people want rather than by putting the core product behind a login.

A single VarsityVue identity should eventually support Pick 'Ems, followed schools, notification preferences, score submissions, contributor reputation, verified roles, Legacy contributions, rewards, and other participation features.

### 4. Living Legacy

Legacy is a living digital history project, not a static trophy case. Current VarsityVue data should become tomorrow's historical archive automatically.

Scores and Pick 'Ems create frequency. Coverage creates attention. School hubs create utility. Legacy creates permanence. Community data creates scale.

The historical database should compound every season until a competitor is not simply competing with a website, but with years of structured regional sports history and a community that helps maintain it.

---

# Product Roadmap

## Authoritative 2026 Execution Plan

This section supersedes older phase sequencing wherever a conflict exists. VarsityVue is no longer deciding whether to build Follow, notifications, Pick 'Em, Score Scout, or contributor tooling. Their production foundations exist. The immediate job is to operate them reliably, complete the school identity layer around them, measure whether they create repeat users, and prepare the next growth systems without exposing unfinished prize or push features.

### Production State

Live production foundations include:

- public scores, schedules, Game Center, school hubs, district pages, standings, coverage, broadcast links, and responsive mobile navigation;
- member accounts, email confirmation, suspension enforcement, role-based administration, Turnstile protection, password recovery, and secure member management;
- school follows, contextual signed-out follow conversion, member notification preferences, verified-final email delivery, Pick 'Em reminder email delivery, unsubscribe controls, retries, and audit history;
- weekly Pick 'Em selection, per-game locking, saved/editable pick states, automatic grading from verified finals, member history, and season standings;
- conversion attribution by source, campaign, signup intent, school, first-value activation, Pick 'Em participation, complete slate, and notification opt-in;
- moderated score reporting, moderator trusted submission, canonical game-state propagation, score review history, and statistics completeness states;
- Score Scout missing-final queue, scheduled discovery foundation, evidence confidence, moderator review, and verified-result publication path; and
- contributor recruitment, applications, school assignments, and role progression foundations.

This inventory is not a declaration that every system is mature. It identifies what should now be improved and operated rather than rebuilt.

### Week 5 Launch Gate

Work required before promoting Week 5 heavily:

1. Keep the live Pick 'Em slate stable: saved picks must remain clear, editable until kickoff, individually locked, auditable, and automatically graded only from verified finals.
2. Complete the identity layer for all 18 Week 5 Pick 'Em schools. All 18 have structured school records. Eight of the nine previously missing official program logos are integrated; Post still needs a transparent production asset.
3. Verify each Week 5 game time, venue where available, school identity, and final-score ingestion path before the slate is promoted.
4. Confirm the conversion dashboard can distinguish acquisition, registration, activation, school attribution, Pick 'Em participation, and notification opt-in without changing user consent.
5. Preserve a clean no-prize public experience until contest rules, eligibility, abuse controls, funding, and sponsor commitments are complete.

### Next Three Development Steps

1. **Week 5 school identity completion:** source, document, optimize, and integrate the nine missing official program logos; verify colors, mascots, official athletics links, stadium information, and broadcast links where available.
2. **Retention measurement:** measure complete-slate rate, week-over-week Pick 'Em return, post-grading leaderboard return, follow activation, and notification opt-in. Raw registrations without return behavior are not a sufficient success metric.
3. **PWA installation foundation:** add restrained, platform-aware Home Screen education for engaged members. Measure installation intent before building the first web-push subscription and device-management release.

### Background-Only Build Track — Sponsored Pick 'Em

Prize readiness may be developed behind a disabled feature flag, but no prize language, eligibility claim, or payout workflow should be public before sponsor funding and rule review are complete.

Background requirements:

- predicted Game of the Week score or another deterministic tie-breaker;
- sponsor, prize, eligibility-period, and official-rules configuration;
- one prize-eligible entry per verified mobile number while preserving ordinary non-prize participation;
- verification deadlines before the first relevant kickoff;
- CAPTCHA, signup throttling, duplicate-account signals, and manual fraud review without automatically penalizing households on shared networks;
- minimum age, geographic eligibility, identity confirmation, claim deadline, tax responsibility, and winner-publicity terms;
- auditable winner calculation, tie resolution, disqualification, claim, and payout history; and
- an immediate off switch that does not affect ordinary Pick 'Em records or standings.

The preferred first test is a sponsor-funded, free-to-enter weekly prize of modest value. Prize traffic should be evaluated by retained members, not registrations alone.

### Web Push Sequence

VarsityVue does not need a native application to send phone push notifications. Standards-based web push can build on the existing PWA, but iPhone and iPad users must first add VarsityVue to the Home Screen and grant permission through a direct interaction.

Sequence web push as follows:

1. measure and improve Home Screen installation education;
2. add member-owned device subscriptions, revocation, and notification-channel preferences;
3. pilot verified-final push for followed schools;
4. add kickoff and Pick 'Em lock reminders after opt-in behavior is understood; and
5. consider selective live alerts only after live-score timeliness and correction safeguards are proven.

Do not notify on every score change. Push must be useful enough to retain permission and reliable enough to protect trust.

### Intentionally Deferred

- Native iOS or Android applications until PWA installation and push adoption demonstrate demand.
- Public cash-prize promotion until a sponsor is contracted, funding is committed, rules are reviewed, and anti-abuse controls are production-ready.
- Automatic publication of discovered finals without moderator review until Score Scout accuracy has been measured across meaningful volume.
- Indiscriminate statewide school expansion. Complete connected districts and Pick 'Em identities first.
- Full historical research at the expense of current-season reliability; preserve 2026 data for Legacy and deepen the archive primarily in the offseason.
- Generic display-ad clutter or premature commerce that weakens the core product.

### Cost and Operating Constraints

- Email remains the broadest notification channel because it requires no installation. Web push adds storage, service-worker, subscription, and delivery operations but does not require a native app or Apple Developer membership.
- Prize eligibility likely adds SMS verification cost, fraud review, winner administration, and legal/rules review. These costs must be included in sponsor pricing rather than absorbed invisibly.
- Every additional fully covered school creates recurring schedule, score, broadcast, identity, and contributor work. Expansion must improve a connected district or slate rather than create isolated maintenance.

## CURRENT FOUNDATION — Trust & Reliability

VarsityVue's soft launch establishes the operating foundation: accounts, roles, moderated score submissions, verified canonical game state, audit history, public scoreboards, school and district hubs, and reusable game surfaces. The current priority is making those systems consistently trustworthy before pushing harder on acquisition.

### Launch-Readiness Audits

- Finish the verified game-state launch-readiness audit already underway across public displays and public interactions.
- Complete a systematic statistics reconciliation audit across every featured program with verified statistics on file.
- Preserve the distinction between a verified final score and verified detailed statistics.
- Preserve source/provenance, verification state, and correction history wherever practical.
- Never treat missing statistics as zero production.
- Continue using clear states such as verified, partial, pending, and unavailable. Rankings and leaderboards must describe the verified data actually on file rather than imply universal coverage.

Statistics remain structurally difficult: programs submit inconsistently, selective reporting can distort comparisons, and source material can contain errors. Reliability language and provenance are product requirements, not footnotes.

### Automated Missing-Final Discovery — VarsityVue Score Scout

The scheduled queue, evidence model, confidence scoring, discovery runner, moderator review, and canonical publication path are established. The next objective is controlled production operation: run Score Scout after a reasonable post-kickoff grace period on Friday night and again Saturday morning, measure source accuracy, and reduce manual score hunting without weakening verification.

For every tracked game that still lacks a verified final, Score Scout should:

- search only approved public sources, such as official school or athletic-department posts, coach or trusted-contributor submissions, local media and radio reports, UIL or licensed data feeds when available, and other specifically approved providers;
- match each discovered result to the canonical VarsityVue game rather than creating duplicate or loosely identified matchups;
- retain the source URL, source name, retrieval time, reported teams and score, and the evidence used to make the match;
- compare multiple sources when available and identify agreement, uncertainty, or conflict;
- assign a clear confidence state such as official-source match, corroborated, single secondary source, conflicting sources, or no credible result found;
- compile the resulting intelligence into a dedicated moderator review queue for efficient batch review;
- let a moderator approve, correct, reject, or defer a candidate while preserving the review decision and source provenance; and
- send an approved final through the existing canonical verification pipeline so the scoreboard, Game Center, records, standings, Pick 'Em grading, notifications, season archive, and future Legacy data update from one decision.

Initial releases must remain moderator-gated. Finding a score online is not equivalent to verifying it. Automatic publication may be considered later only for narrowly defined high-confidence cases—such as an official source or multiple independent approved sources agreeing—after production accuracy has been measured and conflict safeguards have been proven.

Score Scout should reduce Saturday-morning score hunting and allow VarsityVue to expand coverage without owner workload growing linearly.

---

## LIVE FOUNDATION / NEXT CHANNEL — Follow + Notifications

### Follow Schools

- Members can follow one or more schools.
- Make **Follow School** prominent across school hubs and relevant game surfaces.
- Following becomes the foundation of personalization rather than a cosmetic bookmark.
- Preserve useful public scores, schedules, coverage, school hubs, and game pages without requiring an account.

### Notification Preferences

Build explicit opt-in preferences for meaningful events involving followed schools:

- kickoff reminders;
- live or important score updates where appropriate;
- final scores;
- new VarsityVue coverage;
- selected program updates.

Verified information should trigger downstream notifications automatically rather than requiring duplicate publishing. One approved update should be reusable by the scoreboard, Game Center, records, standings, notifications, and future historical systems.

Optimize the conversion path:

**Visitor → Useful school/game content → Follow → Account → Notification → Return visit**

### Mobile Installation and Return Access

VarsityVue should increasingly feel like an app without requiring an App Store download. Build on the existing PWA foundation with platform-appropriate, well-timed home-screen education. Installation, follows, and notifications should reinforce one another without becoming intrusive.

Email was correctly used as the first broad notification channel because it works without installation and established consent, delivery, retry, unsubscribe, and audit infrastructure. The next channel is web push, sequenced behind installation education and device-subscription management. A native app is not a prerequisite.

### Viewer-to-Member Conversion

Treat conversion as a product system rather than assuming traffic will naturally create accounts. Public scores, schedules, Game Center pages, school hubs, broadcast links, and coverage should remain useful without registration, but each high-intent surface should offer a clear next benefit that requires identity.

Prioritize conversion moments such as:

- follow this school and receive its verified final score;
- save notification preferences for followed programs;
- make weekly Pick 'Em selections before kickoff;
- preserve season Pick 'Em points, rank, and history;
- contribute a score or correction with an accountable identity; and
- return to a personalized Friday-night experience centered on followed schools and active picks.

Use context-specific calls to action rather than generic account promotion. A visitor reading a final should be invited to follow that program or receive its next result. A visitor viewing a weekly matchup should be invited to make a pick. A returning Facebook visitor should immediately understand what membership adds beyond the public information already available.

Instrument the complete funnel by source and school where practical:

**Facebook / Search / Direct → Landing Surface → Follow or Pick Intent → Registration Started → Registration Completed → First Follow / Pick → Notification Opt-In → Friday-Night Return**

Track conversion rate by landing surface, school, acquisition source, and call-to-action placement. Also track registration completion, first-value activation, and subsequent Friday-night return. Do not increase registration friction or hide basic public information merely to inflate signup totals.

---

## NEXT — Growth Phase 2: Friday Night Experience

Treat Friday night as a distinct, high-intent product experience rather than an ordinary site visit.

- Prioritize **Live**, **Finals**, **Tonight**, and followed schools.
- Make the mobile scoreboard exceptionally fast and easy to scan.
- Expand **Watch Now** and **Listen Now** discovery.
- Make Game Center, broadcast links, and verified scores easy to reach from one place.
- Store broadcast information once and inherit it where appropriate instead of recreating links manually.
- Consider a personalized Friday-night view for signed-in members without weakening the public scoreboard.

The product should reduce the distance between a fan's question and a useful answer: What is happening, what just finished, where can I follow it, and what matters to my schools?

---

## NEXT — Growth Phase 3: Contributor Acquisition

- Recruit trusted local contributors program-by-program.
- Build toward a network that can supply scores, roster information, broadcast links, corrections, and eventually other verified information.
- Preserve moderation, audit history, and role-based permissions.
- Let contributor reputation compound over time and remain reusable across VarsityVue rather than creating isolated identity systems.
- Consider reduced moderation or defined direct-publishing privileges only after contributors establish accuracy within clear safeguards.

A member may progress naturally through roles such as:

**Visitor → Member → Follower → Contributor → Trusted Contributor**

The strategic loop is:

**More contributors → Better/faster information → More useful VarsityVue → More members → Easier contributor recruitment**

---

## 2026 TRACTION TARGET

**Reach 500 registered VarsityVue members by the end of the 2026 football season, while demonstrating meaningful follow/notification adoption and repeat Friday-night engagement.**

This is a traction milestone, not a vanity total. Its purpose is to establish a measurable local audience that can support local sponsorship sales for the 2027 football season.

Track:

- registered-member growth;
- school follows per member and by program;
- notification opt-ins and preference mix;
- Friday-night active usage;
- Friday-night returning usage and retention;
- contributor coverage across tracked programs.

Do not optimize solely for raw pageviews. A smaller identifiable audience that follows schools, opts into useful updates, and returns on Friday night is more commercially meaningful than undifferentiated traffic.

---

## 2027 MONETIZATION — Local Sponsorships

Use demonstrated 2026 audience traction to approach local businesses for the 2027 season.

Potential inventory includes:

- presenting sponsorship of the Friday Night Scoreboard;
- Game of the Week;
- school hubs;
- district coverage;
- Watch & Listen;
- other tasteful, contextually valuable placements.

Prefer valuable local sponsorships over cluttering the product with low-value generic display advertising. Sponsorship must never compromise editorial or statistical independence.

---

## EXPANSION STRATEGY

Expand district/geography-first rather than adding random isolated schools.

Favor additions that improve existing schedules, matchups, standings, rivalries, contributor coverage, and scoreboard usefulness simultaneously. Deep local usefulness should precede indiscriminate statewide breadth.

---

## LIVE GROWTH PRODUCT — VarsityVue Pick 'Ems

Pick 'Em is live as the clearest near-term reason for a casual viewer to create an account and return every week. The foundation now requires operational hardening, retention measurement, school identity completion, and disciplined promotion rather than another ground-up build.

Operate a weekly Pick 'Em experience centered on roughly 10 selected games.

Live core requirements that must remain protected:

- VarsityVue account required to participate.
- Picks lock at the appropriate game kickoff.
- Results grade automatically from verified game results.
- Correct picks and/or season points persist across the season.
- A live season leaderboard prominently shows approximately the top 5–10 pickers.
- Users can view their own record/history.
- A completed registration should return the user to the picks they intended to make rather than losing their progress or context.
- Weekly matchup, scoreboard, school-hub, coverage, and Facebook promotion should route visitors directly into the relevant Pick 'Em slate.
- Pick reminders should be useful and opt-in, with clear lock times and no notification spam.
- Weekly results and leaderboard movement should create shareable reasons to return after games finish.
- The system should be designed so points can have additional utility later.

Near-term additions are retention measurement, school identity completeness, and a deterministic tie-breaker that can support a future sponsored prize. Prize eligibility, phone verification, fraud review, and payout administration remain background-only until separately approved for launch.

Pick 'Em should create a recurring weekly habit, strengthen member identity, and feed the broader rewards and data flywheel. Near-term decisions should now be judged by whether they improve slate completion, grading trust, weekly return, or sustainable acquisition.

Measure:

- visitors who open a weekly Pick 'Em slate;
- registration starts and completions originating from Pick 'Em;
- first-time participants who submit a complete slate;
- weekly active pickers and week-over-week retention;
- picks submitted before lock and successfully graded from verified finals;
- leaderboard views and return visits after grading; and
- the percentage of Pick 'Em members who also follow a school or enable notifications.

---

## PARALLEL MOAT — Start Accumulating Legacy Now

Do not postpone Legacy until every current-season feature is complete, but also do not derail the soft-launched product by manually researching complete historical databases before reliability and near-term growth work are secure.

### 2026: Establish the Permanent Structure

Treat **2026 as the first season of the permanent VarsityVue historical database**.

Current schedules, results, rosters, verified statistics, standings, articles, photographs, and postseason information should be structured so they can roll into Legacy rather than disappearing when the next season begins.

Begin lightweight Legacy pages for priority/flagship schools with information such as:

- basic program history;
- championships;
- playoff history;
- important rivalries;
- traditions;
- notable players/coaches/moments;
- selected historical facts;
- an invitation to help build the archive.

### Help Build History

Create a moderated contribution path for historical material, including photos, record corrections, newspaper clippings, memorabilia, historical statistics, championship stories, rivalry information, and other useful records.

Nothing should become an open public wiki. Contributions should be reviewed and verified before becoming authoritative VarsityVue data.

### Offseason Legacy Push

Use the offseason—when Friday-night operational pressure falls—to expand historical depth substantially.

Priority datasets can include season-by-season records, playoff appearances, coaching eras, championships, rivalry histories, historical player records, old photographs, newspaper material, and other locally significant information.

### Long-Term Legacy Database

Over multiple seasons, expand toward searchable player histories, coaching eras, season records, playoff appearances, leaderboards, rivalry timelines, historical rankings, and interconnected school/player/coach history.

Every new VarsityVue season should become Legacy automatically while the community helps fill backward.

---

## LATER — Rewards, Commerce, and Deeper Engagement

### VarsityVue Rewards

Design Pick 'Em scoring/history so points can eventually support a broader rewards program without requiring a destructive migration.

Potential uses include recognition, promotions, contests, contributor rewards, and merchandise-related redemption. Exact economics and rules should be determined before launch of any redemption program.

### VarsityVue Merchandise Store

Eventually create a VarsityVue merchandise storefront once the audience and brand justify it.

Long-term, members may be able to use eligible Pick 'Em/reward points toward merchandise or promotions. Commerce should remain downstream of audience usefulness and community engagement rather than becoming an early distraction.

### Richer Personalization

As membership grows, consider personalized Friday-night experiences based on followed schools, Pick 'Em selections, geographic coverage interests, and notification preferences while preserving a strong public experience for non-members.

---

# The VarsityVue Data Flywheel

The platform should increasingly operate as one connected system:

**Schedule → Game → Community Updates → Verification → Scoreboard → School Record / Standings → Pick 'Em Grading → Notifications → Season Archive → Legacy**

Likewise:

**Visitor → Useful Content → Membership → Follows / Notifications / Pick 'Ems → Contribution → Reputation → Trusted Contributor → Better Data → More Useful VarsityVue**

This is the compounding loop the product should protect.

# The Moat

VarsityVue's moat should not depend on one feature.

The defensible combination is:

1. **Structured local data** that becomes more complete every season.
2. **Living Legacy** that makes today's information permanently useful.
3. **A trusted community contributor network** that competitors cannot create overnight.
4. **Member identity and recurring participation** through Pick 'Ems, follows, notifications, and contribution.
5. **Original local coverage and media** that accumulates into a valuable archive.
6. **Local search/SEO authority** created by permanent school, game, player, coach, rivalry, season, and historical pages.
7. **Automation** that lets the platform cover more schools without owner workload growing linearly.

# Development Decision Filter

Before substantial work, ask:

1. Does this make VarsityVue more useful to fans?
2. Does it reduce recurring manual work or prevent future duplication?
3. Does it create structured data that can be reused elsewhere?
4. Does it increase participation, retention, or the trusted contributor network?
5. Does it strengthen the long-term historical/data moat?

Work that meaningfully advances those goals should generally outrank microscopic visual polish unless the polish addresses a genuine usability, trust, accessibility, performance, or deployment problem.

# Non-Negotiables

- Basic public information should not require an account.
- Never invent missing scores or statistics.
- Missing statistics are not zero statistics.
- Preserve the distinction between final-score verification and detailed-stat verification.
- Community contributions require appropriate verification and accountability.
- Avoid uncontrolled public/wiki-style editing of authoritative information.
- Build one identity/reputation system that can serve multiple participation features.
- Preserve source/provenance and correction history as the platform evolves.
- Build current-season data to survive into Legacy.
- Prefer entering verified information once and propagating it automatically.
- Protect owner time: VarsityVue should become easier—not harder—to operate as coverage expands.

# Immediate Development Direction

The immediate sequence is now:

1. Complete Week 5 school identity and logo readiness for the active Pick 'Em slate.
2. Verify the Week 5 slate, locking, grading, and final-score operating path before promotion.
3. Measure complete-slate conversion and week-over-week member retention instead of continuing to add signup instrumentation indefinitely.
4. Add restrained PWA installation education and measure adoption.
5. Build verified-final web push as the first push pilot after device subscriptions and explicit channel preferences are ready.
6. Prepare sponsored Pick 'Em tie-breaker, eligibility, phone verification, fraud review, official rules, and payout auditability behind a disabled feature flag.
7. Improve the Friday-night scoreboard and broadcast experience while expanding connected district coverage.
8. Operate Score Scout and contributor workflows to prevent coverage growth from becoming linear owner workload.
9. Pursue the 500-member target using retained and activated members as the commercially meaningful measure.
10. Use measured 2026 traction to prepare 2027 local sponsorship sales.

The default next task is Step 1. Do not resume open-ended feature expansion merely because another feature is technically possible.

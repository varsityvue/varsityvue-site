# VarsityVue Product Roadmap

_Last updated: September 16, 2026_

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

## CURRENT — Trust & Reliability

VarsityVue's soft launch establishes the operating foundation: accounts, roles, moderated score submissions, verified canonical game state, audit history, public scoreboards, school and district hubs, and reusable game surfaces. The current priority is making those systems consistently trustworthy before pushing harder on acquisition.

### Launch-Readiness Audits

- Finish the verified game-state launch-readiness audit already underway across public displays and public interactions.
- Complete a systematic statistics reconciliation audit across every featured program with verified statistics on file.
- Preserve the distinction between a verified final score and verified detailed statistics.
- Preserve source/provenance, verification state, and correction history wherever practical.
- Never treat missing statistics as zero production.
- Continue using clear states such as verified, partial, pending, and unavailable. Rankings and leaderboards must describe the verified data actually on file rather than imply universal coverage.

Statistics remain structurally difficult: programs submit inconsistently, selective reporting can distort comparisons, and source material can contain errors. Reliability language and provenance are product requirements, not footnotes.

---

## NEXT — Growth Phase 1: Follow + Notifications

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

## FOLLOWING THE IMMEDIATE GROWTH WORK — VarsityVue Pick 'Ems

Pick 'Em remains an important recurring-engagement feature, but it follows the immediate Follow/Notifications and Friday-night experience work rather than displacing them.

Build a weekly Pick 'Em experience centered on roughly 10 selected games.

Core requirements:

- VarsityVue account required to participate.
- Picks lock at the appropriate game kickoff.
- Results grade automatically from verified game results.
- Correct picks and/or season points persist across the season.
- A live season leaderboard prominently shows approximately the top 5–10 pickers.
- Users can view their own record/history.
- The system should be designed so points can have additional utility later.

Pick 'Em should create a recurring weekly habit, strengthen member identity, and feed the broader rewards and data flywheel. Moving it behind the immediate growth phases is sequencing, not abandonment.

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

The immediate sequence is:

1. Finish the current reliability audits.
2. Execute Follow + Notifications.
3. Improve the Friday-night scoreboard and broadcast experience.
4. Build the contributor network.
5. Pursue the 500-member season-end traction target.
6. Use that traction to prepare 2027 local sponsorship sales.

Pick 'Em remains the next major recurring-engagement feature after the immediate Follow/Notifications and Friday-night work. Legacy should continue accumulating in parallel as the long-term compounding moat and a major offseason opportunity. Neither should distract from reliability, measurable audience growth, or the local contributor network required to make VarsityVue more useful every week.

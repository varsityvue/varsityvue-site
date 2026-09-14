# VarsityVue Product Roadmap

_Last updated: September 13, 2026_

This document is the permanent product direction for VarsityVue. It exists so short-term development work does not obscure the larger goal.

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

A single VarsityVue identity should eventually support Pick 'Ems, favorite schools, notification preferences, score submissions, contributor reputation, verified roles, Legacy contributions, rewards, and other participation features.

### 4. Living Legacy

Legacy is a living digital history project, not a static trophy case. Current VarsityVue data should become tomorrow's historical archive automatically.

Scores and Pick 'Ems create frequency. Coverage creates attention. School hubs create utility. Legacy creates permanence. Community data creates scale.

The historical database should compound every season until a competitor is not simply competing with a website, but with years of structured regional sports history and a community that helps maintain it.

---

# Product Roadmap

## NOW — Foundation for a Self-Operating VarsityVue

### Unified Backend and Data Model

Build the persistent backend required for participation features. Before choosing or implementing database/auth technology, audit the current repository and deployment architecture.

The data model should be designed around existing game IDs and reusable entities. It should support users, permissions, submissions, moderation, audit history, Pick 'Ems, follows, notifications, contributor reputation, and future Legacy relationships without requiring separate identity systems later.

### Community Game-Night Score Submission

Reduce the need to manually hunt scores every Friday night.

Initial workflow:

1. A member selects an existing game.
2. The member submits a score update, game status/quarter, and timestamped information.
3. The submission enters a moderation/verification workflow.
4. VarsityVue or an authorized reviewer approves the update before it becomes official.
5. The system retains an audit trail rather than silently overwriting prior information.

The audit trail should preserve the submitting user, game, submitted score, game state, timestamp, prior value, moderation status, reviewer/verification action, and correction history as appropriate.

A **verified final score** and **verified detailed statistics** remain separate concepts. A game may have a trusted final while its individual statistics are incomplete or unavailable.

### Trusted and Verified Scorekeepers

Accurate contributors should be able to earn trust over time. Eventually, verified scorekeepers may submit with reduced moderation or publish eligible updates directly within defined safeguards.

Contributor reputation should be reusable across VarsityVue rather than creating an isolated scorekeeper identity system.

### VarsityVue Pick 'Ems

Create a weekly Pick 'Em experience centered on roughly 10 selected games.

Core requirements:

- VarsityVue account required to participate.
- Picks lock at the appropriate game kickoff.
- Results grade automatically from verified game results.
- Correct picks and/or season points persist across the season.
- A live season leaderboard prominently shows approximately the top 5–10 pickers.
- Users can view their own record/history.
- The system should be designed so points can have additional utility later.

Pick 'Ems should create a recurring weekly habit and provide the first strong reason for casual visitors to become VarsityVue members.

### Watch Now / Listen Now

Continue attaching known broadcast sources to games and schools. Surface **Watch Now** and **Listen Now** actions on relevant game cards and Game Center pages when a reliable stream or radio source is available.

Broadcast data should be stored once and inherited where appropriate rather than manually recreated on individual pages.

### Statistics Reliability and Provenance

VarsityVue cannot assume statistics are complete simply because a season is underway or because a source submitted data.

Known problems include:

- Some coaches/programs do not submit statistics consistently.
- Some submit only after favorable performances.
- Submitted statistics can contain errors or internal discrepancies.
- Missing statistics must never be interpreted as zero production.

Continue using clear states such as verified, partial, pending, and unavailable. Rankings and leaderboards must explain that they reflect verified statistics on file rather than pretending to represent every player or program.

As the backend develops, statistics should retain source/provenance, verification state, and correction history wherever practical. Corrections should not require losing the audit trail.

---

## NEXT — Turn Visitors Into Members and Followers

### Favorite / Follow Schools

Allow members to follow one or more schools. Following should become the foundation for a personalized VarsityVue experience rather than a cosmetic bookmark.

Future uses include kickoff reminders, score updates, finals, new coverage, and other selected program updates.

### Push Notifications

Build opt-in notification preferences around followed schools and meaningful events.

Potential notification categories include:

- kickoff reminders;
- important live score updates;
- final scores;
- new VarsityVue coverage;
- selected program updates.

A verified score update should eventually be capable of flowing through the scoreboard and automatically triggering appropriate notifications without a second manual publishing workflow.

### Add VarsityVue to Home Screen / PWA Education

VarsityVue should increasingly feel like an app without requiring an App Store download.

The site already has PWA foundations. Add a clear mobile experience showing users how to add VarsityVue to their home screen, including platform-appropriate instructions and a well-timed prompt rather than an intrusive interruption.

Home-screen installation and notifications should reinforce each other: install VarsityVue, follow your schools, and receive the updates you choose.

### Member Profiles and Contributor Reputation

Develop the member identity beyond login credentials.

A member may progress naturally through roles such as:

**Visitor → Member → Picker → Follower → Contributor → Trusted Contributor**

Profiles/reputation may eventually reflect accurate score contributions, historical contributions, photography/media contributions, and other trusted participation. Roles and permissions should remain controlled by VarsityVue rather than creating open wiki-style editing.

---

## PARALLEL MOAT — Start Accumulating Legacy Now

Do not postpone Legacy until every current-season feature is complete, but also do not derail the current product by manually researching complete historical databases before launch.

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

**Visitor → Useful Content → Membership → Pick 'Ems / Follows → Contribution → Reputation → Trusted Contributor → Better Data → More Useful VarsityVue**

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
- Preserve source/provenance and correction history as the backend matures.
- Build current-season data to survive into Legacy.
- Prefer entering verified information once and propagating it automatically.
- Protect owner time: VarsityVue should become easier—not harder—to operate as coverage expands.

# Immediate Development Direction

The next major engineering phase should move away from generic visual plumbing and toward the **backend foundation for participation**.

Before selecting technology, audit the current repository for existing database, authentication, API-route, form, environment, and deployment capabilities. Then design the smallest durable foundation that can support both **community score submissions** and **Pick 'Ems**, with future hooks for follows, notifications, reputation, rewards, and Legacy provenance.

Legacy should begin accumulating in parallel, but the initial goal is durable structure and contribution pathways—not a complete century of manually researched history before the core participation system exists.

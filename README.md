# VarsityVue

VarsityVue is a lean Texas high school sports pilot focused on useful school hubs, verified schedules, scores, statistics, and local coverage.

## 2026 operating model

The 2026 site is intentionally operated as a focused pilot. The goal is to build audience interest, school relationships, reliable data workflows, and product usage signals ahead of a broader 2027 push.

## Data workflow

Program data is kept in source-controlled files under `data/` and exposed through shared helpers under `lib/`. Verified coaching-staff or school-provided data should be preferred over inferred or placeholder information.

### Weekly update flow

1. Receive or collect verified schedule, result, and stat information.
2. Update the relevant school-specific data file.
3. Verify school hub, scoreboard, game center, and stat-leader output.
4. Commit the change to `main` and confirm the production deployment succeeds.

## Recovery

Git history is the recovery source for site code and data. If a bad update reaches production, identify the last known-good commit, compare the affected files, and revert or restore only the necessary changes. Avoid rewriting history on `main` unless there is no safer option.

## Current pilot

Featured programs are maintained as `pilot` schools in the shared school data layer. Santo joined the pilot in September 2026 with a dedicated school profile, 2026 schedule, verified results, quarter scoring, and weekly stat pipeline.

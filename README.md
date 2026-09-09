# VarsityVue

VarsityVue is a lean Texas high school sports pilot focused on useful school hubs, verified schedules, scores, statistics, and local coverage.

## 2026 operating model

The 2026 site is intentionally operated as a focused pilot. The goal is to build audience interest, school relationships, reliable data workflows, and product usage signals ahead of a broader 2027 push.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Before pushing a change, run:

```bash
npm run lint
npm run build
```

## Data workflow

Program data is kept in source-controlled files under `data/` and exposed through shared helpers under `lib/`. Verified coaching-staff or school-provided data should be preferred over inferred or placeholder information.

Do not use a missing statistic as zero unless the source actually reports zero. Unknown or unavailable data should remain absent or display the site's missing-data state.

### Weekly update flow

1. Receive or collect verified schedule, result, and stat information.
2. Update the relevant school-specific data file and any supporting shared files under `lib/`.
3. Confirm game status, week, kickoff, opponent, score, and statistical totals before publishing.
4. Verify the affected school hub, scoreboard/game page, standings, and Stats page for consistency.
5. Run `npm run lint` and `npm run build`.
6. Commit with a specific message describing the data or content change and push to `main`.
7. Confirm the production deployment succeeds, then smoke-test the homepage and at least one affected route on `https://varsityvue.com`.

## Recovery

Git history is the recovery source for site code and source-controlled football data. If a bad update reaches production, identify the last known-good commit, compare the affected files, and revert or restore only the necessary changes. Avoid rewriting history on `main` unless there is no safer option.

Form submissions are handled outside the repository through Formspree and are therefore not recovered through Git history.

## Deployment

The production site is deployed from this repository to Vercel. The canonical production domain is `https://varsityvue.com`.

## Current pilot

Featured programs are maintained as `pilot` schools in the shared school data layer. Santo joined the pilot in September 2026 with a dedicated school profile, 2026 schedule, verified results, and weekly stat pipeline.

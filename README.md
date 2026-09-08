# VarsityVue

VarsityVue is a Next.js site for Texas high school football scores, schedules, standings, player stats, school hubs, and local coverage.

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

## 2026 data update workflow

Most public football data is source-controlled in the repository rather than entered through a production CMS. That keeps the pilot simple and makes every change recoverable through Git history.

For weekly updates:

1. Update the relevant source data in `data/` and any supporting files in `lib/`.
2. Confirm game status, week, kickoff, opponent, score, and statistical totals before publishing.
3. Check the affected school hub, scoreboard/game page, standings, and Stats page for consistency.
4. Run `npm run lint` and `npm run build`.
5. Commit with a specific message describing the data or content change, then deploy from `main`.
6. After deployment, smoke-test the homepage and at least one affected route on `https://varsityvue.com`.

Do not use a missing statistic as zero unless the source actually reports zero. Unknown or unavailable data should remain absent or display the site's missing-data state.

## Recovery

GitHub is the recovery source for code and source-controlled football data. If a bad update reaches production:

1. Identify the last known-good commit.
2. Revert the bad commit or restore the affected file from that commit.
3. Run lint/build again.
4. Push the recovery commit to `main` and verify the production route after redeployment.

Form submissions are handled outside the repository through Formspree and are therefore not recovered through Git history.

## Deployment

The production site is deployed from this repository to Vercel. The canonical production domain is `https://varsityvue.com`.

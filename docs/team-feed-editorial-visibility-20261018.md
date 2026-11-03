# Team Feed editorial visibility repair — October 18, 2026

## Scope and baseline

Base main/production: 1a1cbc01a26fe7d81d89cd7a0500f5328fcc3035. Read-only refresh found one published De Leon–Hico post, 01cf1344-8bbb-4bc5-b576-d4ab429d8fe7, with primary de-leon, related hico, canonical game hico-at-de-leon-2026-week-8 and media c8c1e5e1-3b5d-49c7-ab12-f3702371a515. It was not changed.

Root cause: the public feed query treated secondary_school_id as editorial placement. The repair adds show_on_secondary_school, independent of school/game identity. New forms and DB inserts default primary-only; existing rows retain true. Administrator choices are validated server-side. Both previews and full feeds use the same database filter before ordering, lookahead limit, and cursor pagination. No separate school feed count exists. Eligibility, Game Center links, captions/credits, publication time and media processing remain unchanged.

## Schema and exact release order

Migration: supabase/migrations/20261018071630_team_feed_editorial_visibility.sql. Generated using Supabase CLI migration new. Add a NOT NULL boolean with constant default true, then change the default to false. No explicit UPDATE, trigger execution, record reassignment, or media mutation. Explicit column SELECT grants match the existing restricted public contract. Existing administrator/active-member RLS is retained; no new function, view or policy.

Production application is NOT authorized in this implementation session.

For a separately authorized release:

1. Refresh main, migration history, production post/media fingerprints and candidate gates.
2. Temporarily avoid editorial writes during the short rollout. Apply the additive migration first, then verify existing rows retain true and all existing content fields/media remain unchanged. Confirm anon/authenticated can select the new column.
3. Deploy the reviewed UI/query candidate. Old code remains compatible with the added column, but ignores the placement flag; do not reconcile visibility until the new deployment is serving. New omitted-column inserts during the gap default false but the old reader still displays both; avoiding writes removes this ambiguity.
4. Verify existing legacy post still appears for both schools and links to the same game. No automatic reconciliation is included.
5. Only after separate owner approval, open /internal/team-feed and locate post 01cf1344-8bbb-4bc5-b576-d4ab429d8fe7. Leave every school/game/caption/alt field unchanged. Select Primary school only and click Save edits. Do not unpublish, reupload or create another post. Confirm De Leon includes it and Hico excludes it, with identical media URL, timestamp and Game Center association.
6. To reverse that editorial choice, select Both associated schools and Save edits.

Code rollback may leave this additive column installed; legacy readers ignore it and restore both-school placement. Rolling back code after primary-only activation therefore re-exposes secondary placement. Restore the new reader rather than dropping the column or rebuilding media.

## Verification

- Ten targeted tests pass: image processing/EXIF stripping, existing relationship validation, visibility validation/injection rejection, actual Supabase-client URL construction retaining both OR filters, and isolated PostgreSQL migration/RLS/pagination coverage.
- PGlite executes the original repository table/RLS SQL and the new migration unchanged. It verifies old-row content/timestamps, false defaults, no-secondary inserts, mixed-visibility counts/cursors, actual anonymous/authenticated denial, authorized edit, and unchanged media records/association/caption/date.
- PGlite is not a hosted Supabase/PostgREST/storage end-to-end test. The role predicate is stubbed for the isolated fixture; current production active-account logic is unchanged. Server action authorization and media-preserving edit branches reviewed directly; no production write used for verification.
- Installed Next 16.4 documentation read: use server, forms, revalidatePath. Public feed eligibility and non-pilot presentation are unchanged.
- TypeScript noEmit, targeted ESLint, and production webpack build (including 67 prebuild tests) passed locally. Parent-run responsive/preview results are recorded in the consolidated release report. Do not interpret a mocked form browser fixture as authenticated publishing verification.

## Responsive and independent review

Parent-run browser tests of the actual TeamFeedPostForm at 375, 390, 768 and 1366 pixels found no document overflow and zero axe A/AA violations. New form defaults to primary; existing form initializes to both. Selecting primary preserves related hico and the canonical game. The 375-pixel screenshot was inspected. The fixture stubs the action; no authenticated submission was executed.

Independent reviewer found no blocking issue after code, migration, SQL policy and pagination review, with independent TypeScript, lint and focused tests passing. Hosted Supabase/PostgREST publishing remains distinct from these isolated tests.

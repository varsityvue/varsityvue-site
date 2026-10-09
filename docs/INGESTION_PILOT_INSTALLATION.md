# Persistent manual review: bounded pilot installation and operations

This is a proposed local readiness package. Nothing here authorizes production installation, configuration, migration, activation, publication, or deployment. The console stays default-disabled. Approval means accepted for interim manual export; no canonical sports-data sink is written. No AI, OCR, coach portal or Phase 2 exists.

## Explicit server configuration

`ENABLE_DATA_INGESTION` must be exactly `true`; absent/false/other values return 404 before ingestion backend access. It is independent of `ENABLE_INTERNAL_TOOLS`. Enabling either one does not enable the other. A private database control row also defaults `enabled=false` and closes direct RPC/Storage capabilities.

Activation requires all of these explicitly configured together, by a separately authorized operator:

| Variable | Required meaning |
|---|---|
| `INGESTION_BACKEND` | `local` or `hosted`; never inferred |
| `INGESTION_SUPABASE_URL` | Exact selected backend origin; loopback HTTP for local, a standard project `https://<project-ref>.supabase.co` origin for hosted |
| `INGESTION_SUPABASE_PUBLISHABLE_KEY` | Selected backend's publishable/anon key; must equal the explicitly configured shared account publishable key |
| `INGESTION_SERVICE_KEY` | Server-only secret/service-role key for the selected backend; never `NEXT_PUBLIC_`, printed, or exported |
| `INGESTION_ORIGIN` | One exact app origin, with protocol/host/port and no trailing slash, path, query, credentials or wildcard |
| `NEXT_PUBLIC_SUPABASE_URL` | Must explicitly match the selected backend; account/proxy/session clients cannot use their fallback |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Must explicitly match the selected publishable key |

Only the server-only runtime reads these variables. Hosted selection is implemented but has only pure configuration tests using synthetic URLs; no hosted backend was accessed. Custom Supabase domains/self-hosted remote URLs are intentionally unsupported. Local mode rejects Vercel execution and non-loopback endpoints. Key validity/project ownership and least-privilege secret handling require an authorized installation check; configuration shape validation does not prove a secret is correctly issued.

Every ingestion request checks the configured Host and any Origin/Fetch-Site. Mutations require the exact Origin, including uploads and **POST-only export**. Forwarded host headers cannot override this decision. GET export is unsupported (405) and cannot append events. Use the approved origin for the pilot; other deployment aliases and cross/same-site sibling origins are denied. No CORS allowlist, wildcard origin, permanent public source URL or shared public bucket is introduced.

Authentication remains the existing verified account session and active status check. Active admin/moderator review scope stays global exactly as in merged Phase 1; contributor/coach assignments grant no ingestion capability. Neither moderation approval nor pilot configuration grants canonical publication authority. Admin-only cleanup adds no moderator authority. Database and Storage repeat role/status/gate checks. Service credentials remain powerful trusted backend credentials; vault access, rotation, ownership and incident response are installation controls, not browser capabilities.

## Fixed small-pilot limits

- Inbox/history/operator queue: at most 20 entries per database page. Inbox uses `(created_at,id)` keyset cursors; history uses event IDs. Detail history returns metadata only, not repeated audit snapshots. Immutable original snapshots remain in the database. Creation retry uses a separate immutable creation request/input-hash lookup so old history pages do not break idempotency.
- Authenticated request admission: 60 write admissions and 300 read admissions per actor per database minute. Admission is a separate committed transaction before expensive server validation; invalid inputs consume it. Direct read RPCs also consume read admission. Nested application reads can consume multiple admissions. Direct service mutations additionally cap successful writes at 60/minute; exact immutable-event retries do not consume another successful-write slot.
- 100 new submissions per actor per database day; 2,000 submissions total. At most 200 ordinary revision-advancing operations, 32 lifetime source records and 2,000 events per submission. Audited evidence invalidation/cleanup can still advance a capped record; there is no silent deletion or last-write-wins recovery.
- Draft/mutation payload: 1 MiB; decision/cleanup reason: 2,000 characters. Original JSON/CSV imports: 256 KiB; manual pasted text: existing 30,000-character bound. Limits are server/database enforced.
- Private image original/preview: 5 MiB each; bounded multipart request: 6 MiB; only JPEG/PNG/WebP, actual decode/type matching, one image, at most ten million pixels. Preview is resized and strips metadata; original bytes remain private. No malware/antivirus/CDR scanning exists.
- Three active/reserved images per submission. Fifty charged image pairs globally, reserving each pair's worst-case 10 MiB: a 500 MiB file budget. Failed/deleted pairs still charge while physical object rows remain. Storage INSERT takes gate/reservation locks in the same order as mutation/disable, preventing quota release during an authorized INSERT. No upsert/replacement capability.
- 128 MiB total logical private staging row payload, including repeated immutable revision/source/event JSON. Transactional triggers charge inserts/updates/deletes atomically and roll back over-budget operations. This does not estimate PostgreSQL heap/index overhead, WAL, backups or actual object-store retention; the operator must budget these separately. Immutable history cannot be erased to reclaim this quota.

At the logical payload ceiling, further mutations and cleanup audit events can fail too. Disable and quiesce the pilot, preserve all records, and obtain a separately reviewed capacity/recovery decision; do not perform unaudited deletion to bypass the cap. Fixed caps deliberately fail closed; do not raise them through browser input or remove history to regain space. Future capacity changes need a reviewed package/owner decision. Anonymous request flooding and authenticated direct Storage egress still require platform/edge monitoring and any separately approved deployment controls; application admission is not a replacement for them.

## Manual retention and orphan recovery

No scheduler/sweeper is added. Reviewers can tombstone/delete evidence with an authoritative actor/time/reason using the existing revision/hash tokens. Typed work persists but validation/approval is invalidated. Source bodies, prior snapshots and events stay immutable; removing an object does not mean full privacy erasure or backup deletion.

The admin-only `/internal/data-ingestion/cleanup` queue lists failed/deleted image sources with physical objects, plus reservations older than one hour with objects. It is bounded and paginated. Open an abandoned reservation and cancel it with a recorded reason before physical cleanup; no timed automatic cancellation is performed. The cleanup form derives paths from the protected source row, records an immutable `cleanup_attempt`, removes only those original/preview objects, and records `cleanup_result`. Failed operations retain the attempt and tombstone and may be retried. Outcome retries use deterministic audit keys. Moderator/ordinary/coach/suspended accounts cannot operate the admin cleanup queue.

If object removal succeeded but the outcome audit failed, retain the operation ticket and attempt ID and reconcile it in a separately authorized operator session; do not fabricate success or erase the attempt. The queue intentionally lists physical leftovers; missing-outcome auditing requires history review. Existing reviewer deletion is already audited by its tombstone event; the new queue adds explicit before/after audit for administrator orphan retries. Unreferenced objects created outside this application's reservation path require a separately reviewed forensic procedure; no arbitrary object-name delete endpoint exists.

## Installation checklist — separate authorization required

1. Independently review exact package/hash and proposed migration. Verify current main and all intervening changes. Select the owner, cohort, exact app/backend origins and rollback contact. Accept or resolve malware scanning, mounted-form-only retry recovery, manual retention/erasure, platform abuse/egress controls and capacity/monitoring decisions.
2. Re-run the full isolated suite and decide production credentials/access controls without retrieving secrets into review artifacts. Plan backup/restore and record migration order: merged `20261007220833_persistent_manual_ingestion_review.sql`, then proposed `20261009014615_ingestion_pilot_readiness.sql`, after repository prerequisites. Neither migration is applied by the build or this task.
3. Obtain explicit installation approval for the concrete migration/grants/RLS/private bucket package. Keep `ENABLE_DATA_INGESTION` unset/false and database `private.ingestion_pilot_control.enabled=false`. Verify production canonical data, permissions and publication authority will be unchanged; review existing account/status/role and catalog prerequisites.
4. Only an authorized operator may apply that exact migration package to the selected production database. No reset, broad role changes, public bucket, canonical writes or automatic publisher. Verify private-table RLS/revokes, old mutation RPC revocation, service-only mutation/admission/cleanup grants, private Storage policies, gates default false, byte-accounting baseline and no public evidence URLs. Save an installation record without secrets.
5. With activation still disabled, verify deployment identity and public non-regression. Verify ingestion pages inaccessible without probing mutation/export endpoints. Installation does not authorize activation.

## Activation checklist — second explicit go/no-go

1. Approve the cohort, operational controls, exact configured origins/keys and private storage verification. Changes to Vercel/environment variables remain a separately authorized operator step; this package changes none.
2. Establish explicitly matched account/backend configuration with `ENABLE_DATA_INGESTION=false`. Do not enable `ENABLE_INTERNAL_TOOLS` to activate ingestion. Validate credentials and catalog prerequisites in an approved non-production/installation procedure.
3. Only after owner activation authorization, enable the private database pilot row and the dedicated server gate for the reviewed deployed package. This changes no roles/assignments/publication authority. Record actor/operator, ticket and authoritative time. Check auth/suspension denial and private preview with separately authorized controlled fixtures. An app gate without the database gate must fail closed.
4. Check bounded inbox/history, limits, stale edits, rejection/reopening, approval races, creation recovery, exact POST interim exports and private reads. Any production mutation tests require their own explicit fixture authorization. Confirm canonical fingerprints remain unchanged and monitor admission/byte/file quotas, missing audits and storage errors.

## Disable and recovery

1. With separate operating authority, set the dedicated server gate false/unset; this closes new application requests. Set the database row `enabled=false` to close direct RPC/Storage capabilities. No production command was executed here.
2. The database gate update waits for in-flight mutation/Storage INSERT gate locks. Already-returned data, completed requests and objects cannot be recalled. Drain/observe in-flight server tasks; file cleanup is a separate audited request, not a distributed atomic transaction. Do not rotate into a different backend, delete history or apply a destructive rollback while requests are active.
3. Record main/deployment identities, incident, errors, quota state and outstanding cleanup attempts. Preserve submissions/source snapshots/events. Investigate using the agreed authorized procedure; do not automatically reopen rejected records or overwrite reviewed revisions.
4. Reproduce the failure locally/staging, review any corrective package separately and verify gates/roles/private Storage/canonical non-regression. Resume only with owner go/no-go and the same two-gate activation sequence. Cleanup while disabled requires separately authorized operator investigation; the web cleanup console cannot bypass either gate.

## Reproduce locally

Use only the existing generated disposable Supabase config. Keep environment/status keys in process memory and fixtures outside the package. After `supabase db reset --local --no-seed`, run sequentially:

```sh
node --import tsx --test lib/ingestion-foundation.test.ts lib/ingestion-persistent.test.ts lib/ingestion-pilot-config.test.ts
node --import tsx scripts/test-ingestion-local.mjs
node --import tsx scripts/test-ingestion-pilot-local.mjs
node scripts/test-ingestion-races.mjs
node scripts/serve-ingestion-local.mjs
# In another local terminal, after the server is ready:
node --import tsx scripts/test-ingestion-browser.mjs
node --import tsx scripts/test-ingestion-pilot-browser.mjs
```

Tests seed only synthetic accounts, explicitly enable the disposable database gate, and use loopback guards before credentials. Browser requests are restricted to loopback. Independent browser scenarios reset synthetic admission counters via the test operator; explicit quota tests prove enforcement without this reset. Stop the server before reset/build or launching another dev server in this checkout. `serve-ingestion-local.mjs --disabled` sets the ingestion gate false while the shared internal-tools flag is true, for independence tests; `--built` serves the locally built package. Never use these test runners against a hosted backend.

Storage model reference: [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control). Shared auth integration reference: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client). These references inform the implementation; verification here uses only disposable local services.

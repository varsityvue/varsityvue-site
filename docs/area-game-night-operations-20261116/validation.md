# Verification evidence

Base main: `a85ad9a118a8659463e74b16b95062c9bb5aacee` (PR #162 merged). Documentation-only packet; runtime behavior and canonical schedules/results were not changed.

## Read-only production checks

See `live-recheck.json` for the exact observation timestamp. Both production domains returned HTTP 200 with deployment `dpl_5JxVuvFYHnGAPT4rpvZEXV18URzq` in their response content. Vercel independently reported READY, target production, the same main SHA and both assigned domains. GitHub main and the tested base tree matched.

The primary public score snapshot matched all 288 canonical playoff records on participant school identities, both score slots and verification flags: 192 verified first-round finals, 96 unscored Area games, no unexpected playoff games. No full 680-route acceptance rerun was needed; that acceptance was already complete and this preparation did not change runtime code.

Read-only Supabase aggregates established all 96 canonical Area identities matched exactly; no Area score states or score submissions existed. Active school assignments were checked together with current account status and scorekeeper role, not just an active assignment flag. Six eligible assignments cover three Area games. Six active authorized admin/moderator accounts exist, but the audit did not establish any operator’s availability. No personal account IDs or contact data were saved.

## Isolated operational tests

46 existing tests passed:

```bash
node --import tsx --test lib/score-input.test.ts lib/assigned-scorekeeper.test.ts lib/assigned-scorekeeper-games.test.ts lib/scoring-operations.test.ts lib/resolve-game-score-state.test.ts lib/regional-round-readiness.test.ts lib/area-round-completion.test.ts lib/score-conflict.test.ts lib/playoff-bracket-advancement.test.ts
```

Four additional operational fixture tests passed:

```bash
node --experimental-test-module-mocks --import tsx --test docs/area-game-night-operations-20261116/isolated-operations.test.mts
```

The fixture runs the actual operational scoring action with mocked authentication, database transport and Next cache/navigation boundaries. Network fetch is denied. It verifies blank/partial final rejection and final confirmation before any RPC; explicit final-score forwarding once without retry; invalidation of Playoff Central, Game Center and both school schedules; the actual public-score loader and school schedule selector reading the synthetic published final; all 96 synthetic Area finals producing 48 confirmed readiness pairs without invented Regional Game Centers; a winner-reversing correction recalculating the pair and both school schedule views; stale-conflict handling with no retry/invalidation; and denial of the moderator action to a scorekeeper-only role.

These are synthetic fixtures, not production results. The database transport is mocked; this run does not claim a new full SQL authority/concurrency or authenticated live-browser test. The released PR #162 already passed its isolated database/concurrency/authenticated-browser CI workflows (43813631907, 43813631868, 43813631904). No test score was sent to production.

## Packet consistency

Validated 96 unique coverage rows, 16 per division, and 48 unique Regional rows, eight per division. Every Area game occurs exactly once among the 48 two-game dependency pairs; every matrix destination has exactly two Area sources. Verified three assigned-school games, one unresolved schedule, explicit proposed primary/backup labels, populated lookup sources and no fabricated Regional winners. The 95 scheduled rows all retain a venue/city and an explicit CST-offset kickoff from the canonical catalog.

TypeScript and targeted ESLint for the documentation generator/fixture passed. `git diff --check` passed. A new application build or preview is not warranted for this packet: no production application, dependency, database schema, permission, or logo file changed. A nonproduction documentation branch is prepared without a PR, merge or production deployment.

## Limits

Source endpoints were reviewed as future lookup candidates; their future final score coverage and independence cannot be verified before the games occur. Catalog school links are explicitly leads rather than independently authenticated endpoints. Staffing and school contributor availability remain unconfirmed. La Villa–Chilton kickoff and venue remain TBD. The authenticated admin readiness page was unavailable in the prior live session; this packet does not claim a new authenticated production UI verification.

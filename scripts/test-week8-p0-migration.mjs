import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
const baseline = JSON.parse(readFileSync(new URL("supabase/tests/week8_p0_baseline.json", root), "utf8"));
const migration = readFileSync(new URL("supabase/migrations/20261010013150_week8_p0_nonretryable_business_conflicts.sql", root), "utf8");
assert.equal(baseline.length, 11);
let sites = 0;
for (const f of baseline) {
  const oldSites = [...f.definition.matchAll(/errcode\s*=\s*'40001'/g)].length;
  sites += oldSites;
  let expected = f.definition.replace(/errcode\s*=\s*'40001'/g, "errcode = 'PT409'");
  if (f.signature === "public.apply_score_submission_review()") {
    expected = expected.replace("errcode = 'P0001', message = 'Game changed — review the current score.'", "errcode = 'PT409', message = 'Game changed — review the current score.'");
  }
  assert.ok(migration.includes(expected + ";"), "Complete definition differs beyond approved error code: " + f.signature);
  assert.ok(migration.includes(f.fingerprint), "Missing baseline drift guard: " + f.signature);
}
assert.equal(sites, 18);
assert.equal([...migration.matchAll(/errcode\s*=\s*'PT409'/g)].length, 19);
assert.doesNotMatch(migration, /\b(?:grant|revoke|drop\s+function|alter\s+table)\b/i);
for (const file of readdirSync(new URL("supabase/migrations/", root))) {
  if (file >= "20261010013150" && file.endsWith(".sql")) {
    assert.doesNotMatch(readFileSync(new URL("supabase/migrations/" + file, root), "utf8"), /raise\s+exception[\s\S]*?errcode\s*=\s*'40001'/i, "New deliberate retryable business error: " + file);
  }
}
console.log("PASS: 11 exact definitions, 18 business-conflict sites, 19 PT409 replacements; no permission/schema changes.");

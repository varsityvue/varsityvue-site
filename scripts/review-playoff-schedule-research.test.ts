import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import fs from "node:fs";
import { getBiDistrictReadiness } from "../lib/bidistrict-readiness";

const root = "docs/playoffs/research-20261110/";
const rows = [
  ...JSON.parse(fs.readFileSync(root + "class-2a.json", "utf8")),
  ...JSON.parse(fs.readFileSync(root + "class-3a-4a.json", "utf8")).candidates,
  ...JSON.parse(fs.readFileSync(root + "remaining-3a-4a.json", "utf8")).candidates,
];

test("research preserves unique authoritative positions and exact school names", () => {
  const inventory = getBiDistrictReadiness([]);
  assert.equal(rows.length, 192);
  const keys = new Set<string>();
  for (const row of rows) {
    const key = `${row.division}|${row.region}|${row.slot}`;
    assert.ok(!keys.has(key), key);
    keys.add(key);
    const expected = inventory.find((item) => item.division === row.division && item.region === row.region && item.slot === row.slot);
    assert.deepEqual(row.teams, expected?.teams, key);
    assert.equal(new URL(row.sourceUrl).protocol, "https:");
  }
});

test("offline review never approves publication and reconciles existing records", () => {
  const output = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/review-playoff-schedule-research.ts"], { encoding: "utf8" }));
  assert.equal(output.productionWrites, false);
  assert.equal(output.researched, 192);
  assert.equal(output.missingRecordsResearched, 185);
  assert.equal(output.unresearched.length, 0);
  assert.equal(output.readyForPublication, 0);
  assert.equal(output.identityAudit.teamReferences, 384);
  assert.equal(output.identityAudit.exactMatchedTeamReferences + output.identityAudit.unresolvedTeamReferences, 384);
  assert.equal(output.identityAudit.unresolved.reduce((sum: number, item: { bracketReferences: number }) => sum + item.bracketReferences, 0), output.identityAudit.unresolvedTeamReferences);
  // Substrings collide with established schools: Leon is not De Leon,
  // Plains is not Cross Plains, and Cooper is not Lubbock Cooper.
  for (const name of ["Leon", "Plains", "Cooper", "Ford", "Canyon"]) {
    const row = output.candidates.find((item: { bracket: { teams: string[] } }) => item.bracket.teams.includes(name));
    assert.equal(row.proposed.schoolSlugs[row.bracket.teams.indexOf(name)], null, name);
  }
  for (const row of output.candidates) {
    assert.equal(row.readyForPublication, false);
    assert.ok(row.publicationIssues.length > 0);
    if (row.existingGameId) {
      assert.equal(row.operation, "reconcile-existing-only");
      assert.equal(row.structuralValidationPassed, false);
    }
  }
});

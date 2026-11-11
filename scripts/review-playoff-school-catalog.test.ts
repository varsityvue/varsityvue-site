import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { districts } from "../data/districts";
import { getSchools } from "../lib/schools";
import type { School, District } from "../types/platform";

type Proposal = { sourceSchoolId: string; proposedRecord: School | null; proposedFields: { id: string; districtId: string; mascot: string | null; colors: unknown }; structurallyComplete: boolean; metadataIssues: string[]; readyForCatalogIntegration: boolean; readyForPublication: boolean };
type Output = { productionWrites: boolean; runtimeCatalogChanges: boolean; readyForPublication: number; schoolProposals: Proposal[]; districtProposals: { proposedRecord: District; readyForCatalogIntegration: boolean }[] };
type Fixture = { rows: { expectedSchoolId: string; publisherSchool?: { schoolId: string; color1: string; mascot: string }; sourceSchoolUrl: string }[] };
const root = "docs/playoffs/research-20261110/";
const script = path.resolve("scripts/review-playoff-school-catalog.ts");
const run = (cwd = process.cwd()): Output => JSON.parse(execFileSync(process.execPath, ["--import", path.resolve("node_modules/tsx/dist/loader.mjs"), script], {
  cwd, encoding: "utf8", stdio: "pipe", maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, TSX_TSCONFIG_PATH: path.resolve("tsconfig.json") },
}));
const output = run();
function withFixture(mutate: (data: Fixture) => void, check: (cwd: string) => void) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "vv-catalog-"));
  try {
    fs.mkdirSync(path.join(cwd, root), { recursive: true });
    for (const name of ["school-identity-review.json", "bracket-school-profile-links.json", "publisher-school-metadata.json", "primary-branding-checks.json"]) {
      const data = JSON.parse(fs.readFileSync(root + name, "utf8"));
      if (name === "publisher-school-metadata.json") mutate(data);
      fs.writeFileSync(path.join(cwd, root, name), JSON.stringify(data));
    }
    check(cwd);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
}

test("stages every missing school with unique noncolliding proposed identifiers", () => {
  assert.equal(output.schoolProposals.length, 342);
  const reserved = new Set(getSchools().flatMap((school) => [school.id, school.slug, ...(school.aliases ?? [])]));
  const ids = output.schoolProposals.map((item) => item.proposedFields.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) { assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/); assert.equal(reserved.has(id), false, id); }
});

test("every proposed school references an existing or staged district with matching membership", () => {
  const known = [...districts, ...output.districtProposals.map((item) => item.proposedRecord)];
  for (const item of output.schoolProposals) {
    const district = known.find((record) => record.id === item.proposedFields.districtId);
    assert.ok(district);
    if (item.proposedRecord) {
      assert.deepEqual(item.proposedRecord.classification, district.classification);
      assert.equal(item.proposedRecord.uilRegion, district.uilRegion);
    }
  }
});

test("metadata preparation never approves integration, publication or runtime catalog changes", () => {
  assert.equal(output.productionWrites, false);
  assert.equal(output.runtimeCatalogChanges, false);
  assert.equal(output.readyForPublication, 0);
  for (const item of output.schoolProposals) {
    assert.equal(item.readyForCatalogIntegration, false);
    assert.equal(item.readyForPublication, false);
    if (item.proposedRecord) { assert.equal(item.proposedRecord.status, "planned"); assert.deepEqual(item.proposedRecord.sports, ["football"]); }
  }
  for (const item of output.districtProposals) assert.equal(item.readyForCatalogIntegration, false);
});

test("rejects wrong-school redirects, duplicate reports and unsupported publisher URLs", () => {
  withFixture((data) => { data.rows[0].expectedSchoolId = "wrong-school"; }, (cwd) => assert.throws(() => run(cwd), /metadata school ID does not match bracket link/));
  withFixture((data) => { data.rows.push(data.rows[0]); }, (cwd) => assert.throws(() => run(cwd), /duplicate qualified metadata/));
  withFixture((data) => { data.rows[0].sourceSchoolUrl = "https://example.org/unreviewed"; }, (cwd) => assert.throws(() => run(cwd), /unreviewed metadata publisher URL/));
});

test("missing mascots and malformed colors block a complete record without inventing replacements", () => {
  withFixture((data) => { assert.ok(data.rows[0].publisherSchool); data.rows[0].publisherSchool.color1 = "unknown"; data.rows[0].publisherSchool.mascot = ""; }, (cwd) => {
    const item = run(cwd).schoolProposals[0];
    assert.equal(item.proposedRecord, null);
    assert.equal(item.structurallyComplete, false);
    assert.equal(item.proposedFields.mascot, null);
    assert.equal(item.proposedFields.colors, null);
    assert.ok(item.metadataIssues.includes("mascot missing"));
    assert.ok(item.metadataIssues.includes("valid primary and secondary color values required"));
  });
});

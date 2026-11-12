import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

type Identity = {
  bracketName: string; officialName: string; division: string; region: string;
  district: number; alignmentRegion: number; proposedSlug: string | null;
  existingCatalog: { slug: string } | null; catalogAction: string;
  readyForCatalogIntegration: boolean; readyForPublication: boolean;
};
type Review = { productionWrites: boolean; runtimeCatalogChanges: boolean; readyForPublication: number;
  summary: { games: number; teamReferences: number; distinctOfficialIdentities: number };
  games: { identities: Identity[] }[] };
const root = "docs/playoffs/research-20261110/";
const script = path.resolve("scripts/review-playoff-school-identities.ts");
const output: Review = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", script], { encoding: "utf8" }));
const identities = output.games.flatMap((game) => game.identities);
const find = (name: string, division: string, region: string) => identities.find((item) => item.bracketName === name && item.division === division && item.region === region)!;

test("covers every bracket reference with distinct qualified official identities", () => {
  assert.equal(output.summary.games, 192);
  assert.equal(output.summary.teamReferences, 384);
  assert.equal(output.summary.distinctOfficialIdentities, 384);
  assert.equal(identities.length, 384);
  for (const item of identities) assert.equal(Math.ceil(item.district / 4), item.alignmentRegion);
});

test("same short names remain separate by division and region", () => {
  assert.equal(find("Austin", "4A Division I", "Region I").officialName, "El Paso Austin");
  assert.equal(find("Austin", "4A Division I", "Region III").officialName, "H Austin");
  assert.equal(find("Bowie", "2A Division II", "Region III").officialName, "Simms Bowie");
  assert.equal(find("Bowie", "3A Division I", "Region I").officialName, "Bowie");
  assert.equal(find("Bowie", "4A Division II", "Region I").officialName, "El Paso Bowie");
  assert.equal(find("Liberty", "4A Division II", "Region I").officialName, "Lubbock Cooper Liberty");
  for (const name of ["Leon", "Plains", "Cooper", "Ford", "Canyon"]) {
    assert.equal(identities.find((item) => item.bracketName === name)!.existingCatalog, null, name);
  }
});

test("reuses only existing identities and never invents or approves catalog records", () => {
  assert.equal(output.productionWrites, false);
  assert.equal(output.runtimeCatalogChanges, false);
  assert.equal(output.readyForPublication, 0);
  assert.equal(find("Johnson City", "2A Division I", "Region II").existingCatalog?.slug, "johnson-city-lbj");
  assert.equal(find("West Plains", "4A Division I", "Region I").existingCatalog?.slug, "canyon-west-plains");
  for (const item of identities) {
    assert.equal(item.proposedSlug, null);
    assert.equal(item.readyForCatalogIntegration, false);
    assert.equal(item.readyForPublication, false);
    if (item.catalogAction === "new-catalog-record-required") assert.equal(item.existingCatalog, null);
  }
});

type Fixture = {
  nameExpansions: { bracketName: string; region: string; officialName: string; sourceUrl: string }[];
  sources: { schools: { officialName: string; district: number }[] }[];
};
function rejectsFixture(file: string, mutate: (data: Fixture) => void, expected: RegExp) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "vv-identities-"));
  try {
    fs.mkdirSync(path.join(cwd, root), { recursive: true });
    for (const name of ["uil-alignment-schools.json", "school-identity-name-expansions.json"]) {
      const data = JSON.parse(fs.readFileSync(root + name, "utf8"));
      if (name === file) mutate(data);
      fs.writeFileSync(path.join(cwd, root, name), JSON.stringify(data));
    }
    // Resolve the installed loader explicitly while keeping evidence isolated.
    assert.throws(() => execFileSync(process.execPath, ["--import", path.resolve("node_modules/tsx/dist/loader.mjs"), script], {
      cwd, encoding: "utf8", stdio: "pipe",
      env: { ...process.env, TSX_TSCONFIG_PATH: path.resolve("tsconfig.json") },
    }), expected);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
}

test("rejects duplicate name expansions and cross-region identity substitution", () => {
  rejectsFixture("school-identity-name-expansions.json", (data) => data.nameExpansions.push(data.nameExpansions[0]), /duplicate qualified name expansion/);
  rejectsFixture("school-identity-name-expansions.json", (data) => {
    const target = data.nameExpansions.find((item) => item.bracketName === "Austin" && item.region === "Region I");
    assert.ok(target);
    target.officialName = "H Austin";
  }, /ambiguous or absent alignment identity/);
});

test("rejects inconsistent district evidence and unsupported source substitutions", () => {
  rejectsFixture("uil-alignment-schools.json", (data) => { const target = data.sources[0].schools.find((item) => item.officialName === "Panhandle"); assert.ok(target); target.district = 5; }, /alignment district\/region mismatch/);
  rejectsFixture("school-identity-name-expansions.json", (data) => { data.nameExpansions[0].sourceUrl = "https://example.org/unreviewed"; }, /name expansion source mismatch/);
});

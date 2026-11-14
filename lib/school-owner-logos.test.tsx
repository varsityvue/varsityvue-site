import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { schoolLogoBySlug, getSchoolLogoPath, getPickemLogoPath } from "../data/school-logos";
import { getSchoolBySlug } from "./schools";
import ProgramLogo from "../components/ProgramLogo";
import SchoolBadge from "../components/SchoolBadge";
import inventory from "../docs/2a-d1-owner-logos-20261114/inventory.json";
import preserved from "../docs/2a-d1-owner-logos-20261114/existing-asset-hashes.json";
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");

test("48 owner assets resolve to exact catalog identities with transparent, readable assets", async () => {
  assert.equal(inventory.length, 48);
  assert.equal(new Set(inventory.map(row => row.id)).size, 48);
  for (const row of inventory) {
    const school = getSchoolBySlug(row.slug);
    assert.ok(school);
    assert.equal(school.id, row.id);
    assert.equal(school.name, row.name);
    assert.equal(school.classification.conference, "2A");
    assert.equal(school.classification.division, "D1");
    assert.equal(getSchoolLogoPath(row.slug), `/logos/schools/${row.slug}.png`);
    const bytes = readFileSync(`public${getSchoolLogoPath(row.slug)}`);
    assert.equal(hash(bytes), row.assetSHA256);
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.hasAlpha, true);
    assert.deepEqual([meta.width, meta.height], row.assetSize);
    const normalized = await sharp(`public${getPickemLogoPath(row.slug)}`).metadata();
    assert.deepEqual([normalized.width, normalized.height, normalized.hasAlpha], [192, 192, true]);
    for (const html of [renderToStaticMarkup(<ProgramLogo school={school} />), renderToStaticMarkup(<SchoolBadge school={school} preferLogo />)]) {
      assert.ok(html.includes(`/logos/schools/${row.slug}.png`), `${row.slug} shared component`);
    }
  }
});

test("all previously approved asset files stay byte-identical; Beckville keeps its fallback", () => {
  for (const [path, expected] of Object.entries(preserved)) assert.equal(hash(readFileSync(path)), expected, path);
  assert.equal(schoolLogoBySlug.beckville, undefined);
  const school = getSchoolBySlug("beckville");
  assert.ok(school);
  assert.ok(!renderToStaticMarkup(<ProgramLogo school={school} />).includes("/logos/schools/beckville"));
  for (const alias of ["carlisle", "leon", "pewitt", "union-grove", "highland-park", "johnson-city"]) {
    assert.equal(schoolLogoBySlug[alias], undefined, `no duplicate ${alias} registry identity`);
  }
});

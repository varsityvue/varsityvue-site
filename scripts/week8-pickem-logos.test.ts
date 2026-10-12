import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import { getSchoolLogoPath, getPickemLogoPath } from "../data/school-logos";
import { analyzeVisibleArtwork, normalizeLogoBuffer } from "./normalize-pickem-logos";

const pairs = [
  ["china-spring", "stephenville"], ["cisco", "hawley"], ["clifton", "hamilton"],
  ["comanche", "dublin"], ["goldthwaite", "albany"], ["hico", "de-leon"],
  ["mart", "santo"], ["millsap", "rio-vista"], ["stamford", "cross-plains"], ["tolar", "eastland"],
];

for (const [slug, digest] of [
  ["dublin", "4c77fdcda5ac8b613f9bb9201c4192dda6ada984332c3859092a766c1ce654b8"],
  ["china-spring", "437f43a02d39f5ed052718f94cb000d0d6b2bc2d9970c0557b1cc6329040e8d4"],
]) test(`${slug} retains exact owner-provided source and a transparent centered Pick Em derivative`, async () => {
  assert.equal(getSchoolLogoPath(slug), `/logos/schools/${slug}.png`);
  const source = await readFile(`public${getSchoolLogoPath(slug)}`);
  assert.equal(createHash("sha256").update(source).digest("hex"), digest);
  assert.equal((await sharp(source).metadata()).hasAlpha, true);
  const derivative = await readFile(`public${getPickemLogoPath(slug)}`);
  assert.deepEqual(derivative, (await normalizeLogoBuffer(source)).output);
  const metadata = await sharp(derivative).metadata();
  assert.equal(metadata.width, 192); assert.equal(metadata.height, 192); assert.equal(metadata.hasAlpha, true);
  const visible = await analyzeVisibleArtwork(derivative);
  assert.ok(Math.max(visible.width, visible.height) >= 156);
  assert.ok(visible.left >= 8 && visible.top >= 8);
  assert.ok(visible.left + visible.width <= 184 && visible.top + visible.height <= 184);
});

test("all twenty team choices across the ten Week 8 matchups resolve decodable shared and Pick Em assets", async () => {
  assert.equal(pairs.length, 10);
  for (const slug of pairs.flat()) {
    for (const path of [getSchoolLogoPath(slug), getPickemLogoPath(slug)]) {
      assert.ok(path, `${slug} missing mapping`);
      const metadata = await sharp(`public${path}`).metadata();
      assert.ok(metadata.width && metadata.height, `${slug} cannot decode ${path}`);
    }
  }
  assert.equal(getSchoolLogoPath("unknown-school"), undefined);
  assert.equal(getPickemLogoPath("unknown-school"), undefined);
});

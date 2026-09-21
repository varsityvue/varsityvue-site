import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import sharp from "sharp";

import {
  NORMALIZATION,
  analyzeVisibleArtwork,
  normalizeLogoBuffer,
  normalizeLogoFile,
} from "./normalize-pickem-logos";

async function fixture(width: number, height: number, left: number, top: number, markWidth: number, markHeight: number) {
  const mark = await sharp({
    create: { background: { alpha: 1, b: 40, g: 80, r: 180 }, channels: 4, height: markHeight, width: markWidth },
  }).png().toBuffer();
  return sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height, width },
  }).composite([{ input: mark, left, top }]).png().toBuffer();
}

test("detects visible alpha bounds instead of transparent canvas padding", async () => {
  const input = await fixture(120, 100, 31, 22, 40, 30);
  const artwork = await analyzeVisibleArtwork(input);
  assert.deepEqual({ left: artwork.left, top: artwork.top, width: artwork.width, height: artwork.height }, { left: 31, top: 22, width: 40, height: 30 });
});

test("preserves aspect ratio, centers artwork, and does not crop visible pixels", async () => {
  const input = await fixture(160, 120, 25, 35, 100, 40);
  const result = await normalizeLogoBuffer(input);
  const outputArtwork = await analyzeVisibleArtwork(result.output);
  assert.equal((await sharp(result.output).metadata()).width, NORMALIZATION.canvasSize);
  assert.equal((await sharp(result.output).metadata()).height, NORMALIZATION.canvasSize);
  assert.ok(Math.abs(outputArtwork.width / outputArtwork.height - 2.5) < 0.04);
  assert.ok(Math.abs(outputArtwork.left - (NORMALIZATION.canvasSize - outputArtwork.width - outputArtwork.left)) <= 1);
  assert.ok(Math.abs(outputArtwork.top - (NORMALIZATION.canvasSize - outputArtwork.height - outputArtwork.top)) <= 1);
  assert.ok(outputArtwork.left > 0 && outputArtwork.top > 0);
  assert.ok(outputArtwork.left + outputArtwork.width < NORMALIZATION.canvasSize);
  assert.ok(outputArtwork.top + outputArtwork.height < NORMALIZATION.canvasSize);
});

test("produces byte-identical output on repeated normalization", async () => {
  const input = await fixture(90, 90, 15, 10, 45, 60);
  const first = await normalizeLogoBuffer(input);
  const second = await normalizeLogoBuffer(input);
  assert.ok(first.output.equals(second.output));
});

test("reports missing and unusable assets clearly", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pickem-logo-test-"));
  await assert.rejects(normalizeLogoFile(join(directory, "missing.png"), join(directory, "output.png")), /Unable to read logo asset/);
  const transparent = await sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 20, width: 20 },
  }).png().toBuffer();
  await assert.rejects(normalizeLogoBuffer(transparent), /no usable visible pixels/);
});

test("does not rewrite an unchanged generated file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pickem-logo-test-"));
  const inputPath = join(directory, "input.png");
  const outputPath = join(directory, "output.png");
  const input = await fixture(100, 80, 20, 20, 60, 40);
  await sharp(input).toFile(inputPath);
  const first = await normalizeLogoFile(inputPath, outputPath);
  const firstBytes = await readFile(outputPath);
  const second = await normalizeLogoFile(inputPath, outputPath);
  const secondBytes = await readFile(outputPath);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.ok(firstBytes.equals(secondBytes));
});

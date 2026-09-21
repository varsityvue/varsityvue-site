import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { schoolLogoBySlug } from "../data/school-logos";

export const NORMALIZATION = {
  alphaThreshold: 8,
  canvasSize: 192,
  maxArtworkHeight: 176,
  maxArtworkWidth: 176,
  minLongestEdge: 156,
  targetHybridArea: 18_000,
} as const;

export type VisibleArtwork = {
  alphaArea: number;
  height: number;
  left: number;
  top: number;
  width: number;
};

/**
 * Measures visible artwork from alpha rather than the source canvas. The sizing
 * metric is the geometric mean of effective alpha area and bounding-box area:
 * alpha area keeps dense and sparse marks optically closer, while bounding-box
 * area prevents a solid compact crest from becoming conspicuously small.
 * Artwork targets a 18,000 px hybrid area, has a 156 px minimum longest edge,
 * and is capped at 176×176 on a centered 192×192 transparent canvas. The 8 px
 * minimum safety margin prevents wide or tall marks from touching the edges.
 */
export async function analyzeVisibleArtwork(input: Buffer): Promise<VisibleArtwork> {
  let decoded;
  try {
    decoded = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch (error) {
    throw new Error(`Unable to decode logo asset: ${error instanceof Error ? error.message : String(error)}`);
  }

  const { data, info } = decoded;
  const alphaIndex = info.channels - 1;
  let left = info.width;
  let right = -1;
  let top = info.height;
  let bottom = -1;
  let alphaArea = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + alphaIndex];
      if (alpha > 0) alphaArea += alpha / 255;
      if (alpha >= NORMALIZATION.alphaThreshold) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (right < left || bottom < top || alphaArea === 0) {
    throw new Error("Logo asset contains no usable visible pixels");
  }

  return {
    alphaArea,
    height: bottom - top + 1,
    left,
    top,
    width: right - left + 1,
  };
}

export function normalizedArtworkSize(artwork: VisibleArtwork) {
  const boundsArea = artwork.width * artwork.height;
  const hybridArea = Math.sqrt(artwork.alphaArea * boundsArea);
  const targetScale = Math.sqrt(NORMALIZATION.targetHybridArea / hybridArea);
  const minimumScale = NORMALIZATION.minLongestEdge / Math.max(artwork.width, artwork.height);
  const capScale = Math.min(
    NORMALIZATION.maxArtworkWidth / artwork.width,
    NORMALIZATION.maxArtworkHeight / artwork.height,
  );
  const scale = Math.min(Math.max(targetScale, minimumScale), capScale);

  return {
    height: Math.max(1, Math.round(artwork.height * scale)),
    width: Math.max(1, Math.round(artwork.width * scale)),
  };
}

export async function normalizeLogoBuffer(input: Buffer) {
  const artwork = await analyzeVisibleArtwork(input);
  const size = normalizedArtworkSize(artwork);
  const resized = await sharp(input)
    .extract({ left: artwork.left, top: artwork.top, width: artwork.width, height: artwork.height })
    .resize(size.width, size.height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png({ adaptiveFiltering: false, compressionLevel: 9, palette: false })
    .toBuffer();
  const left = Math.floor((NORMALIZATION.canvasSize - size.width) / 2);
  const top = Math.floor((NORMALIZATION.canvasSize - size.height) / 2);
  const output = await sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: NORMALIZATION.canvasSize,
      width: NORMALIZATION.canvasSize,
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ adaptiveFiltering: false, compressionLevel: 9, palette: false })
    .toBuffer();

  return { artwork, output, placed: { ...size, left, top } };
}

export async function normalizeLogoFile(inputPath: string, outputPath: string) {
  let input;
  try {
    input = await readFile(inputPath);
  } catch (error) {
    throw new Error(`Unable to read logo asset ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const { output, ...result } = await normalizeLogoBuffer(input);
  await mkdir(dirname(outputPath), { recursive: true });
  let previous: Buffer | undefined;
  try {
    previous = await readFile(outputPath);
  } catch {
    previous = undefined;
  }
  const changed = !previous?.equals(output);
  if (changed) await writeFile(outputPath, output);
  return { ...result, changed, output };
}

async function main() {
  const requested = process.argv.slice(2).filter((value) => value !== "--");
  const slugs = requested.length > 0 ? requested : Object.keys(schoolLogoBySlug).sort();
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  for (const slug of slugs) {
    const logo = schoolLogoBySlug[slug];
    if (!logo) throw new Error(`Unknown school slug: ${slug}`);
    const inputPath = join(root, "public", logo.path.replace(/^\//, ""));
    const outputPath = join(root, "public", "logos", "schools", "pickem", `${slug}.png`);
    const result = await normalizeLogoFile(inputPath, outputPath);
    const state = result.changed ? "generated" : "unchanged";
    console.log(`${state.padEnd(9)} ${slug.padEnd(22)} ${result.artwork.width}x${result.artwork.height} -> ${result.placed.width}x${result.placed.height}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

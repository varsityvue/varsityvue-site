import sharp from "sharp";

export async function processTeamFeedImage(file: File) {
  if (file.size > 3 * 1024 * 1024 || file.size < 1 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPEG, PNG, or WebP image under 3 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const input = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" });
  const meta = await input.metadata();
  if (!meta.width || !meta.height || meta.width > 10000 || meta.height > 10000 || !["jpeg", "png", "webp"].includes(meta.format ?? "")) throw new Error("Invalid image dimensions or format.");
  const output = await input.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const result = await sharp(output).metadata();
  if (result.exif || result.xmp || !result.width || !result.height || output.length > 10 * 1024 * 1024) throw new Error("Image processing failed.");
  return { output, width: result.width, height: result.height };
}

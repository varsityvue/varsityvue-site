import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { processTeamFeedImage } from "./team-feed-image";

test("published derivative preserves ratio and strips EXIF/GPS", async () => {
  const source = await sharp({ create: { width: 800, height: 400, channels: 3, background: "#224466" } })
    .jpeg().withExif({ IFD0: { Copyright: "Test photographer" }, IFD3: { GPSLatitudeRef: "N" } }).toBuffer();
  const processed = await processTeamFeedImage(new File([Uint8Array.from(source)], "local-private-name.jpg", { type: "image/jpeg" }));
  const meta = await sharp(processed.output).metadata();
  assert.equal(meta.format, "webp");
  assert.deepEqual([processed.width, processed.height], [800, 400]);
  assert.equal(meta.exif, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(processed.output.includes(Buffer.from("Test photographer")), false);
});

test("rejects spoofed image content", async () => {
  await assert.rejects(processTeamFeedImage(new File(["not an image"], "fake.jpg", { type: "image/jpeg" })));
});

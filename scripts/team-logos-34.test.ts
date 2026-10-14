import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { getSchoolLogoPath, getPickemLogoPath } from "@/data/school-logos";
import { getSchoolBySlug } from "@/lib/schools";
import ProgramLogo from "@/components/ProgramLogo";
import SchoolBadge from "@/components/SchoolBadge";
import { normalizeLogoBuffer, analyzeVisibleArtwork } from "./normalize-pickem-logos";

const slugs = [
  "abilene-texas-leadership",
  "abilene-wylie",
  "bangs",
  "blooming-grove",
  "brady",
  "breckenridge",
  "brock",
  "brownwood",
  "burnet",
  "christoval",
  "clyde",
  "coleman",
  "colorado-city",
  "granger",
  "haskell",
  "henrietta",
  "holland",
  "holliday",
  "itasca",
  "jarrell",
  "junction",
  "lubbock-cooper",
  "marble-falls",
  "mason",
  "meridian",
  "midlothian-heritage",
  "moody",
  "olney",
  "peaster",
  "roscoe",
  "san-saba",
  "seymour",
  "valley-mills",
  "city-view"
] as const;

test("all 34 supplied logos resolve canonical schools and render through shared consumers", () => {
  assert.equal(new Set(slugs).size, 34);
  for (const slug of slugs) {
    const school = getSchoolBySlug(slug); assert.ok(school, slug);
    assert.equal(getSchoolLogoPath(slug), `/logos/schools/${slug}.png`);
    assert.equal(getPickemLogoPath(slug), `/logos/schools/pickem/${slug}.png`);
    for (const html of [renderToStaticMarkup(ProgramLogo({school})), renderToStaticMarkup(SchoolBadge({school, size:"md"}))]) {
      assert.ok(html.includes(getSchoolLogoPath(slug)!));
      assert.ok(html.includes("object-contain"));
    }
    // Compact badges keep their existing design; this is not a badge redesign.
    assert.ok(!renderToStaticMarkup(SchoolBadge({school, size:"xs"})).includes("<img"));
  }
  assert.equal(getSchoolLogoPath("santo"), "/logos/schools/santo-final.webp");
  assert.equal(getSchoolLogoPath("hamilton"), "/logos/schools/hamilton.png");
  assert.equal(getSchoolLogoPath("no-such-team"), undefined);
});

test("all supplied general and Pick Em PNGs decode, retain alpha and reproduce existing optical normalization", async () => {
  for (const slug of slugs) {
    const input = readFileSync(`public${getSchoolLogoPath(slug)}`);
    const meta = await sharp(input).metadata();
    assert.equal(meta.format,"png"); assert.equal(meta.hasAlpha,true);
    assert.ok(meta.width!<=512 && meta.height!<=512);
    const artwork = await analyzeVisibleArtwork(input); assert.ok(artwork.alphaArea>0);
    const pickem = readFileSync(`public${getPickemLogoPath(slug)}`);
    const normalized = await normalizeLogoBuffer(input);
    assert.ok(normalized.output.equals(pickem), slug);
    const p = await sharp(pickem).metadata();
    assert.equal(p.width,192); assert.equal(p.height,192); assert.equal(p.hasAlpha,true);
    const bounds = await analyzeVisibleArtwork(pickem);
    assert.ok(bounds.left>=8 && bounds.top>=8 && bounds.left+bounds.width<=184 && bounds.top+bounds.height<=184,slug);
  }
});

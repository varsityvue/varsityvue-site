import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { schoolLogoBySlug, getSchoolLogoImageStyle, getDirectoryLogoFrameStyle, getPickemLogoFilter } from "@/data/school-logos";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "@/components/SchoolBadge";
import ProgramLogo from "@/components/ProgramLogo";
import { PickemChoice } from "@/components/PickemSelectionCard";
import { analyzeVisibleArtwork } from "./normalize-pickem-logos";

const subtle = ["hawley","tolar","clifton","lampasas","meridian","cross-plains","early"];
test("silhouette glow reaches optimized Pick Em images and preserves official colors", () => {
  for (const slug of subtle) {
    assert.match(String(getSchoolLogoImageStyle(slug).filter), /drop-shadow/);
    const filter = getPickemLogoFilter(slug)!;
    assert.match(filter,/drop-shadow/); assert.doesNotMatch(filter,/brightness|contrast|hue-rotate/);
    const html = renderToStaticMarkup(PickemChoice({name:"fixture",slug,team:slug,label:"Away",mark:slug,color:"#000000",logoUrl:`/logos/schools/pickem/${slug}.png`,logoFilter:filter,checked:false,locked:false,lockedMessageId:"fixture-lock",onSelect:()=>{}}));
    assert.ok(html.includes("drop-shadow")); assert.ok(html.includes("/_next/image"));
  }
  assert.match(String(getSchoolLogoImageStyle("moody").filter),/0\.55/);
  assert.doesNotMatch(String(getSchoolLogoImageStyle("moody").filter),/4px|0\.9/);
  for(const slug of ["brownwood","colorado-city","jarrell","marble-falls","mason"]) assert.match(String(getSchoolLogoImageStyle(slug).filter),/0\.9/);
  assert.deepEqual(getSchoolLogoImageStyle("hico"),{});
  assert.deepEqual(getDirectoryLogoFrameStyle("hico"),{});
});

test("central optical controls propagate without changing compact badge design", () => {
  for(const [slug, logo]of Object.entries(schoolLogoBySlug)) {
    if(!logo.optical)continue;
    const school=getSchoolBySlug(slug)!;assert.ok(school);
    for(const html of [renderToStaticMarkup(ProgramLogo({school})),renderToStaticMarkup(SchoolBadge({school,size:"md"}))]) {
      if(logo.optical.scale)assert.ok(html.includes(`scale(${logo.optical.scale})`),slug);
      assert.ok(html.includes("object-contain"));
    }
    assert.ok(!renderToStaticMarkup(SchoolBadge({school,size:"xs"})).includes("<img"));
  }
  for(const slug of ["abilene-texas-leadership","anson","tolar"])assert.deepEqual(getDirectoryLogoFrameStyle(slug),{width:76});
});

test("visible artwork fits real frame sizes with safe margins and preserved aspect ratio", async () => {
  for(const [slug,logo]of Object.entries(schoolLogoBySlug)) {
    if(!logo.optical)continue;
    const b=readFileSync(`public${logo.path}`),meta=await sharp(b).metadata(),a=await analyzeVisibleArtwork(b);
    for(const [w,h,padding,directory]of [[logo.optical.directoryWidth??56,56,6,true],[logo.optical.directoryWidth??64,64,6,true],[40,40,6,false],[80,80,8,false],[144,144,8,false],[208,208,8,false]] as const) {
      const scale=(directory ? logo.optical.directoryScale ?? logo.optical.scale : logo.optical.scale)??1;
      const cw=w-2*padding-2,ch=h-2*padding-2;
      const fit=Math.min(cw/meta.width!,ch/meta.height!)*scale;
      const left=(w-meta.width!*fit)/2+a.left*fit,top=(h-meta.height!*fit)/2+a.top*fit;
      assert.ok(left>=3&&top>=3&&w-left-a.width*fit>=3&&h-top-a.height*fit>=3,`${slug} ${w}x${h}: clipped or unsafe`);
      assert.ok(Math.abs((a.width*fit)/(a.height*fit)-a.width/a.height)<1e-9);
    }
  }
});

test("Dublin and Crawford balance reference marks by visible alpha area, not equal boxes", async () => {
  async function visibleArea(slug: string) {
    const logo=schoolLogoBySlug[slug],b=readFileSync(`public${logo.path}`);
    const m=await sharp(b).metadata(),a=await analyzeVisibleArtwork(b);
    const fit=Math.min(42/m.width!,42/m.height!)*(logo.optical?.scale??1);
    return a.alphaArea*fit*fit;
  }
  const dublinRatio=await visibleArea("dublin")/await visibleArea("brownwood");
  const crawfordRatio=await visibleArea("crawford")/await visibleArea("clyde");
  assert.ok(dublinRatio>0.9&&dublinRatio<1.25);
  assert.ok(crawfordRatio>0.85&&crawfordRatio<1.1);
});

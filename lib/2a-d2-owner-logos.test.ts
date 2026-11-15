import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";
import sharp from "sharp";
import {schoolLogoBySlug,getSchoolLogoPath} from "../data/school-logos";
import {getSchoolBySlug} from "./schools";
import inventory from "../docs/2a-d2-owner-logos-20261115/inventory.json";
import preserved from "../docs/2a-d2-owner-logos-20261115/existing-asset-hashes.json";
const hash=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
test("2a-d2 source identity, RGBA preservation and new derivatives",async()=>{
 assert.equal(inventory.length,50);
 assert.equal(new Set(inventory.map(r=>r.slug)).size,inventory.length);
 for(const row of inventory){
  const school=getSchoolBySlug(row.slug);assert.ok(school);assert.equal(school.id,row.id);
  assert.equal(school.classification.conference,"2A");assert.equal(school.classification.division,"D2");
  if(row.existing) continue;
  const path=getSchoolLogoPath(row.slug);assert.equal(path,`/logos/schools/${row.slug}.png`);
  const bytes=readFileSync(`public${path}`);assert.equal(hash(bytes),row.assetSHA256);
  const [left,top,right,bottom]=row.alphaBounds;
  const rgba=await sharp(bytes).ensureAlpha().extract({left:row.padding,top:row.padding,width:right-left,height:bottom-top}).raw().toBuffer();
  assert.equal(hash(rgba),row.visibleRGBA_SHA256);
  const m=await sharp(`public/logos/schools/pickem/${row.slug}.png`).metadata();assert.deepEqual([m.width,m.height,m.hasAlpha],[192,192,true]);
 }
});
test("2a-d2 preserves all approved files and missing placeholders",()=>{
 for(const [path,expected] of Object.entries(preserved))assert.equal(hash(readFileSync(path)),expected,path);
 for(const slug of ['stratford', 'west-sabine'])assert.equal(schoolLogoBySlug[slug],undefined);
});

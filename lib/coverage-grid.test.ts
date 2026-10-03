import test from "node:test";
import assert from "node:assert/strict";
import { CELL_METERS, GRID_VERSION, coverageBucket, coverageParent, gridBucketFromMeters, projectCoveragePoint, validCoverageBucket } from "./coverage-grid";

test("regional grid is deterministic, versioned, bounded and has no encoded raw coordinates", () => {
  const point = { latitude: 32.123456789, longitude: -98.543210987 };
  const bucket = coverageBucket(point)!;
  assert.equal(bucket, coverageBucket(point)); assert.ok(validCoverageBucket(bucket));
  assert.ok(bucket.startsWith(GRID_VERSION + ":"));
  for (const coordinate of Object.values(point)) assert.ok(!bucket.includes(String(coordinate)));
  for (const p of [{ latitude: 25.9, longitude: -97.5 }, { latitude: 36.5, longitude: -102.5 }, { latitude: 31.7, longitude: -106.5 }, { latitude: 29.7, longitude: -95.3 }]) assert.ok(coverageBucket(p));
  for (const p of [{ latitude: NaN, longitude: -98 }, { latitude: 91, longitude: -98 }, { latitude: 32, longitude: -181 }, { latitude: 32, longitude: Infinity }, { latitude: 45, longitude: -98 }]) assert.equal(coverageBucket(p), null);
  for (const id of ['tx25-v2:c0r10','tx25-v1:c-0r10','tx25-v1:c00r10','tx25-v1:c99r10','tx25-v1:c0r0']) assert.equal(validCoverageBucket(id), false);
});
test("meter boundaries use floor, including negative easting, and deterministic 4x4 parents", () => {
  assert.equal(gridBucketFromMeters(CELL_METERS-0.001,CELL_METERS*10), 'tx25-v1:c0r10');
  assert.equal(gridBucketFromMeters(CELL_METERS,CELL_METERS*10), 'tx25-v1:c1r10');
  assert.equal(gridBucketFromMeters(-0.001,CELL_METERS*10), 'tx25-v1:c-1r10');
  assert.equal(coverageParent('tx25-v1:c-1r10'),'tx25-v1:p-1r2');
  assert.equal(coverageParent('tx25-v1:c3r11'),'tx25-v1:p0r2');
  assert.equal(coverageParent('tx25-v1:c4r12'),'tx25-v1:p1r3');
  assert.equal(coverageParent('invalid'), null);
});
test("projection uses physical meters rather than equal latitude/longitude degrees", () => {
  const p=projectCoveragePoint({latitude:32,longitude:-100})!;
  const north=projectCoveragePoint({latitude:33,longitude:-100})!;
  const east=projectCoveragePoint({latitude:32,longitude:-99})!;
  const ns=Math.hypot(north.x-p.x,north.y-p.y), ew=Math.hypot(east.x-p.x,east.y-p.y);
  assert.ok(ns>110000 && ns<112000); assert.ok(ew>93000 && ew<95000); assert.ok(ns/ew>1.16);
  assert.equal(CELL_METERS,25*1609.344);
});

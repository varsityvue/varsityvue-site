import assert from "node:assert/strict";
import test from "node:test";
import { getBiDistrictReadiness } from "./bidistrict-readiness";
import { serializeBiDistrictReadinessCsv } from "./bidistrict-readiness-csv";

test("read-only export includes all 192 bracket positions and source-research gaps", () => {
  const csv = serializeBiDistrictReadinessCsv(getBiDistrictReadiness([]));
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 193);
  assert.match(lines[0], /Missing information/);
  assert.match(csv, /missing-record/);
  assert.match(csv, /Cisco/);
});

test("CSV escapes quotes and neutralizes spreadsheet formula prefixes", () => {
  const csv = serializeBiDistrictReadinessCsv([{
    division: "=SUM(1,1)", region: "Region II", slot: 1,
    teams: ['Team "A"', "+HYPERLINK(1)"], status: "missing-record", missing: ["published game record"],
  }]);
  assert.match(csv, /'=SUM/);
  assert.match(csv, /Team ""A""/);
  assert.match(csv, /'\+HYPERLINK/);
});

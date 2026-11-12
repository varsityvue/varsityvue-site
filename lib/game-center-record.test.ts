import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getGames } from "./games";
import { getStandingForSchoolFromGames } from "./standings";
import { formatOverallRecord } from "./school-record-presentation";

test("Game Center uses known-record formatting for both teams on both layouts", () => {
  const page = readFileSync("app/games/[gameId]/page.tsx", "utf8");
  assert.equal((page.match(/record=\{formatOverallRecord\((away|home)Standing\)\}/g) ?? []).length, 4);
  assert.doesNotMatch(page, /Standing\.overallWins/);
  const nocona = getStandingForSchoolFromGames("nocona", getGames());
  assert.equal(formatOverallRecord(nocona), "—");
  assert.equal(formatOverallRecord({overallRecordKnown:true, overallWins:0, overallLosses:0}), "0-0");
});

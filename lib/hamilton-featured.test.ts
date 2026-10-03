import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { getFeaturedSchools, getSchools, getSchoolBySlug } from "./schools";
import { getGames } from "./games";
import { getSchoolLogoPath, getPickemLogoPath } from "@/data/school-logos";
import { schoolFootballVenues } from "@/data/school-football-venues";
import { venues } from "@/data/venues";
import { isTeamFeedEnabled } from "./team-feed-eligibility";
import { validateFeedRelationships } from "./team-feed-validation";
import { getStandingsForDistrictId } from "./standings";

const existing = ["de-leon", "cisco", "hico", "comanche", "goldthwaite", "albany", "stamford", "stephenville", "santo"];
test("Hamilton is the only tenth Featured School and keeps canonical identity", () => {
  assert.deepEqual(getFeaturedSchools().map(s => s.slug).sort(), [...existing, "hamilton"].sort());
  assert.equal(getSchools().filter(s => s.slug === "hamilton" || s.id === "hamilton").length, 1);
  const s = getSchoolBySlug("hamilton")!;
  assert.equal(s.fullName, "Hamilton Bulldogs"); assert.equal(s.mascot, "Bulldogs");
  assert.deepEqual(s.classification, { conference: "3A", division: "D2" });
  assert.equal(s.districtId, "3a-d2-district-5"); assert.equal(s.uilRegion, 2);
  assert.deepEqual(s.colors, { primary: "#CE2123", secondary: "#000000", accent: "#FFFFFF" });
  assert.equal(s.officialWebsite, "https://www.hamiltonisd.org/");
});
test("Hamilton uses supplied logo through the existing registry, without changing artwork", () => {
  assert.equal(getSchoolLogoPath("hamilton"), "/logos/schools/hamilton.png");
  assert.equal(getPickemLogoPath("hamilton"), "/logos/schools/pickem/hamilton.png");
  assert.ok(existsSync("public/logos/schools/hamilton.png"));
  assert.deepEqual(readFileSync("public/logos/schools/hamilton.png"), readFileSync("public/logos/schools/pickem/hamilton.png"));
});
test("Hamilton schedule, standings and home venue reuse existing canonical data", () => {
  const games = getGames().filter(g => g.homeSchoolSlug === "hamilton" || g.awaySchoolSlug === "hamilton");
  assert.equal(games.length, 10);
  assert.equal(games.find(g => g.week === 7)?.id, "dublin-at-hamilton-2026-week-7");
  assert.equal(games.find(g => g.week === 8)?.id, "clifton-at-hamilton-2026-week-8");
  assert.ok(getStandingsForDistrictId("3a-d2-district-5").some(s => s.schoolSlug === "hamilton"));
  assert.equal(schoolFootballVenues.hamilton, "tx-hamilton-kooken-field");
  assert.equal(venues.filter(v => v.id === schoolFootballVenues.hamilton).length, 1);
});
test("Hamilton inherits Featured feed eligibility and canonical follow/directory paths", () => {
  assert.ok(isTeamFeedEnabled("hamilton"));
  assert.ok(validateFeedRelationships("hamilton", null, "clifton-at-hamilton-2026-week-8"));
  const directory = readFileSync("app/schools/page.tsx", "utf8");
  assert.match(directory, /featured: school.status === "pilot"/);
  const follow = readFileSync("app/schools/[slug]/follow-actions.ts", "utf8");
  assert.match(follow, /getSchoolBySlug/);
});

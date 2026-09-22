import assert from "node:assert/strict";
import test from "node:test";

import { getGames } from "@/lib/games";
import { getSchoolBySlug, getSchools, getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictId } from "@/lib/standings";

const submittedSchools = [
  ["jacksboro", "3A", "D2", 1, "3a-d2-district-4", "Casey Hubble", "Tiger Stadium", "1400 N Main St, Jacksboro, TX 76458"],
  ["crawford", "2A", "D2", 2, "2a-d2-district-8", "Greg Jacobs", "Pirate Stadium", "523 E 4th St, Crawford, TX 76638"],
  ["hubbard", "2A", "D2", 2, "2a-d2-district-8", "Ryan Faulknor", "Jaguar Field", "1100 W 4th St, Hubbard, TX 76648"],
  ["wortham", "2A", "D2", 2, "2a-d2-district-8", "Bryce Perkins", "Bulldog Stadium", "411 Longbotham St, Wortham, TX 76693"],
  ["meridian", "2A", "D2", 2, "2a-d2-district-8", "Jim Kerbow", "Yellow Jacket Stadium", "605 F St, Meridian, TX 76665"],
  ["mart", "2A", "D2", 2, "2a-d2-district-8", "Kyle Stone", "Panther Stadium", "1400 E Kensington St, Mart, TX 76664"],
  ["hamlin", "2A", "D2", 2, "2a-d2-district-7", "Jason Botos", "Piper Stadium", "450 SW Ave F, Hamlin, TX 79520"],
  ["cross-plains", "2A", "D2", 2, "2a-d2-district-7", "Jared Sanderson", "Buffalo Stadium", "700 N Main St, Cross Plains, TX 76443"],
  ["miles", "2A", "D2", 2, "2a-d2-district-7", "Jayson Wilhelm", "Gary Krejci Memorial Stadium", "1001 Robinson St, Miles, TX 76861"],
  ["winters", "2A", "D2", 2, "2a-d2-district-7", "Ryan Pannell", "Blizzard Stadium", "603 N Heights St, Winters, TX 79567"],
  ["anson", "2A", "D1", 2, "2a-d1-district-5", "Kyle Wheeler", "Tiger Stadium", "703 Avenue N, Anson, TX 79501"],
  ["hawley", "2A", "D1", 2, "2a-d1-district-5", "Mitch Ables", "Forrest Field", "800 1st St, Hawley, TX 79525"],
  ["abilene-texas-leadership", "2A", "D1", 2, "2a-d1-district-5", "Webb Murphy", "Curly Hayes Football Field", "840 Barrow St, Abilene, TX 79605"],
  ["clifton", "3A", "D2", 2, "3a-d2-district-5", "Brent Finney", "Cub Stadium", "1101 N Ave Q, Clifton, TX 76634"],
  ["tolar", "3A", "D2", 2, "3a-d2-district-5", "Blake Mouser", "Tolar Rattlers Stadium", "600 W 7th St, Tolar, TX 76476"],
  ["rio-vista", "3A", "D2", 2, "3a-d2-district-5", "Matthew Woodard", "Eagle Field", "315 S Cleburne Whitney Rd, Rio Vista, TX 76093"],
  ["millsap", "3A", "D2", 2, "3a-d2-district-5", "Jacob Johnson", "Bulldog Stadium", "600 Bulldog Blvd, Millsap, TX 76066"],
  ["eastland", "3A", "D2", 2, "3a-d2-district-5", "Matt Landers", "Maverick Stadium", "903 E Main St, Eastland, TX 76448"],
  ["dublin", "3A", "D2", 2, "3a-d2-district-5", "Greg Hardcastle", "Bob and Norma Cervetto Stadium", "2233 Hwy 6, Dublin, TX 76446"],
  ["hamilton", "3A", "D2", 2, "3a-d2-district-5", "Ryan Marwitz", "Kooken Field", "917 S Railroad St, Hamilton, TX 76531"],
] as const;

test("submitted school records are canonical, complete, and uniquely identified", () => {
  const schools = getSchools();
  for (const [slug, conference, division, region, districtId, coach, stadium, address] of submittedSchools) {
    const matches = schools.filter((school) => school.slug === slug || school.id === slug);
    assert.equal(matches.length, 1, slug);
    assert.deepEqual(matches[0]?.classification, { conference, division });
    assert.equal(matches[0]?.uilRegion, region);
    assert.equal(matches[0]?.districtId, districtId);
    assert.equal(matches[0]?.headCoach, coach);
    assert.equal(matches[0]?.stadium, stadium);
    assert.equal(matches[0]?.stadiumAddress, address);
  }
});

test("Abilene TLCA aliases resolve to the canonical school", () => {
  const canonical = getSchoolBySlug("abilene-texas-leadership");
  assert.equal(getSchoolBySlug("abilene-tlca")?.id, canonical?.id);
  assert.equal(getSchoolBySlug("tlca-abilene")?.id, canonical?.id);
  assert.equal(getSchools().filter((school) => school.id === canonical?.id).length, 1);
});

test("district reconciliation preserves existing valid members", () => {
  assert.deepEqual(getSchoolsByDistrictId("2a-d2-district-8").map((school) => school.slug).sort(), [
    "crawford", "frost", "hubbard", "mart", "meridian", "santo", "wortham",
  ]);
  assert.deepEqual(getSchoolsByDistrictId("3a-d2-district-4").map((school) => school.slug).sort(), [
    "breckenridge", "city-view", "henrietta", "holliday", "jacksboro", "merkel",
  ]);
  assert.equal(getSchoolBySlug("santo")?.districtId, "2a-d2-district-8");
  assert.deepEqual(getStandingsForDistrictId("opponent"), []);
});

test("school master-data reconciliation creates no schedules or games", () => {
  const games = getGames();
  assert.equal(games.length, 215);
  assert.equal(new Set(games.map((game) => game.id)).size, games.length);
  assert.equal(games.filter((game) => game.homeSchoolSlug === "jacksboro" || game.awaySchoolSlug === "jacksboro").length, 11);
});

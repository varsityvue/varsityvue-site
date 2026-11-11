import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { getSchoolBySlug, getSchools, getFeaturedSchools } from "./schools";
import { getGames } from "./games";
import { getBiDistrictReadiness } from "./bidistrict-readiness";
import { getTrackedDirectorySchools } from "./school-directory";
import { resolveBracketSchool } from "./playoff-school-catalog";
import { playoffSchoolAdditions } from "../data/playoff-school-additions";
import { playoffSchoolIdentities } from "../data/playoff-school-slugs";
import { playoffDistrictAdditions } from "../data/playoff-district-additions";
import { districts } from "../data/districts";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const additionIds = new Set(playoffSchoolAdditions.map((school) => school.id));

test("catalog integration preserves every existing school and all game schedules/results", () => {
  const existing = getSchools().filter((school) => !additionIds.has(school.id));
  assert.equal(existing.length, 70);
  assert.equal(hash(existing), "a87103e8435e3b9f2daadbb84ca7ccb3176bcdb19d1e8bf32e2487d8be40ee56");
  const games = getGames().map(({id,season,gameType,homeSchoolSlug,awaySchoolSlug,homeTeam,awayTeam,kickoff,venue,homeScore,awayScore,publicScoreVerified,officialWinnerSchoolSlug,resultType,playoff}) => ({id,season,gameType,homeSchoolSlug,awaySchoolSlug,homeTeam,awayTeam,kickoff,venue,homeScore,awayScore,publicScoreVerified,officialWinnerSchoolSlug,resultType,playoff}));
  assert.equal(games.length, 296);
  assert.equal(hash(games), "4d814ac7cf5c8f32271f0615e02a4e97959bca917ffebf0546f1dab4fb3b2dee");
  assert.deepEqual(getFeaturedSchools().map((school) => school.slug), existing.filter((school) => school.status === "pilot").map((school) => school.slug));
});

test("planned schools have unique complete identities and valid district references", () => {
  assert.equal(playoffSchoolAdditions.length, 341);
  assert.equal(getSchools().length, 411);
  assert.equal(playoffDistrictAdditions.length, 85);
  assert.equal(districts.length, 96);
  for (const school of playoffSchoolAdditions) {
    assert.equal(getSchools().filter((item) => item.id === school.id || item.slug === school.slug).length, 1);
    assert.equal(getSchoolBySlug(school.slug)?.id, school.id);
    assert.equal(school.status, "planned");
    const district = districts.find((item) => item.id === school.districtId);
    assert.ok(district, school.slug);
    assert.deepEqual(school.classification, district.classification);
    assert.equal(school.uilRegion, district.uilRegion);
    assert.ok(school.mascot.trim() && school.abbreviation.trim());
    for (const value of Object.values(school.colors)) assert.match(value, /^#[0-9A-F]{6}$/);
  }
  assert.equal(getSchoolBySlug("houston-sterling"), undefined);
});

test("qualified bracket resolution covers 383 identities while holding Sterling out", () => {
  const slots = getBiDistrictReadiness([]);
  let matched = 0;
  for (const slot of slots) for (const name of slot.teams) {
    const school = resolveBracketSchool(name, slot.division, slot.region);
    if (name === "Sterling" && slot.division === "4A Division I" && slot.region === "Region III") assert.equal(school, undefined);
    else { assert.ok(school, `${slot.division}|${slot.region}|${name}`); matched += 1; }
  }
  assert.equal(matched, 383);
  assert.equal(new Set(playoffSchoolIdentities.filter((item) => item.schoolSlug).map((item) => item.schoolSlug)).size, 383);
});

test("Austin, Bowie, Liberty and existing-name variants cannot cross identity boundaries", () => {
  assert.equal(resolveBracketSchool("Austin", "4A-D1", "I")?.slug, "el-paso-austin");
  assert.equal(resolveBracketSchool("Austin", "4A-D1", "III")?.slug, "houston-austin");
  assert.equal(resolveBracketSchool("Bowie", "2A-D2", "III")?.slug, "simms-bowie");
  assert.equal(resolveBracketSchool("Bowie", "3A-D1", "I")?.slug, "bowie");
  assert.equal(resolveBracketSchool("Bowie", "4A-D2", "I")?.slug, "el-paso-bowie");
  assert.equal(resolveBracketSchool("Liberty", "4A-D2", "I")?.slug, "lubbock-cooper-liberty");
  assert.equal(resolveBracketSchool("Johnson City", "2A-D1", "II")?.slug, "johnson-city-lbj");
  assert.equal(resolveBracketSchool("West Plains", "4A-D1", "I")?.slug, "canyon-west-plains");
  assert.equal(resolveBracketSchool("Leon", "2A-D1", "IV")?.slug, "jewett-leon");
  assert.equal(resolveBracketSchool("Cooper", "2A-D1", "III")?.slug, "cooper");
  assert.equal(resolveBracketSchool("Plains", "2A-D2", "I")?.slug, "plains");
  assert.equal(resolveBracketSchool("Ford", "4A-D2", "II")?.slug, "quinlan-ford");
  assert.equal(resolveBracketSchool("Austin", "4A-D1", "IV"), undefined);
  assert.equal(resolveBracketSchool("Cooper", "5A-D2", "III"), undefined);
  assert.equal(resolveBracketSchool("Leon", "2A-D1", "II"), undefined);
  assert.equal(resolveBracketSchool("Austin", "4A-D1", ""), undefined);
});


test("catalog expansion does not turn untracked planned schools into directory coverage", () => {
  const catalog = getSchools();
  const directory = getTrackedDirectorySchools(catalog, getGames());
  const slugs = new Set(directory.map((school) => school.slug));
  for (const school of getFeaturedSchools()) assert.equal(slugs.has(school.slug), true);
  assert.equal(slugs.has("panhandle"), false, "a metadata record alone is not coverage");
  assert.equal(slugs.has("nocona"), true, "the existing Cisco–Nocona game establishes coverage");
  assert.ok(directory.length < catalog.length);
});

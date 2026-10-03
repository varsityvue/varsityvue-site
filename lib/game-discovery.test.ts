import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { venues } from "@/data/venues";
import { schoolFootballVenues } from "@/data/school-football-venues";
import { gameVenueOverrides } from "@/data/game-venue-overrides";
import { weekSevenPilotGameIds, weekEightPilotGameIds } from "@/data/game-location-pilot";
import { getGames } from "@/lib/games";
import { getFeaturedSchools, getSchoolBySlug } from "@/lib/schools";
import { resolveGameLocation, toDiscoveryGame } from "./game-location";
import { distanceMiles, distanceLabel, validPoint } from "./geo-distance";
import { currentScheduleWeek, nearbyGames, pilotGate, realGame } from "./game-discovery";
import type { Game } from "@/types/platform";
import type { DiscoveryGame } from "@/types/game-location";

const games = getGames();
const dto = games.map(g => toDiscoveryGame(g, resolveGameLocation(g, venues, schoolFootballVenues, gameVenueOverrides)));
const original = games.find(g => g.id === "albany-at-stamford-2026-week-7")!;
const location = resolveGameLocation(original, venues, schoolFootballVenues, {});
const fixture = (id: string, status: Game["status"] = "upcoming", lon = 0): DiscoveryGame => ({ ...toDiscoveryGame(original, location), gameId: id, status, kickoff: "2026-10-09T19:00:00-05:00", location: { locationQuality: "verified", locationSource: "home_venue", venueName: "Test field", city: "Test", latitude: 0, longitude: lon } });
const center = { latitude: 0, longitude: 0 };

test("venue IDs unique; bounded 30 school mappings and 31 physical venues", () => {
  assert.equal(venues.length, 31); assert.equal(new Set(venues.map(v => v.id)).size, venues.length);
  assert.equal(Object.keys(schoolFootballVenues).length, 30);
});
test("verified coordinate ranges and research provenance", () => {
  for (const v of venues) { assert.ok(validPoint(v)); assert.equal(v.verificationStatus, "verified"); assert.ok(v.sourceReferences.length >= 2); assert.equal(v.verifiedAt, "2026-10-03"); assert.match(v.zip, /^\d{5}$/); }
  assert.equal(validPoint({ latitude: NaN, longitude: 0 }), false);
  assert.equal(validPoint({ latitude: 91, longitude: 0 }), false);
  assert.equal(validPoint({ latitude: 0, longitude: Infinity }), false);
  assert.equal(validPoint({ latitude: 0, longitude: 181 }), false);
});
test("every school mapping resolves; all 10 Featured Schools verified", () => {
  const featured = getFeaturedSchools(); assert.equal(featured.length, 10);
  for (const slug of [...Object.keys(schoolFootballVenues), ...featured.map(s => s.slug)]) {
    assert.ok(venues.find(v => v.id === schoolFootballVenues[slug] && v.verificationStatus === "verified"));
  }
});
test("Week 7 exact canonical 17-of-17 complete, IDs unchanged", () => {
  const slate = games.filter(g => g.season === 2026 && g.week === 7 && realGame(g));
  assert.deepEqual(slate.map(g => g.id).sort(), [...weekSevenPilotGameIds]);
  assert.equal(slate.length, 17); assert.deepEqual(pilotGate(dto, 7), { enabled: true, total: 17, unresolved: 0 });
});
test("missing venue, unverified venue and invalid coordinates fail closed", () => {
  assert.deepEqual(resolveGameLocation(original, [], schoolFootballVenues, {}), { locationQuality: "unavailable", reason: "missing_venue" });
  for (const patch of [{ verificationStatus: "needs_review" as const }, { latitude: Infinity }]) {
    assert.deepEqual(resolveGameLocation(original, venues.map(v => ({ ...v, ...patch })), schoolFootballVenues, {}), { locationQuality: "unavailable", reason: "unverified_venue" });
  }
});
test("explicit override precedence; broken explicit override never falls back", () => {
  const override = venues[0];
  const result = resolveGameLocation(original, venues, schoolFootballVenues, { [original.id]: override.id });
  assert.equal(result.locationQuality, "verified"); if (result.locationQuality === "verified") { assert.equal(result.venueName, override.name); assert.equal(result.locationSource, "game_override"); }
  assert.deepEqual(resolveGameLocation(original, venues, schoolFootballVenues, { [original.id]: "broken" }), { locationQuality: "unavailable", reason: "missing_venue" });
  assert.equal(resolveGameLocation(original, [{ ...override, verificationStatus: "needs_review" }], schoolFootballVenues, { [original.id]: override.id }).locationQuality, "unavailable");
});
test("neutral and playoff games require verified explicit override", () => {
  for (const g of [{ ...original, isNeutralSite: true }, { ...original, gameType: "playoff" as const }]) {
    assert.deepEqual(resolveGameLocation(g, venues, schoolFootballVenues, {}), { locationQuality: "unavailable", reason: "explicit_venue_required" });
    assert.equal(resolveGameLocation(g, venues, schoolFootballVenues, { [g.id]: venues[0].id }).locationQuality, "verified");
  }
});
test("incomplete/changed/duplicate slate and unverified weeks are disabled", () => {
  assert.equal(pilotGate(dto, 6).enabled, false); assert.equal(pilotGate(dto, 9).enabled, false);
  assert.equal(pilotGate(dto.filter(g => g.gameId !== original.id), 7).enabled, false);
  assert.equal(pilotGate(dto.map(g => g.gameId === original.id ? { ...g, gameId: "changed-id" } : g), 7).enabled, false);
  assert.equal(pilotGate([...dto, dto.find(g => g.gameId === original.id)!], 7).enabled, false);
  assert.equal(pilotGate(dto.map(g => g.gameId === original.id ? { ...g, location: { locationQuality: "unavailable", reason: "missing_venue" } } : g), 7).enabled, false);
});
test("current Central schedule week is independent of Pick Em and does not auto-enable Week 9", () => {
  assert.equal(currentScheduleWeek(dto, new Date("2026-10-03T02:00:00Z")), 6);
  assert.equal(currentScheduleWeek(dto, new Date("2026-10-05T05:01:00Z")), 7);
  assert.equal(currentScheduleWeek(dto, new Date("2026-10-12T05:01:00Z")), 8);
  assert.equal(pilotGate(dto, currentScheduleWeek(dto, new Date("2026-10-19T05:01:00Z"))!).enabled, false);
});
test("Haversine known fixtures, identical points and antipodes", () => {
  assert.equal(distanceMiles(center, center), 0);
  assert.ok(Math.abs(distanceMiles(center, { latitude: 0, longitude: 1 }) - 69.0934) < .001);
  assert.ok(Math.abs(distanceMiles({ latitude: 32.7767, longitude: -96.797 }, { latitude: 30.2672, longitude: -97.7431 }) - 182.1) < 1);
  assert.ok(Number.isFinite(distanceMiles(center, { latitude: 0, longitude: 180 })));
  assert.throws(() => distanceMiles(center, { latitude: NaN, longitude: 0 }), /Invalid geographic point/);
});
test("radius uses exact distance before display rounding", () => {
  const g = fixture("boundary", "upcoming", 1); const d = distanceMiles(center, { latitude: 0, longitude: 1 });
  assert.equal(nearbyGames([g], center, d, 7).games.length, 1);
  assert.equal(nearbyGames([g], center, d - .00001, 7).games.length, 0);
  assert.equal(distanceLabel(d), "69 mi away"); assert.equal(distanceLabel(.01), "Less than 1 mi away"); assert.equal(distanceLabel(11.6), "12 mi away");
});
test("LIVE first then upcoming, nearest, kickoff and stable canonical ID", () => {
  const rows = [fixture("z", "upcoming", .1), fixture("live", "live", 1), fixture("a", "upcoming", .1), fixture("near", "upcoming", .05)];
  assert.deepEqual(nearbyGames(rows, center, 150, 7).games.map(g => g.gameId), ["live", "near", "a", "z"]);
  assert.deepEqual(nearbyGames([{ ...rows[0], kickoff: "2026-10-08T19:00:00-05:00" }, rows[2]], center, 150, 7).games.map(g => g.gameId), ["z", "a"]);
});
test("byes and scrimmages excluded, FINAL separately, filters distinguish no matches", () => {
  const rows = [fixture("future"), fixture("final", "final"), { ...fixture("bye"), gameType: "bye" as const }, { ...fixture("scrim"), gameType: "scrimmage" as const }];
  assert.deepEqual(nearbyGames(rows, center, 50, 7).games.map(g => g.gameId), ["future"]);
  assert.deepEqual(nearbyGames(rows, center, 50, 7, "", "final").games.map(g => g.gameId), ["final"]);
  assert.equal(nearbyGames(rows, center, 50, 7, "no match").nearbyCount, 1);
  assert.equal(nearbyGames(rows, { latitude: 50, longitude: 50 }, 10, 7).nearbyCount, 0);
});
test("public DTO allowlist strips member/provenance and repository sources", () => {
  const toxic = { ...original, updated_by: "private", source_submission_id: "private", applicant_id: "private", reviewed_by: "private", user_id: "private", sourceReferences: ["private"], notes: "private" };
  const result = toDiscoveryGame(toxic, location);
  assert.deepEqual(Object.keys(result).sort(), ["gameId","season","week","homeTeam","awayTeam","homeSchoolSlug","awaySchoolSlug","kickoff","status","gameType","districtGame","homeScore","awayScore","period","clock","livePresentation","location"].sort());
  assert.doesNotMatch(JSON.stringify(result), /private|sourceReferences|verifiedAt|updated_by|source_submission_id|user_id|applicant_id|reviewed_by/);
});
test("kickoff inferred LIVE never claims verified score coverage", () => {
  assert.equal(toDiscoveryGame({ ...original, status: "live", scoreAttribution: undefined }, location).livePresentation, "kickoff_inferred");
  assert.equal(toDiscoveryGame({ ...original, status: "live", scoreAttribution: { type: "publisher" } }, location).livePresentation, "score_available");
});
test("client location is transient and discovery does not transmit it", () => {
  const client = readFileSync("components/GamesNearMe.tsx", "utf8");
  assert.match(client, /getCurrentPosition/); assert.doesNotMatch(client, /watchPosition|localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|sendBeacon|console\.|track\(|router\.|URLSearchParams/);
  assert.doesNotMatch(client, /sourceReferences|verifiedAt|applicant_id|updated_by|source_submission_id/);
  assert.match(client, /prefetch=\{false\}/);
  const page = readFileSync("app/games/page.tsx", "utf8"); assert.doesNotMatch(page, /^"use client"/);
  assert.match(page, /toDiscoveryGame/); assert.match(page, /prefetch=\{false\}/);
});

test("Week 8 exact canonical 17-of-17 slate fails closed on missing, changed, duplicate or unresolved games", () => {
  const slate = games.filter(g => g.season === 2026 && g.week === 8 && realGame(g));
  assert.equal(slate.length, 17);
  assert.deepEqual(slate.map(g => g.id).sort(), [...weekEightPilotGameIds]);
  assert.equal(new Set(slate.map(g => g.id)).size, 17);
  assert.ok(slate.every(g => g.districtGame && !g.isNeutralSite && g.gameType !== "playoff"));
  assert.deepEqual(pilotGate(dto, 8), { enabled: true, total: 17, unresolved: 0 });
  const first = slate[0].id;
  assert.equal(pilotGate(dto.filter(g => g.gameId !== first), 8).enabled, false);
  assert.equal(pilotGate([...dto, dto.find(g => g.gameId === first)!], 8).enabled, false);
  assert.equal(pilotGate(dto.map(g => g.gameId === first ? { ...g, gameId: "changed" } : g), 8).enabled, false);
  assert.equal(pilotGate(dto.map(g => g.gameId === first ? { ...g, location: { locationQuality: "unavailable", reason: "missing_venue" } } : g), 8).enabled, false);
});
test("all mappings and overrides reference canonical schools, games and unique verified venues", () => {
  const ids = new Set(venues.map(v => v.id));
  for (const [slug, id] of Object.entries(schoolFootballVenues)) {
    assert.ok(getSchoolBySlug(slug), slug); assert.ok(ids.has(id), id);
  }
  for (const [id, venue] of Object.entries(gameVenueOverrides)) {
    assert.ok(games.some(g => g.id === id)); assert.ok(ids.has(venue));
  }
  const tlca = games.find(g => g.id === "anson-at-abilene-tlca-2026-week-8")!;
  const result = resolveGameLocation(tlca, venues, schoolFootballVenues, gameVenueOverrides);
  assert.equal(result.locationQuality, "verified");
  if (result.locationQuality === "verified") {
    assert.equal(result.locationSource, "game_override"); assert.equal(result.venueName, "Wilford Moore Stadium");
  }
  assert.equal(new Set(venues.map(v => `${v.latitude},${v.longitude}`)).size, venues.length);
});

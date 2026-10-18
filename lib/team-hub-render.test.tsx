import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import RecentScores from "@/components/RecentScores";
import SchoolGameNight from "@/components/SchoolGameNight";
import SchoolCoverage from "@/components/SchoolCoverage";
import { getSchoolBySlug } from "@/lib/schools";
import type { Game } from "@/types/platform";

const school = getSchoolBySlug("de-leon")!;
const final = { id: "test-final", status: "final", gameType: "regular", homeSchoolSlug: school.slug, awaySchoolSlug: "hico", homeTeam: "De Leon", awayTeam: "Hico", homeScore: 49, awayScore: 7, kickoff: "2026-10-16T00:00:00Z" } as Game;

test("earlier pilot results never mislabel an older final as latest; default stays unchanged", () => {
  const html = renderToStaticMarkup(<RecentScores scores={[final]} theme={school.colors} schoolSlug={school.slug} compact earlier />);
  assert.match(html, /Earlier results/);
  assert.doesNotMatch(html, />Latest</);
  assert.equal([...html.matchAll(/href="\/games\/test-final"/g)].length, 1);
  assert.match(renderToStaticMarkup(<RecentScores scores={[final]} theme={school.colors} schoolSlug={school.slug} />), />Latest</);
});
test("game summary renders scores with team names and hides unverified scores", () => {
  const html = renderToStaticMarkup(<SchoolGameNight school={school} focus={{ featured: final, next: undefined }} />);
  assert.match(html, /FINAL · verified/);
  assert.match(html, /Hico/);
  assert.match(html, /49/);
  const pending = { ...final, status: "upcoming" as const, homeScore: 999, awayScore: 888, kickoff: "2099-10-16T00:00:00Z" };
  const unverified = renderToStaticMarkup(<SchoolGameNight school={school} focus={{ featured: pending, next: pending }} />);
  assert.doesNotMatch(unverified, /999|888/);
});
test("empty summary has useful public fallback and schedule access", () => {
  const html = renderToStaticMarkup(<SchoolGameNight school={school} focus={{ featured: undefined, next: undefined }} />);
  assert.match(html, /No game is currently listed/);
  assert.match(html, /\/schools\/de-leon\/schedule/);
});
test("enhanced coverage has dates, existing photo credits, and no duplicate article links", () => {
  const html = renderToStaticMarkup(<SchoolCoverage schoolSlug="de-leon" enhanced />);
  assert.match(html, /Dixie Watson/);
  assert.match(html, /Tedra Zmeskal/);
  assert.match(html, /datetime="2026-/i);
  const links = [...html.matchAll(/href="(\/coverage\/[^"?]+)"/g)].map(match => match[1]);
  assert.equal(new Set(links).size, links.length);
});

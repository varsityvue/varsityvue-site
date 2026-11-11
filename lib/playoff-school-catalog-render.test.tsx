import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import SchoolBadge from "../components/SchoolBadge";
import SchoolSeasonOverview from "../components/SchoolSeasonOverview";
import { getStandingForSchoolFromGames } from "./standings";
import SchoolGameNight from "../components/SchoolGameNight";
import { playoffSchoolAdditions } from "../data/playoff-school-additions";

test("every added school renders its badge and an honest empty schedule state", () => {
  for (const school of playoffSchoolAdditions) {
    const badge = renderToStaticMarkup(<SchoolBadge school={school} />);
    assert.ok(badge.length > 0, school.slug);
    assert.doesNotMatch(badge, /undefined|NaN/, school.slug);
    const html = renderToStaticMarkup(<SchoolGameNight school={school} focus={{ featured: undefined, next: undefined }} />);
    assert.match(html, /No game is currently listed/, school.slug);
    assert.ok(html.includes(`/schools/${school.slug}/schedule`), school.slug);
    assert.doesNotMatch(html, /FINAL · verified|>0-0</, school.slug);
  }
});


test("season overview renders unknown records as a dash while preserving explicitly known zero records", () => {
  const school = playoffSchoolAdditions.find((item) => item.slug === "panhandle")!;
  const props = { theme: school.colors, recentResults: [] as ("W" | "L" | "T")[], pointsFor: 0, pointsAgainst: 0, hasScoringData: false };
  const unknown = renderToStaticMarkup(<SchoolSeasonOverview {...props} standing={getStandingForSchoolFromGames(school.slug, [])} />);
  assert.match(unknown, /Season Overview/);
  assert.doesNotMatch(unknown, />0-0</);
  assert.equal((unknown.match(/>—</g) ?? []).length, 4);
  const known = renderToStaticMarkup(<SchoolSeasonOverview {...props} standing={{ overallRecordKnown: true, overallWins: 0, overallLosses: 0 }} />);
  assert.match(known, />0-0</);
});

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import SchoolBadge from "../components/SchoolBadge";
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

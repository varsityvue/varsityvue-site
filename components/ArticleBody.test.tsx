import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import ArticleBody from "./ArticleBody";
import { week6DistrictRacesGuide2026 } from "../data/week-6-district-races-guide-2026";

test("the guide renders two published internal article links and its list", () => {
  const html = renderToStaticMarkup(<ArticleBody body={week6DistrictRacesGuide2026.body} />);
  assert.match(html, /href="\/coverage\/district-5-2a-d1-preview-cisco-de-leon-2026"/);
  assert.match(html, /href="\/coverage\/district-7-2a-d2-goldthwaite-leads-race-2026"/);
  assert.equal((html.match(/href=/g) ?? []).length, 2);
  assert.equal((html.match(/<li>/g) ?? []).length, 3);
  assert.match(html, /Non-district records shaped the questions/);
  assert.doesNotMatch(html, /\[Read the full District 5 preview\]/);
});

test("unpublished and external destinations cannot become links", () => {
  const html = renderToStaticMarkup(<ArticleBody body="[Missing](/coverage/not-published) and [External](https://example.com)" />);
  assert.doesNotMatch(html, /href=/);
  assert.match(html, /Missing/);
});

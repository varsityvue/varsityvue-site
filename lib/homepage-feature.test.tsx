import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import HomeEditorialSpotlight from "@/components/HomeEditorialSpotlight";
import { featureDestination, isSafeLocalPath, type HomepageFeature } from "@/lib/homepage-feature";

const district: HomepageFeature = {
  id: 2, season: 2026, week: 6, feature_type: "district_preview", eyebrow: "Week 6 Spotlight",
  headline: "District Races Take Center Stage", description: "District previews and predictions.",
  image_path: null, article_slug: null, destination_path: null, cta_label: "View District Previews →",
  game_id: null, active: true,
};

test("district feature needs neither a game nor a premature link", () => {
  assert.equal(featureDestination(district), null);
  const html = renderToStaticMarkup(<HomeEditorialSpotlight feature={district} href={null} />);
  assert.match(html, /District Races Take Center Stage/);
  assert.doesNotMatch(html, /<a\b|<img\b|Game of the Week/);
});

test("published article and explicit local destination render an actionable CTA", () => {
  const article = { ...district, article_slug: "district-7-2a-d2-goldthwaite-leads-race-2026" };
  assert.equal(featureDestination(article), `/coverage/${article.article_slug}`);
  const linked = { ...district, destination_path: "/districts", image_path: "/images/coverage/example.png" };
  const html = renderToStaticMarkup(<HomeEditorialSpotlight feature={linked} href={featureDestination(linked)} />);
  assert.match(html, /href="\/districts"/);
  assert.match(html, /%2Fimages%2Fcoverage%2Fexample.png/);
  assert.equal(featureDestination({ ...district, article_slug: "unpublished" }), null);
  assert.equal(isSafeLocalPath("/\\evil.example"), false);
  assert.equal(isSafeLocalPath("//evil.example"), false);
});

test("a traditional editorial matchup links to its canonical game independently of Pick Em", () => {
  const game = { ...district, feature_type: "game_of_the_week" as const, game_id: "jacksboro-at-cisco-2026-week-5" };
  assert.equal(featureDestination(game), "/games/jacksboro-at-cisco-2026-week-5");
  assert.equal(featureDestination({ ...district, active: false }), null);
});

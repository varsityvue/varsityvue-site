import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import TeamFeedCard from "@/components/TeamFeedCard";
import SchoolFeedHeader from "@/components/SchoolFeedHeader";
import TeamFeedList from "@/components/TeamFeedList";
import type { FeedPost } from "@/lib/team-feed";
import { getSchoolBySlug } from "@/lib/schools";
const post: FeedPost = { id: "sample", primary_school_id: getSchoolBySlug("de-leon")!.id, secondary_school_id: getSchoolBySlug("hico")!.id, game_id: null, source_type: "varsityvue", status: "published", caption: "Football update. Photo: Approved Photographer", published_at: "2026-10-18T07:02:00Z", team_feed_media: [{ id: "media", public_path: "sample.webp", alt_text: "Football graphic", width: 1080, height: 1350 }] };
test("enhanced feed preserves associations, full caption credits and intrinsic graphic dimensions", () => {
  const html = renderToStaticMarkup(<TeamFeedCard post={post} enhanced schoolSlug="de-leon" />);
  assert.match(html, /De Leon · Hico/);
  assert.match(html, /Photo: Approved Photographer/);
  assert.match(html, /width="1080" height="1350"/);
  assert.match(html, /object-contain/);
  assert.doesNotMatch(html, /max-h-|object-cover/);
  assert.match(html, /dateTime="2026-10-18T07:02:00Z"/);
  assert.match(html, /Share team feed/);
  assert.doesNotMatch(html, /Like|Comment|Reply/);
});
test("missing credits do not produce fabricated attribution; unpublished media does not render", () => {
  const html = renderToStaticMarkup(<TeamFeedCard post={{ ...post, caption: "Short update" }} enhanced />);
  assert.doesNotMatch(html, /Photo:|Photographer/);
  assert.equal(renderToStaticMarkup(<TeamFeedCard post={{ ...post, published_at: null }} />), "");
  assert.equal(renderToStaticMarkup(<TeamFeedCard post={{ ...post, team_feed_media: [] }} />), "");
});
test("empty feed remains useful and ordinary cards keep their publication date", () => {
  assert.match(renderToStaticMarkup(<TeamFeedList initial={[]} hasMore={false} slug="de-leon" />), /just getting started/);
  const html = renderToStaticMarkup(<TeamFeedCard post={post} />);
  assert.match(html, /<time/);
  assert.doesNotMatch(html, /Share team feed/);
});

test("all five pilots use the social feed with school-specific identity; non-pilots keep ordinary cards", () => {
  for (const slug of ["de-leon", "cisco", "goldthwaite", "albany", "stephenville"]) {
    const school = getSchoolBySlug(slug)!;
    const sample = { ...post, primary_school_id: school.id, secondary_school_id: null };
    const html = renderToStaticMarkup(<TeamFeedList initial={[sample]} hasMore={false} slug={slug} />);
    assert.match(html, new RegExp(school.name));
    assert.match(html, /Share team feed/);
    assert.match(html, /Photo: Approved Photographer/);
    assert.match(html, /object-contain/);
  }
  for (const slug of ["hico", "hamilton"]) {
    assert.doesNotMatch(renderToStaticMarkup(<TeamFeedList initial={[post]} hasMore={false} slug={slug} />), /Share team feed/);
  }
});

test("shared feed header uses each school's mascot, branding, hub link and share URL even when empty", () => {
 for (const slug of ["de-leon", "cisco", "goldthwaite", "albany", "stephenville"]) {
  const school = getSchoolBySlug(slug)!;
  const html = renderToStaticMarkup(<SchoolFeedHeader school={school} />);
  assert.ok(html.includes(`${school.mascot} football, in the moment.`));
  assert.ok(html.includes(school.colors.primary));
  assert.ok(html.includes(`/schools/${slug}`));
  if (slug !== "de-leon") assert.doesNotMatch(html, /Bearcats|De Leon/);
 }
});

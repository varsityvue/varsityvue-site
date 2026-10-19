import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import TeamFeedCard from "@/components/TeamFeedCard";
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

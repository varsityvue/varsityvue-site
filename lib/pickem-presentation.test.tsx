import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import PickemPrizeCounter from "../components/PickemPrizeCounter";
import PickemContestHeader from "../components/PickemContestHeader";
import PickemSponsorMark from "../components/PickemSponsorMark";
import { logoForPickemWeek, pickemSponsorLogos } from "../data/pickem-sponsor-logos";

test("counter renders authoritative accepted-entry and capped prize values", () => {
  for (const [valid_entries, prize_dollars] of [[0, 0], [1, 1], [42, 42], [100, 100], [117, 100]]) {
    const html = renderToStaticMarkup(<PickemPrizeCounter weekId="synthetic" initialPrize={{ valid_entries, prize_dollars }} />);
    assert.match(html, new RegExp(`>${valid_entries}<`));
    assert.match(html, new RegExp(`>\\$${prize_dollars}<`));
    assert.doesNotMatch(html, /phone|email|user_id/i);
  }
  const unavailable = renderToStaticMarkup(<PickemPrizeCounter weekId="synthetic" initialPrize={null} />);
  assert.match(unavailable, /temporarily unavailable/);
  assert.doesNotMatch(unavailable, /\$0/);
});

test("sponsor logo is per-week and falls back to the name without a missing image", () => {
  const path = "/sponsors/gilder-storage-approved.png";
  assert.ok(existsSync(join(process.cwd(), "public", path)));
  for (const placement of Object.values(pickemSponsorLogos)) {
    assert.ok(existsSync(join(process.cwd(), "public", placement.path)));
  }
  const configured = { "2026-6": { name: "Gilder Storage", path } } as const;
  assert.equal(logoForPickemWeek(2026, 6, "Gilder Storage", configured), path);
  assert.equal(logoForPickemWeek(2026, 7, "Gilder Storage", configured), null);
  assert.equal(logoForPickemWeek(2026, 6, "Another sponsor", configured), null);
  assert.equal(logoForPickemWeek(2026, 6, null, configured), null);
  assert.equal(logoForPickemWeek(2026, 6, "Gilder Storage"), path);
  const nameOnly = renderToStaticMarkup(<PickemSponsorMark name="Gilder Storage" logo={null} />);
  assert.match(nameOnly, /Presented by.*Gilder Storage/);
  assert.doesNotMatch(nameOnly, /<img/);
  const withLogo = renderToStaticMarkup(<PickemSponsorMark name="Gilder Storage" logo={path} />);
  assert.match(withLogo, /Gilder Storage logo/);
  assert.match(withLogo, /object-contain/);
  assert.match(withLogo, /whitespace-nowrap/);
  assert.doesNotMatch(withLogo, /Presented by.*<span[^>]*>Gilder Storage<\/span>/);
});


test("compact header shows the frozen Central deadline and sponsor without entry statistics", () => {
  const html = renderToStaticMarkup(<PickemContestHeader season={2026} week={7} deadline="2026-10-10T00:00:00Z" sponsorName="Gilder Storage" sponsorLogo="/sponsors/gilder-storage-approved.png" />);
  assert.match(html, /Week 7 Pick ’Em/);
  assert.match(html, /Oct 9.*7:00 PM CDT/);
  assert.match(html, /Texas residents 18\+/);
  assert.match(html, /Gilder Storage logo/);
  assert.match(html, /Share Week 7 Pick ’Em/);
  assert.match(html, />Share<\/span>/);
  assert.doesNotMatch(html, /Accepted completed entries|Provisional cash prize/);
  const winter = renderToStaticMarkup(<PickemContestHeader season={2026} week={11} deadline="2026-11-07T00:00:00Z" sponsorLogo={null} />);
  assert.match(winter, /Nov 6.*6:00 PM CST/);
});

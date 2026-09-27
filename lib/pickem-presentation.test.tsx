import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import PickemPrizeCounter from "../components/PickemPrizeCounter";
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
});

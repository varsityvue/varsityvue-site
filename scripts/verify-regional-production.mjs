import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, devices } from "playwright";

const base = "https://varsityvue.com";
const rows = JSON.parse(readFileSync(new URL("../data/playoff-regional-semifinals-2026.json", import.meta.url)));
const priority = ["de-leon", "cisco", "stephenville", "santo", "goldthwaite", "millsap", "tolar"];
const path = row => "/games/" + row.gameId;

// GitHub and Vercel start independently when the release merges.
let published = false;
for (let attempt = 0; attempt < 30; attempt++) {
  const response = await fetch(base + "/api/games/snapshot", { signal: AbortSignal.timeout(30000) });
  if (response.ok) {
    const { games, scoreLoadStatus } = await response.json();
    const ids = new Set(games.filter(g => g.id.startsWith("2026-regional-semifinal-")).map(g => g.id));
    published = scoreLoadStatus !== "failed" && ids.size === 48 && rows.every(row => ids.has(row.gameId));
    if (published) break;
  }
  await delay(10000);
}
assert.ok(published, "Production must serve the released catalog and verified score feed");

const browser = await chromium.launch();
try {
  for (const [device, options] of [["desktop", { viewport: { width: 1280, height: 900 } }], ["iPhone", devices["iPhone 13"]]]) {
    const context = await browser.newContext({ ...options, timezoneId: "America/Chicago" });
    try {
      const page = await context.newPage();
      await page.goto(base + "/playoffs#brackets");
      const bracket = page.getByRole("region", { name: "Interactive Road to State bracket" });
      const divisionSelect = page.getByLabel("Bracket division", { exact: true });
      await divisionSelect.waitFor();
      for (const division of new Set(rows.map(r => r.division))) {
        await divisionSelect.selectOption(division);
        await page.getByLabel("Bracket region", { exact: true }).selectOption("all");
        for (const row of rows.filter(r => r.division === division)) {
          await bracket.locator('a[href="' + path(row) + '"]').waitFor({ state: "attached" });
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), device + " bracket overflow");
      await page.getByText("View options", { exact: true }).click();
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      await page.getByRole("button", { name: "Reset View", exact: true }).click();
      for (const slug of priority) {
        const row = rows.find(r => r.bracketOrderSchoolSlugs.includes(slug));
        await page.goto(base + "/schools/" + slug);
        await page.locator('a[href="' + path(row) + '"]:visible').first().click();
        await page.waitForURL(base + path(row));
        const text = (await page.locator("main").innerText()).toLowerCase();
        assert.ok(text.includes("regional semifinal") && text.includes(row.venue.toLowerCase()), slug);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug + " overflow");
        assert.equal(await page.locator('a[href*="nfhsnetwork.com/events/"]:visible').count(), row.broadcastLinks.length);
        console.log(device, slug, row.gameId, "OK");
      }
      const shiner = rows.find(r => r.bracketOrderSchoolSlugs.includes("shiner"));
      await page.goto(base + path(shiner));
      const tbd = (await page.locator("main").innerText()).toLowerCase();
      assert.ok(tbd.includes("time tbd") && tbd.includes("house park, austin"));
      await page.getByRole("link", { name: /region iv bracket/i }).click();
      await bracket.waitFor();
      console.log(device, "six brackets, zoom/reset, 7 priority links and Shiner date-only navigation passed");
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

// Exercises the actual ticker component without production services or credentials.
import { createElement } from "react";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { getScoreboardGames } from "../lib/scoreboard.ts";

const require = createRequire(import.meta.url);
const { default: ScoreStripGames } = require("../components/ScoreStripGames.tsx");
const { build } = require("esbuild");
const { chromium } = require("playwright");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");

async function main() {
  const games = getScoreboardGames().filter((game) => game.week === 7).slice(0, 12);
  const markup = renderToString(createElement(ScoreStripGames, { mode: "upcoming", games }));
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {hydrateRoot} from 'react-dom/client'; import ScoreStripGames from './components/ScoreStripGames'; hydrateRoot(document.getElementById('root'), React.createElement(ScoreStripGames, {mode:'upcoming',games:${JSON.stringify(games)}}));`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
  });
  const css = await postcss([tailwind()]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
  const html = `<!doctype html><html><head><style>${css.css}</style></head><body><div id="root">${markup}</div><button id="after">After strip</button><script src="/fixture.js"></script></body></html>`;
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript" : "text/html");
    res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${address.port}`);
      const track = page.locator(".vv-score-ticker-track");
      await page.waitForSelector('[data-loop-ready="true"]');
      const decoration = page.locator(".vv-score-ticker-decoration");
      assert.equal(await decoration.locator("a, [href], [tabindex]").count(), 0);
      assert.equal(await decoration.getAttribute("aria-hidden"), "true");
      assert.notEqual(await decoration.getAttribute("inert"), null);
      assert.equal(await decoration.locator(":scope > span").count(), games.length);
      assert.equal(await page.getByRole("link").count(), games.length + 1);
      const snapshot = await page.getByRole("region").ariaSnapshot();
      for (const game of games) assert.equal(snapshot.split(`/games/${game.id}`).length - 1, 1);
      assert.equal(await track.evaluate((el) => getComputedStyle(el).animationName), "vv-score-ticker");
      // Hover preserves the paused loop; Tab switches to the canonical scrollable list.
      await track.hover();
      assert.equal(await track.evaluate((el) => getComputedStyle(el).animationPlayState), "paused");
      await page.mouse.move(0, 700);
      await page.keyboard.press("Tab"); // Week label link
      for (const game of games) {
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").getAttribute("href"), `/games/${game.id}`);
        assert.equal(await track.evaluate((el) => getComputedStyle(el).animationName), "none");
        const visible = await page.locator(":focus").evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const viewport = el.closest(".vv-score-ticker-wrap").getBoundingClientRect();
          return rect.left >= viewport.left - 1 && rect.right <= viewport.right + 1;
        });
        assert.ok(visible, `Focused ${game.id} must be visible at ${width}px`);
      }
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(":focus").getAttribute("id"), "after");
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(await track.evaluate((el) => getComputedStyle(el).animationName), "none");
      assert.equal(await decoration.evaluate((el) => getComputedStyle(el).display), "none");
      assert.deepEqual(errors, []);
      await page.close();
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(`http://127.0.0.1:${address.port}`);
    assert.equal(await noJsPage.getByRole("link").count(), games.length + 1);
    assert.equal(await noJsPage.locator(".vv-score-ticker-decoration").textContent(), "");
    assert.equal(await noJsPage.locator(".vv-score-ticker-track").evaluate((el) => getComputedStyle(el).animationName), "none");
    await noJs.close();
    console.log("PASS: single semantic sequence, inert link-free clone, keyboard visibility, hover pause, reduced motion (390/1280px)");
  } finally {
    await browser?.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

import assert from "node:assert/strict";
import http from "node:http";
import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
const evidence = "unified-games-browser-evidence";
mkdirSync(evidence, { recursive: true });
const origin = "http://127.0.0.1:3019";
const id = "00000000-0000-4000-8000-000000000001";
const payload = {
  sub: id,
  aud: "authenticated",
  role: "authenticated",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};
const body = [{ alg: "HS256", typ: "JWT" }, payload]
  .map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"))
  .join(".");
const session = {
  access_token: `${body}.${createHmac("sha256", "fixture-only").update(body).digest("base64url")}`,
  refresh_token: "fixture",
  expires_at: payload.exp,
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
  },
};
let mode = "normal";
let writes = 0;
let scoreCalls = 0;
const rows = [
  {
    game_id: "de-leon-at-hawley-2026-week-7",
    status: "live",
    home_score: 0,
    away_score: 0,
    verified: true,
    attribution_type: "publisher",
    attribution_username: "friday_fan",
  },
  {
    game_id: "albany-at-stamford-2026-week-7",
    status: "final",
    home_score: 7,
    away_score: 0,
    verified: true,
    result_type: "played",
  },
  {
    game_id: "anson-at-cisco-2026-week-7",
    status: "postponed",
    verified: true,
  },
  {
    game_id: "comanche-at-millsap-2026-week-7",
    status: "cancelled",
    verified: true,
  },
  {
    game_id: "crawford-at-hubbard-2026-week-7",
    status: "final",
    verified: true,
    result_type: "forfeit",
    official_winner_school_slug: "hubbard",
  },
  {
    game_id: "eastland-at-clifton-2026-week-7",
    status: "scheduled",
    verified: true,
    kickoff_override: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    game_id: "hamlin-at-goldthwaite-2026-week-7",
    status: "final",
    verified: true,
    result_type: "no_contest",
  },
  {
    game_id: "merkel-at-jacksboro-2026-week-7",
    status: "live",
    verified: true,
  },
];
const api = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  const path = req.url;
  const send = (x) => res.end(JSON.stringify(x));
  if (path.startsWith("/auth/v1/user")) return send(session.user);
  if (
    req.method === "POST" &&
    !path.startsWith("/rest/v1/rpc/public_score_states")
  )
    writes++;
  if (
    mode === "failure" &&
    (path.includes("public_score_states") ||
      path.includes("public_game_state") ||
      path.includes("school_follows"))
  ) {
    res.statusCode = 503;
    return send({ message: "Isolated unavailable fixture" });
  }
  if (path.includes("public_score_states")) {
    scoreCalls++;
    return send(rows);
  }
  if (path.includes("school_follows"))
    return send([{ school_slug: "de-leon" }, { school_slug: "hawley" }]);
  if (path.includes("member_account_status"))
    return send([{ status: "active" }]);
  send([]);
});
await new Promise((r) => api.listen(54329, "127.0.0.1", r));

let app,
  browser,
  log = "";
const results = [];
const pass = (name) => {
  results.push({ name, status: "PASS" });
  console.log("PASS", name);
};
function start() {
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "0.0.0.0",
      "--port",
      "3019",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-public-key",
        SUPABASE_SERVICE_ROLE_KEY: "",
        RESEND_API_KEY: "",
        CRON_SECRET: "",
      },
    },
  );
  app.stdout.on("data", (d) => (log += d));
  app.stderr.on("data", (d) => (log += d));
}
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + "/games")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw Error(log.slice(-3000));
}
async function context(options = {}) {
  const c = await browser.newContext(options);
  await c.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
  await c.addInitScript(() => {
    window.locationCalls = 0;
    window.geoCallbacks = [];
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition(success, error, options) {
          window.locationCalls++;
          window.geoCallbacks.push({ success, error, options });
        },
      },
    });
  });
  return c;
}
async function authenticated(c) {
  await c.addCookies([
    {
      name: "sb-127-auth-token",
      value:
        "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}
async function settled(page) {
  await page.waitForFunction(() => location.search.includes("season="));
}
try {
  start();
  await ready();
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  let c = await context();
  await authenticated(c);
  let page = await c.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [390, 400, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + "/games?week=7");
    await settled(page);
    assert.equal(
      await page.getByRole("heading", { name: /Your Teams/ }).count(),
      1,
    );
    assert.equal(
      await page
        .locator('[data-game-id="de-leon-at-hawley-2026-week-7"]')
        .count(),
      1,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `${evidence}/weekly-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: "LIVE", exact: true }).click();
    assert.equal(await page.locator("[data-game-id]").count(), 2);
    assert.match(
      await page.locator("main").innerText(),
      /Updated by @friday_fan/,
    );
    assert.equal(
      await page
        .locator(
          '[data-game-id="de-leon-at-hawley-2026-week-7"] .weekly-teams strong',
        )
        .allTextContents()
        .then((x) => x.join(",")),
      "0,0",
    );
    await page.screenshot({
      path: `${evidence}/live-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: "Completed", exact: true }).click();
    assert.match(await page.locator("main").innerText(), /Cancelled/);
    assert.match(await page.locator("main").innerText(), /Forfeit/);
    assert.equal(
      await page
        .locator(
          '[data-game-id="crawford-at-hubbard-2026-week-7"] .weekly-teams strong',
        )
        .allTextContents()
        .then((x) => x.join(",")),
      ",",
    );
    await page.screenshot({
      path: `${evidence}/completed-${width}.png`,
      fullPage: true,
    });
  }
  pass(
    "390/400/430/1280 layouts: followed dedupe, authoritative live, zero scores, completed and exceptional outcomes, no overflow",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(origin + "/games?week=7&mode=nearby");
  await settled(page);
  assert.equal(await page.evaluate(() => window.locationCalls), 0);
  await page.getByLabel("Or choose a school").selectOption("hawley");
  assert.ok((await page.locator("[data-game-id]").count()) > 0);
  assert.match(await page.locator("main").innerText(), /Nearest first/);
  assert.equal(await page.evaluate(() => window.locationCalls), 0);
  assert.ok(!page.url().includes("latitude"));
  await page.screenshot({ path: `${evidence}/nearby-390.png`, fullPage: true });
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  assert.equal(await page.evaluate(() => window.locationCalls), 1);
  assert.deepEqual(await page.evaluate(() => window.geoCallbacks[0].options), {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 0,
  });
  await page.getByRole("link", { name: "Week 8", exact: true }).click();
  await page.evaluate(() =>
    window.geoCallbacks[0].success({
      coords: { latitude: 32.6, longitude: -99.7, accuracy: 10 },
    }),
  );
  assert.match(
    await page.locator("main").innerText(),
    /Choose a location to find games/,
  );
  assert.ok(!page.url().includes("latitude"));
  await page.getByRole("link", { name: "Week 6", exact: true }).click();
  assert.match(
    await page.locator("main").innerText(),
    /Near Me is unavailable for Week 6/,
  );
  assert.equal(
    await page.getByRole("button", { name: "Use my location" }).isDisabled(),
    true,
  );
  await page.screenshot({
    path: `${evidence}/nearby-unavailable-390.png`,
    fullPage: true,
  });
  pass(
    "Nearby explicit permission, school fallback, stale callback cancellation, week gate, no coordinates in URL",
  );
  for (const [legacy, filter] of [
    ["final", "completed"],
    ["upcoming", "all"],
    ["district", "all"],
  ]) {
    await page.goto(origin + `/games?status=${legacy}`);
    await settled(page);
    assert.match(page.url(), /week=all/);
    assert.match(await page.locator("main").innerText(), /Legacy link scope/);
    if (filter === "completed")
      assert.equal(
        await page
          .locator('[data-game-id="comanche-at-millsap-2026-week-7"]')
          .count(),
        0,
      );
  }
  const response = await fetch(
    origin + "/scoreboard?week=7&q=Hawley&filter=live&latitude=32",
    { redirect: "manual" },
  );
  assert.equal(response.status, 308);
  const destination = response.headers.get("location");
  assert.match(destination, /intent=scores/);
  assert.ok(!destination.includes("latitude"));
  await page.goto(origin + "/scoreboard?week=7#live-now");
  await settled(page);
  assert.equal(
    await page
      .getByRole("link", { name: "LIVE", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  await page.getByRole("link", { name: "Upcoming", exact: true }).click();
  await page.goBack();
  assert.equal(
    await page
      .getByRole("link", { name: "LIVE", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  await page.goForward();
  assert.equal(
    await page
      .getByRole("link", { name: "Upcoming", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  pass(
    "308 compatibility, public parameter allowlist, fragments, history and legacy final/current/district semantics",
  );
  await page.goto(origin + "/games?week=7&filter=live");
  await settled(page);
  const first = page.locator('[data-game-id="de-leon-at-hawley-2026-week-7"]');
  await first.locator("summary").click();
  const detail = await first
    .getByRole("link", { name: "Game Center →" })
    .getAttribute("href");
  await page.goto(origin + detail);
  await page.getByRole("link", { name: "← Back to Games" }).click();
  await settled(page);
  assert.match(page.url(), /week=7/);
  assert.match(page.url(), /filter=live/);
  mode = "failure";
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
  assert.match(await first.innerText(), /Updated by @friday_fan/);
  assert.equal(await page.locator("[data-game-id]").count(), 2);
  await page.screenshot({
    path: `${evidence}/stale-error-390.png`,
    fullPage: true,
  });
  mode = "normal";
  rows[0] = {
    ...rows[0],
    status: "final",
    home_score: 14,
    away_score: 7,
    attribution_type: "verified",
    attribution_username: null,
  };
  await first.locator("summary").click();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page
    .getByRole("button", { name: "Apply updates", exact: true })
    .waitFor();
  assert.match(await first.innerText(), /Final · moved to Completed/);
  assert.equal(await first.locator("details").getAttribute("open"), "");
  assert.match(await first.locator(".weekly-teams").innerText(), /7/);
  await page
    .getByRole("button", { name: "Apply updates", exact: true })
    .click();
  assert.equal(await first.count(), 0);
  pass(
    "Game Center returns public filters; refresh failure retains attribution; live-to-final keeps row/actions until Apply updates",
  );
  rows[0] = {
    ...rows[0],
    status: "live",
    attribution_type: "publisher",
    attribution_username: "friday_fan",
  };
  await page.goto(origin + "/games?week=7&filter=live");
  await settled(page);
  await page.getByRole("button", { name: "Refresh", exact: true }).focus();
  assert.ok(
    await page
      .getByRole("button", { name: "Refresh", exact: true })
      .evaluate((e) => getComputedStyle(e).outlineStyle !== "none"),
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${evidence}/text-200-390.png`,
    fullPage: true,
  });
  assert.equal(errors.length, 0, errors.join("\n"));
  pass("Visible keyboard focus, 200% root text, no browser runtime errors");
  await c.close();
  c = await context({ javaScriptEnabled: false });
  page = await c.newPage();
  await page.goto(origin + "/games?week=7");
  assert.ok((await page.locator("[data-game-id]").count()) > 0);
  await page.getByRole("link", { name: "Completed", exact: true }).click();
  assert.match(page.url(), /filter=completed/);
  assert.match(await page.locator("main").innerText(), /Cancelled/);
  await c.close();
  pass("No-JavaScript SSR slate and status navigation");
  c = await context();
  await authenticated(c);
  page = await c.newPage();
  mode = "failure";
  await page.goto(origin + "/games?week=7");
  await settled(page);
  assert.match(
    await page.locator("main").innerText(),
    /Scheduled information and repository results remain available/,
  );
  assert.match(
    await page.locator("main").innerText(),
    /Your Teams could not be loaded/,
  );
  mode = "normal";
  await c.close();
  pass("Initial score and follow outage show independent fallback messages");
  assert.equal(writes, 0);
  pass("Synthetic read-only backend: zero writes");
  writeFileSync(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        results,
        scoreCalls,
        writes,
        fixture:
          "All scores/statuses are illustrative. Local synthetic Supabase only.",
      },
      null,
      2,
    ),
  );
  if (process.env.KEEP_FIXTURE === "1") {
    console.log("FIXTURE_READY");
    await new Promise(() => {});
  }
} finally {
  if (browser) await browser.close();
  if (app) app.kill("SIGTERM");
  api.close();
  writeFileSync(`${evidence}/server.log`, log);
}

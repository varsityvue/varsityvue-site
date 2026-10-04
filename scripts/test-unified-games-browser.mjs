import assert from "node:assert/strict";
import http from "node:http";
import { createHmac } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
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
    home_score: 107,
    away_score: 100,
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
  if (path.includes("school_follows")) {
    const school = new URL(path, "http://127.0.0.1").searchParams.get("school_slug");
    return send([{ school_slug: "de-leon" }, { school_slug: "hawley" }].filter(row => !school || school === `eq.${row.school_slug}`));
  }
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
      "127.0.0.1",
      "--port",
      "3019",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
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
async function chooseStatus(page, value) {
  const filters = page.locator(".weekly-filters");
  if ((await filters.getAttribute("open")) === null) await filters.locator("summary").click();
  await page.getByRole("combobox", {name:"Game status", exact:true}).selectOption(value);
  await page.getByRole("button", {name:"Apply filters", exact:true}).click();
}
async function settled(page) {
  try {
    await page.waitForFunction(() => {
      const q = new URLSearchParams(location.search);
      const active = document.querySelector('select[name="filter"]');
      return q.has("season") && (q.get("state") === "current" || active?.value === (q.get("filter") ?? "all"));
    });
  } catch (error) {
    console.error("HYDRATION FAILURE", await page.locator("body").innerText());
    await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true });
    throw error;
  }
}
// Inspect the controls and rendered text, not just document overflow.
async function assertActionLayout(page) {
  const failures = await page.locator("[data-game-id]").evaluateAll(cards => {
    const overlaps = (a,b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    return cards.flatMap(card => {
      const buttons = [card.querySelector(".weekly-share button"), card.querySelector(".weekly-actions summary")];
      const boxes = buttons.map(e => e.getBoundingClientRect());
      const problems = [];
      if (boxes.some(r => r.width < 44 || r.height < 44)) problems.push("target");
      if (overlaps(boxes[0],boxes[1])) problems.push("controls");
      for (const e of card.querySelectorAll(".weekly-teams span,.weekly-teams strong,.weekly-meta")) {
        if (boxes.some(r => overlaps(r,e.getBoundingClientRect()))) problems.push(e.textContent);
        if (e.scrollWidth > e.clientWidth + 1) problems.push("text overflow: " + e.textContent);
      }
      return problems.map(problem => ({id:card.dataset.gameId,problem}));
    });
  });
  assert.deepEqual(failures, [], "Actions must not collide with names/scores/venue or each other");
}
async function stressCardText(page) {
  await page.locator('[data-game-id="albany-at-stamford-2026-week-7"]').evaluate(card => {
    const names = card.querySelectorAll(".weekly-teams span");
    names[0].textContent = "Canyon West Plains High School Football";
    names[1].textContent = "Stephenville Yellow Jackets High School Football";
    card.querySelectorAll(".weekly-meta")[1].textContent = "Illustrative Extremely Long Community Memorial Football Stadium · Long Venue City, Texas";
  });
}
try {
  start();
  await ready();
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  let c = await context();
  await authenticated(c);
  let page = await c.newPage();
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("BROWSER RUNTIME ERROR", e.message);
  });
  for (const route of ["/games", "/scoreboard"]) {
  const label = route.slice(1);
  for (const width of [390, 400, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + route + "?week=7");
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
    if (width < 1024)
      assert.ok(
        await page.locator(".weekly-mobile-nav").evaluate((e) => {
          const r = e.getBoundingClientRect();
          return r.bottom <= innerHeight + 1 && r.top >= innerHeight - 100;
        }),
        "Mobile navigation must sit at the viewport bottom",
      );

    await page.screenshot({
      path: `${evidence}/${label}-weekly-${width}.png`,
      fullPage: true,
    });
    await chooseStatus(page, "live");
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
      path: `${evidence}/${label}-live-${width}.png`,
      fullPage: true,
    });
    await chooseStatus(page, "completed");
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
    const scoredFinal = page.locator('[data-game-id="albany-at-stamford-2026-week-7"]');
    assert.deepEqual(await scoredFinal.locator(".weekly-teams strong").allTextContents(), ["100","107"]);
    assert.ok(await scoredFinal.evaluate(e => {
      const share = e.querySelector(".weekly-share button").getBoundingClientRect();
      const actions = e.querySelector(".weekly-actions summary").getBoundingClientRect();
      return [...e.querySelectorAll(".weekly-teams strong")].every(score => score.getBoundingClientRect().right <= Math.min(share.left, actions.left));
    }), "Three-digit final scores must not intersect share or overflow actions");
    await page.screenshot({
      path: `${evidence}/${label}-completed-${width}.png`,
      fullPage: true,
    });
  }
    await page.goto(origin + route + "?week=7&view=current");
    await settled(page);
    assert.match(await page.locator("main").innerText(), /Legacy link scope/);
    await page.screenshot({ path: `${evidence}/${label}-current-1280.png`, fullPage: true });
    for (const width of [390, 400, 430, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + route + "?week=7&view=current");
      await settled(page);
      assert.match(await page.locator("main").innerText(), /Legacy link scope/);
      await page.screenshot({ path: `${evidence}/${label}-current-${width}.png`, fullPage: true });
      await page.goto(origin + route + "?week=7&mode=nearby");
      await settled(page);
      await page.getByLabel("Or choose a school").selectOption("hawley");
      assert.ok(await page.locator("[data-game-id]").count() > 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${evidence}/${label}-nearby-${width}.png`, fullPage: true });
      await page.goto(origin + route + "?week=7&filter=live");
      await settled(page);
      await page.evaluate(() => document.documentElement.style.fontSize = "200%");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await page.evaluate(() => ![document.documentElement, document.body, document.querySelector("main")].some(e => ["hidden", "clip"].includes(getComputedStyle(e).overflowX))));
      assert.ok(await page.locator('footer [aria-label="VarsityVue home"] h2').evaluate(e => {
        const style = getComputedStyle(e);
        return e.getBoundingClientRect().height <= parseFloat(style.lineHeight) * 2 + 1;
      }), "Enlarged footer brand must remain readable within two lines");
      await page.getByRole("button", { name: "Refresh scores", exact: true }).focus();
      assert.ok(await page.getByRole("button", { name: "Refresh scores", exact: true }).evaluate(e => getComputedStyle(e).outlineStyle !== "none"));
      await chooseStatus(page, "completed");
      assert.match(await page.locator("main").innerText(), /Cancelled/);
      assert.equal(new URL(page.url()).pathname, route);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width < 1024) {
        assert.ok(await page.locator(".weekly-mobile-nav").evaluate(e => {
          const r = e.getBoundingClientRect();
          return r.bottom <= innerHeight + 1 && [...e.querySelectorAll("a")].every(a => a.scrollWidth <= a.clientWidth && a.scrollHeight <= a.clientHeight);
        }));
      }
      await stressCardText(page);
      await assertActionLayout(page);
      await page.screenshot({ path: `${evidence}/${label}-text-200-${width}.png`, fullPage: true });
    }
    await page.goto(origin + route + "?week=7&filter=live");
    await settled(page);
    const row = page.locator('[data-game-id="de-leon-at-hawley-2026-week-7"]');
    await row.locator("summary").click();
    const detailHref = await row.getByRole("link", { name: "Game Center →" }).getAttribute("href");
    await page.goto(origin + detailHref);
    await page.getByRole("link", { name: "← Back to Games" }).click();
    await settled(page);
    assert.equal(new URL(page.url()).pathname, route);
    assert.match(page.url(), /week=7.*filter=live/);
    for (const [fragment, expected] of [["live-now", "live"], ["final-scores", "completed"], ["upcoming", "upcoming"], ["nearby-games", "nearby"]]) {
      await page.goto(origin + route + "?week=7#" + fragment);
      await settled(page);
      assert.equal(new URL(page.url()).pathname, route);
      assert.match(page.url(), expected === "nearby" ? /mode=nearby/ : new RegExp("filter=" + expected));
      assert.ok(page.url().endsWith("#all-matchups"));
    }
  }
  pass(
    "Both aliases: Current, Nearby, 200% text, 390/400/430/1280 layouts: followed dedupe, authoritative live, zero scores, completed and exceptional outcomes, no overflow",
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
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.match(await response.text(), /Games &amp; Scores/);
  await page.goto(origin + "/scoreboard?week=7#live-now");
  await settled(page);
  console.log("LEGACY FRAGMENT URL", page.url());
  assert.equal(await page.locator('select[name="filter"]').inputValue(), "live");
  await chooseStatus(page, "upcoming");
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('select[name="filter"]')?.value === "live");
  await page.goForward();
  await page.waitForFunction(() => document.querySelector('select[name="filter"]')?.value === "upcoming");
  pass(
    "Direct 200 aliases, fragments, history and legacy final/current/district semantics",
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
  await page.getByRole("button", { name: "Refresh scores", exact: true }).click();
  await page.getByRole("button", { name: "Retry score refresh", exact: true }).waitFor();
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
  await page.getByRole("button", { name: "Retry score refresh", exact: true }).click();
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
  await page.getByRole("button", { name: "Refresh scores", exact: true }).focus();
  assert.ok(
    await page
      .getByRole("button", { name: "Refresh scores", exact: true })
      .evaluate((e) => getComputedStyle(e).outlineStyle !== "none"),
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await page.screenshot({
    path: `${evidence}/text-200-390.png`,
    fullPage: true,
  });
  console.log(
    "ENLARGED LAYOUT",
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.right > innerWidth + 1 &&
            r.width > 0 &&
            getComputedStyle(e).position !== "absolute" &&
            !e.closest(".weekly-tabs,.weekly-status-filters")
          );
        })
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          text: e.textContent?.slice(0, 60),
          right: e.getBoundingClientRect().right,
        }))
        .slice(0, 12),
    })),
  );
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

  const timed = await c.newPage();
  let refreshRequests = 0;
  timed.on("request", (r) => {
    if (r.url().endsWith("/api/games/snapshot")) refreshRequests++;
  });
  await timed.clock.install();
  await timed.goto(origin + "/games?week=7&filter=live");
  await settled(timed);
  let nextResponse = timed.waitForResponse((r) =>
    r.url().endsWith("/api/games/snapshot"),
  );
  await timed.clock.runFor(30000);
  await nextResponse;
  assert.equal(refreshRequests, 1);
  await timed.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenRequests = refreshRequests;
  await timed.clock.runFor(30000);
  assert.equal(refreshRequests, hiddenRequests);
  nextResponse = timed.waitForResponse((r) =>
    r.url().endsWith("/api/games/snapshot"),
  );
  await timed.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await nextResponse;
  await c.setOffline(true);
  await timed.getByText(/Offline · refresh paused/).waitFor();
  const offlineRequests = refreshRequests;
  await timed.clock.runFor(30000);
  assert.equal(refreshRequests, offlineRequests);
  nextResponse = timed.waitForResponse((r) =>
    r.url().endsWith("/api/games/snapshot"),
  );
  await c.setOffline(false);
  await nextResponse;
  const snapshot = await fetch(origin + "/api/games/snapshot").then((r) =>
    r.json(),
  );
  assert.ok(
    !JSON.stringify(snapshot).match(
      /sourceReferences|verifiedAt|source_submission_id|updated_by|applicant_id|submitted_by/,
    ),
  );
  let release;
  const delayed = new Promise((r) => (release = r));
  let started;
  const pendingRefresh = new Promise((r) => (started = r));
  await timed.route("**/api/games/snapshot", async (route) => {
    started();
    await delayed;
    try {
      await route.fulfill({
        json: {
          ...snapshot,
          games: snapshot.games.map((g) => ({
            ...g,
            homeScore: 999,
            awayScore: 999,
          })),
        },
      });
    } catch {
      /* Request was cancelled by the week change. */
    }
  });
  await timed.getByRole("button", { name: "Refresh scores", exact: true }).click();
  await pendingRefresh;
  await timed.getByRole("link", { name: "Week 8", exact: true }).click();
  release();
  await settled(timed);
  assert.equal(await timed.locator("[data-game-id]").count(), 0);
  assert.match(timed.url(), /week=8/);
  await timed.close();
  pass(
    "30-second foreground cadence, hidden/offline pause and resume, public snapshot allowlist, old refresh cancelled on week change",
  );
  await c.close();
  c = await context({ javaScriptEnabled: false });
  for (const route of ["/games", "/scoreboard"]) {
  page = await c.newPage();
  await page.goto(origin + route + "?week=7");
  assert.ok((await page.locator("[data-game-id]").count()) > 0);
  await chooseStatus(page, "completed");
  assert.match(page.url(), /filter=completed/);
  assert.match(await page.locator("main").innerText(), /Cancelled/);
  assert.equal(new URL(page.url()).pathname, route);
  }
  for (const route of ["/games", "/scoreboard"]) {
    page = await c.newPage();
    const ids = () => page.locator("[data-game-id]").evaluateAll(es => es.map(e => e.dataset.gameId).sort());
    for (const [legacy, target, expected, excluded] of [
      ["state=current", "completed", "albany-at-stamford-2026-week-7", "rio-vista-at-tolar-2026-week-7"],
      ["result=verified&filter=completed", "upcoming", "rio-vista-at-tolar-2026-week-7", "albany-at-stamford-2026-week-7"],
      ["view=current", "completed", "albany-at-stamford-2026-week-7", "rio-vista-at-tolar-2026-week-7"],
      ["status=final", "upcoming", "rio-vista-at-tolar-2026-week-7", "albany-at-stamford-2026-week-7"],
    ]) {
      await page.goto(origin + route + "?season=2026&week=7&filter=" + target);
      const ordinary = await ids();
      assert.ok(ordinary.includes(expected)); assert.ok(!ordinary.includes(excluded));
      await page.goto(origin + route + "?season=2026&week=7&" + legacy);
      await chooseStatus(page,target);
      const url = new URL(page.url());
      assert.equal(url.searchParams.get("state"),null);
      assert.equal(url.searchParams.get("result"),null);
      assert.deepEqual(await ids(), ordinary, "Legacy transition must select the same games as the ordinary status URL");
    }
    await authenticated(c);
    await page.goto(origin + route + "?season=2026&week=7&state=current&q=Hawley&following=1&classification=2A+Division+I&district=1&mode=nearby&radius=100");
    // School centers are memory-only: SSR must retain public Nearby context without inventing a location.
    await chooseStatus(page,"completed");
    const q = new URL(page.url()).searchParams;
    for (const [key,value] of Object.entries({season:"2026",week:"7",q:"Hawley",following:"1",classification:"2A Division I",district:"1",mode:"nearby",radius:"100"})) assert.equal(q.get(key),value);
    assert.match(await page.locator("main").innerText(),/Choose a location to find games/);
    await page.close();
  }
  await c.close();
  pass("F2: Both aliases without JavaScript: legacy current/verified transitions match expected ordinary games; unrelated public context preserved");
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
  const sharing = await context();
  await sharing.addInitScript(() => {
    window.shared = []; window.copied = []; window.shareMode = "native"; window.clipboardMode = "success";
    Object.defineProperty(navigator, "share", {configurable:true, value: async data => {
      window.shared.push(data);
      if (window.shareMode === "cancel") throw new DOMException("Cancelled", "AbortError");
      if (window.shareMode === "copy") throw new Error("Unavailable");
      if (window.shareMode === "deferred") return new Promise((resolve,reject) => {window.resolveShare=resolve;window.rejectShare=reject;});
    }});
    Object.defineProperty(navigator, "clipboard", {configurable:true, value:{writeText:async data => {
      window.copied.push(data);
      if (window.clipboardMode === "reject") throw new Error("Clipboard unavailable");
      if (window.clipboardMode === "deferred") return new Promise(resolve => {window.resolveCopy=resolve;});
    }}});
  });
  const sharePage = await sharing.newPage();
  sharePage.on("pageerror", e => errors.push(e.message));
  for (const width of [390,400,430,1280]) {
    await sharePage.setViewportSize({width,height:900});
    for (const slug of ["hamilton","santo","de-leon","stephenville"]) {
      await sharePage.goto(origin + "/schools/" + slug);
      await sharePage.getByRole("button",{name:/^Share /}).first().waitFor();
      assert.equal(await sharePage.getByText("Follow this team to see its games and coverage first. Email alerts are a separate choice in Account.").count(),0);
      assert.ok(await sharePage.getByRole("button",{name:/^Follow /}).count());
      const button = sharePage.getByRole("button",{name:/^Share /}).first();
      const box = await button.boundingBox(); assert.ok(box.width >=44 && box.height >=44);
      await button.click();
      assert.equal(await sharePage.evaluate(() => window.shared.at(-1).url), "https://varsityvue.com/schools/"+slug);
      assert.equal(await sharePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
      await sharePage.screenshot({path:`${evidence}/school-${slug}-${width}.png`,fullPage:true});
      await sharePage.evaluate(() => document.documentElement.style.fontSize = "200%");
      assert.ok(await sharePage.locator("h1").evaluate(e => e.scrollWidth <= e.clientWidth + 1), "Enlarged school name must wrap inside its column");
      assert.ok(await sharePage.locator("h1").evaluate(e => {
        const h=e.getBoundingClientRect(), section=e.closest("section");
        const controls=[...section.querySelectorAll("button")].map(b=>b.getBoundingClientRect());
        return controls.every(b => h.left >= b.right || h.right <= b.left || h.top >= b.bottom || h.bottom <= b.top);
      }), "School title must not collide with Follow/Share");
      await sharePage.screenshot({path:`${evidence}/school-${slug}-text-200-${width}.png`,fullPage:true});
      assert.ok(await sharePage.locator("h1").evaluate(e => {
        const hero=e.closest("section"), bounds=hero.getBoundingClientRect();
        return [...hero.querySelectorAll("button")].every(control => {
          const b=control.getBoundingClientRect();
          return b.left >= bounds.left && b.right <= bounds.right && b.width >=44 && b.height >=44;
        });
      }), "Enlarged hero controls must remain accessible inside the hero");
      console.log("SCHOOL TEXT 200",slug,width,await sharePage.evaluate(() => [...document.querySelectorAll("body *")].filter(e => {const b=e.getBoundingClientRect();return b.right > innerWidth+1 && b.width && getComputedStyle(e).position !== "absolute";}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,60)}))));
    }
    await sharePage.goto(origin+"/schools");
    await sharePage.screenshot({path:`${evidence}/directory-${width}.png`,fullPage:true});
    await sharePage.goto(origin+"/games?week=7"); await settled(sharePage);
    assert.equal(await sharePage.locator(".weekly-status-filters").count(),0);
    assert.equal(await sharePage.getByRole("button",{name:"Share",exact:true}).count(),0);
    for (const filter of ["all","live","completed","upcoming"]) {
      await chooseStatus(sharePage,filter);
      assert.equal(await sharePage.locator('select[name="filter"]').inputValue(),filter);
      if (await sharePage.locator("[data-game-id]").count()) {
        const game = sharePage.locator("[data-game-id]").first();
        const id = await game.getAttribute("data-game-id");
        await game.getByRole("button",{name:/^Share /}).click();
        const data = await sharePage.evaluate(() => window.shared.at(-1));
        assert.equal(data.url, "https://varsityvue.com/games/"+encodeURIComponent(id));
        assert.ok(!data.url.includes("return="));
      }
    }
    await sharePage.screenshot({path:`${evidence}/sharing-${width}.png`,fullPage:true});
  }
  await sharePage.goto(origin+"/games?week=7&filter=live"); await settled(sharePage);
  const shareButton = sharePage.locator("[data-game-id]").first().getByRole("button",{name:/^Share /});
  await sharePage.evaluate(() => window.shareMode="cancel"); await shareButton.click();
  assert.equal(await sharePage.evaluate(() => window.copied.length),0);
  await sharePage.evaluate(() => window.shareMode="copy"); await shareButton.click();
  await sharePage.getByRole("status").filter({hasText:"Link copied"}).waitFor();
  assert.match(await sharePage.evaluate(() => window.copied.at(-1)),/https:\/\/varsityvue.com\/games\//);
  await sharePage.evaluate(() => Object.defineProperty(navigator,"share",{value:undefined})); await shareButton.click();
  assert.equal(await sharePage.evaluate(() => window.copied.length),2);
  await sharePage.clock.install();
  await sharePage.evaluate(() => {
    // Restore a deferred native mock after the no-native fallback test.
    Object.defineProperty(navigator,"share",{value:data => {window.shared.push(data);return new Promise((resolve,reject) => {window.resolveShare=resolve;window.rejectShare=reject;});}});
  });
  const attempts = await sharePage.evaluate(() => window.shared.length);
  // Two activations in the same browser task exercise the synchronous guard.
  await shareButton.evaluate(button => {button.click();button.click();button.dispatchEvent(new MouseEvent("click",{bubbles:true}));});
  assert.equal(await sharePage.evaluate(() => window.shared.length),attempts+1);
  assert.equal(await sharePage.evaluate(() => window.copied.length),2);
  assert.equal(await shareButton.isDisabled(),true);
  await sharePage.evaluate(() => window.resolveShare());
  await sharePage.waitForFunction(() => !document.querySelector(".weekly-share button").disabled);
  await shareButton.click();
  await sharePage.evaluate(() => window.rejectShare(new DOMException("Cancelled","AbortError")));
  await sharePage.waitForFunction(() => !document.querySelector(".weekly-share button").disabled);
  assert.equal(await sharePage.evaluate(() => window.copied.length),2);
  await shareButton.click();
  await sharePage.evaluate(() => {window.clipboardMode="deferred"; window.rejectShare(new Error("Unavailable"));});
  await sharePage.waitForFunction(() => typeof window.resolveCopy === "function");
  await shareButton.evaluate(button => {button.click();button.dispatchEvent(new MouseEvent("click",{bubbles:true}));});
  assert.equal(await sharePage.evaluate(() => window.shared.length),attempts+3);
  assert.equal(await sharePage.evaluate(() => window.copied.length),3);
  await sharePage.evaluate(() => window.resolveCopy());
  await sharePage.waitForFunction(() => !document.querySelector(".weekly-share button").disabled);
  pass("F3: Deferred native and clipboard promises guard repeated activation; success/cancel/rejection release guard; cancel never copies");
  await sharePage.evaluate(() => {Object.defineProperty(navigator,"share",{value:undefined});window.clipboardMode="success";});
  const feedback = sharePage.getByRole("status").filter({hasText:"Link copied"});
  await sharePage.clock.runFor(3000);
  await shareButton.click();
  await sharePage.clock.runFor(1001);
  assert.equal(await feedback.count(),1,"Older feedback timeout cannot dismiss newer feedback");
  const secondButton = sharePage.locator("[data-game-id]").nth(1).getByRole("button",{name:/^Share /});
  await secondButton.click();
  assert.equal(await feedback.count(),2);
  assert.ok(await feedback.evaluateAll(es => {
    const [a,b] = es.map(e=>e.getBoundingClientRect());
    return a.bottom <= b.top || b.bottom <= a.top || a.right <= b.left || b.right <= a.left;
  }),"Multiple copied messages must not occupy identical fixed coordinates");
  await assertActionLayout(sharePage);
  await sharePage.screenshot({path:`${evidence}/copied-multiple-cards.png`,fullPage:true});
  await sharePage.clock.runFor(4001);
  assert.equal(await feedback.count(),0,"Copied feedback expires after four seconds");
  await shareButton.click();
  await sharePage.getByRole("link",{name:"Week 8",exact:true}).click();
  await sharePage.clock.runFor(5000);
  assert.equal(await feedback.count(),0,"Feedback and timer do not survive card unmount");
  pass("F4: Local live status feedback, multiple cards, four-second expiry, stale timeout protection and navigation cleanup");
  // Capture the external-protocol attempt; this does not launch a physical email client.
  await sharePage.goto(origin+"/games?week=7&filter=live");await settled(sharePage);
  await sharePage.evaluate(() => {Object.defineProperty(navigator,"share",{value:undefined});window.clipboardMode="reject";});
  const protocol = await sharing.newCDPSession(sharePage);
  await protocol.send("Page.enable");
  const emailAttempt = new Promise(resolve => protocol.on("Page.frameRequestedNavigation",event => {
    if (event.url.startsWith("mailto:")) resolve(event.url);
  }));
  await sharePage.locator("[data-game-id]").first().getByRole("button",{name:/^Share /}).click();
  const email = await emailAttempt;
  assert.match(decodeURIComponent(email),/https:\/\/varsityvue.com\/games\//);
  assert.match(email,/subject=/); assert.match(email,/body=/);
  await protocol.detach();
  pass("Email fallback emits a canonical mailto draft URL (isolated browser observation only)");
  await authenticated(sharing);
  await sharePage.goto(origin+"/schools/de-leon");
  await sharePage.getByRole("button",{name:/Unfollow/}).waitFor();
  assert.ok(await sharePage.getByRole("status").filter({hasText:"Following"}).count());
  await sharePage.goto(origin+"/schools/hamilton"); await sharePage.getByRole("button",{name:/^Follow /}).waitFor();
  await sharePage.goto(origin+"/games?week=7&q=no-such-team"); await settled(sharePage);
  assert.equal(await sharePage.locator("[data-game-id]").count(),0);
  assert.equal(await sharePage.locator(".weekly-follow-prompt").count(),0);
  await sharePage.goto(origin+"/games?week=7&q=no-such-team&following=1"); await settled(sharePage);
  assert.ok(await sharePage.locator(".weekly-follow-prompt").count());
  assert.deepEqual(errors,[]);
  await sharing.close();
  pass("School heroes/directory 390/430/1280; follow states; canonical native/cancel/clipboard sharing; status panel and followed empty scope");
  assert.equal(writes, 0);
  pass("Synthetic read-only backend: zero writes");
  writeFileSync(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        head: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(),
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {encoding: "utf8"}).trim(),
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
  if (app) {
    try {
      if (process.platform !== "win32") process.kill(-app.pid, "SIGTERM");
      else app.kill("SIGTERM");
    } catch {
      /* Only this fixture process group is stopped. */
    }
  }
  api.closeAllConnections();
  api.close();
  writeFileSync(`${evidence}/server.log`, log);
}

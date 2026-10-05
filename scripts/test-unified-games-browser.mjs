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
let telemetryRequests = 0;
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
    return send(mode === "schedule" ? [] : rows);
  }
  if (path.includes("pickem_weeks")) return send({id:"fixture-week", title:"Week 6 Pick ’Em",season:2026,week:6,status:"open",closes_at:"2026-10-03T00:00:01Z"});
  if (path.includes("pickem_games")) return send({lock_at:"2026-10-03T00:00:00Z"});
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
        NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED: "false",
        COVERAGE_DEMAND_INGESTION_ENABLED: "false",
        COVERAGE_DEMAND_MONITOR_ENABLED: "false",
        COVERAGE_DEMAND_FLEET_ENABLED: "false",
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
  c.on("page", page => page.on("request", request => {
    if (new URL(request.url()).pathname === "/api/coverage-demand") telemetryRequests++;
  }));
  await c.addInitScript(() => {
    localStorage.setItem("coverage_measurement_v2", "disabled");
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
      return q.has("season") && active?.value === (q.get("filter") ?? "all");
    });
  } catch (error) {
    console.error("HYDRATION FAILURE", await page.locator("body").innerText());
    await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true });
    throw error;
  }
}
async function nearMePresentation(page, route) {
  const label = route.slice(1);
  for (const width of [390, 430, 1280]) {
    await page.setViewportSize({width, height:900});
    for (const week of [6, 7, 8, 9, 10, 11]) {
      await page.goto(origin + route + `?season=2026&week=${week}&mode=nearby`);
      await settled(page);
      await page.waitForFunction(()=>document.querySelector('.weekly-measurement [role=status]')?.textContent.includes('Preference: don’t share'));
      assert.match(await page.locator('.weekly-measurement').innerText(), /Collection is currently off.*Preference: don’t share/);
      assert.equal(await page.locator('.weekly-measurement').getByRole('link',{name:'Privacy',exact:true}).getAttribute('href'), '/privacy#regional-measurement');
      assert.equal(await page.locator('.weekly-empty').count(),0);
      assert.doesNotMatch(await page.locator('.weekly-refresh').innerText(), /0 games/);
      if ([6,7].includes(week)) await page.screenshot({path:`${evidence}/near-me-${week===6?'unavailable':'missing'}-${label}-${width}.png`,fullPage:true});
      if ([7,8,9].includes(week)) {
        assert.equal(await page.locator('.weekly-location').count(),1);
        assert.equal(await page.locator('.weekly-nearby-state').count(),0);
      } else {
        assert.equal(await page.locator('.weekly-location').count(),0);
        assert.equal(await page.locator('.weekly-nearby-state').count(),1);
        assert.equal(await page.getByRole('button',{name:'Use my location',exact:true}).count(),0);
      }
    }
    await page.goto(origin + route + '?season=2026&week=7&mode=nearby&q=NoSuchSchool');
    await settled(page);
    await page.getByLabel('Or choose a school').selectOption('de-leon');
    assert.equal(await page.locator('.weekly-empty').count(),1);
    await page.getByRole('button',{name:'Review Filters',exact:true}).click();
    assert.equal(await page.locator('.weekly-filters summary').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('#weekly-search').inputValue(),'NoSuchSchool');
    await page.locator('.weekly-filters summary').click();
    await page.screenshot({path:`${evidence}/near-me-empty-${label}-${width}.png`,fullPage:true});
    await page.locator('#weekly-search').fill('');await page.getByRole('button',{name:'Search',exact:true}).click();
    assert.equal(await page.getByLabel('Or choose a school').inputValue(),'de-leon');
    const ids = await page.locator('[data-game-id]').evaluateAll(es=>es.map(e=>e.dataset.gameId));
    assert.ok(ids.length > 0);
    await page.route('**/api/games/snapshot**',r=>r.fulfill({status:503,body:'{}'}));
    await page.getByRole('button',{name:'Refresh scores',exact:true}).click();
    await page.getByRole('button',{name:'Retry score refresh',exact:true}).waitFor();
    assert.deepEqual(await page.locator('[data-game-id]').evaluateAll(es=>es.map(e=>e.dataset.gameId)),ids);
    assert.equal(await page.getByLabel('Or choose a school').inputValue(),'de-leon');
    assert.match(await page.locator('main').innerText(),/Last available results remain/);
    await page.unroute('**/api/games/snapshot**');
    await page.goto(origin + route + '?season=2026&week=7&mode=nearby');await settled(page);
    // Enabled preference is an isolated storage fixture, not hosted consent or telemetry.
    await page.locator('.weekly-measurement summary').click();
    await page.getByRole('button',{name:'Allow regional measurement',exact:true}).click();
    await page.locator('.weekly-measurement summary').click();
    await page.waitForFunction(()=>document.querySelector('.weekly-measurement [role=status]')?.textContent.includes('Preference: allow regional sharing'));
    assert.match(await page.locator('.weekly-measurement').innerText(), /Collection is currently off.*Preference: allow regional sharing/);
    assert.equal(await page.locator('.weekly-measurement details').getAttribute('open'),null);
    const withdraw = page.getByRole('button',{name:'Don’t share regional usage',exact:true});
    assert.equal(await withdraw.isVisible(),true);await withdraw.focus();await page.keyboard.press('Enter');
    assert.match(await page.locator('.weekly-measurement').innerText(),/Preference: don’t share/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('coverage_measurement_v2')),'disabled');
    assert.equal(await page.locator('.weekly-measurement summary').evaluate(e=>e===document.activeElement),true);
    await page.getByLabel('Or choose a school').selectOption('de-leon');
    await page.screenshot({path:`${evidence}/near-me-compact-${label}-${width}.png`,fullPage:true});
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    await page.locator('.weekly-measurement summary').click();
    assert.equal(await page.getByRole('button',{name:'Allow regional measurement',exact:true}).isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    await page.screenshot({path:`${evidence}/near-me-text-200-${label}-${width}.png`,fullPage:true});
  }
  pass(`${route}: concise gated/missing/empty states; privacy, immediate withdrawal, dormant preference, keyboard, 390/430/1280 and 200% text; failed refresh retains center/results`);
}

async function statusRegressions(page, route, noJavaScript = false) {
  const label = route.slice(1);
  const ids = () => page.locator("[data-game-id]").evaluateAll(es => es.map(e => e.dataset.gameId).sort());
  const status = page.locator('select[name="filter"]');
  const scopes = [
    ["result=verified", "verified finals only", false, true],
    ["state=current", "current and unresolved games", true, false],
    ["state=current&result=verified", "verified finals only + current and unresolved games", true, true],
    ["status=final", "verified finals only", false, true],
    ["view=current&status=final", "current and unresolved games", true, false],
    ["status=upcoming", "current and unresolved games", true, false],
    ["status=district", "current and unresolved games", true, false],
    ["view=completed&state=current&result=verified", "verified finals only + current and unresolved games", true, true],
  ];
  for (const [legacy, text, current, verified] of scopes) {
    await page.goto(origin + route + "?season=2026&week=7&" + legacy);
    if (!noJavaScript) await settled(page);
    assert.match(await status.locator("option:checked").textContent(), new RegExp(text.replaceAll("+", "\\+")));
    assert.match(await page.locator(".weekly-filters summary").getAttribute("aria-label"), /active/);
    const original = await ids();
    if (current) assert.ok(!original.includes("albany-at-stamford-2026-week-7"));
    if (verified) assert.ok(!original.includes("comanche-at-millsap-2026-week-7"));
    if (current && verified) assert.deepEqual(original, []);
    // Merely applying the panel must preserve the selected exact legacy scope.
    await chooseStatus(page, await status.inputValue());
    if (!noJavaScript) await settled(page);
    assert.deepEqual(await ids(), original);
    const retained = new URL(page.url()).searchParams;
    assert.equal(retained.get("filter").includes("-current"), current);
    assert.equal(retained.get("filter").includes("-verified"), verified);
    for (const target of ["all", "upcoming", "completed"]) {
      await page.goto(origin + route + "?season=2026&week=7&" + legacy);
      if (!noJavaScript) await settled(page);
      await chooseStatus(page, target);
      if (!noJavaScript) await settled(page);
      assert.equal(await status.inputValue(), target);
      if (!noJavaScript) {
        const q = new URL(page.url()).searchParams;
        assert.equal(q.has("state"), false); assert.equal(q.has("result"), false);
      }
      assert.equal(await page.getByText(/Legacy link scope/).count(), 0);
      const actual = await ids();
      await page.goto(origin + route + "?season=2026&week=7&filter=" + target + (legacy === "status=district" ? "&district=1" : ""));
      if (!noJavaScript) await settled(page);
      assert.deepEqual(actual, await ids(), `${route}: ${legacy} -> ${target}`);
    }
  }
  for (const target of ["all", "live", "upcoming", "completed"]) {
    await page.goto(origin + route + "?season=2026&week=7&filter=" + target + "&state=current&result=verified&status=final&view=current");
    if (!noJavaScript) await settled(page);
    assert.equal(await status.inputValue(), target);
    assert.equal(await page.getByText(/Legacy link scope/).count(), 0);
    const actual = await ids();
    await page.goto(origin + route + "?season=2026&week=7&filter=" + target);
    if (!noJavaScript) await settled(page);
    assert.deepEqual(actual, await ids());
  }
  // Preserve non-status refinements even when a native GET retains contradictory hidden keys.
  const refinements = { q: "Hawley", classification: "2A Division I", district: "1", following: "1", mode: "nearby", radius: "100" };
  await page.goto(origin + route + "?season=2026&week=7&state=current&" + new URLSearchParams(refinements));
  if (!noJavaScript) {
    await settled(page);
    await page.getByLabel("Or choose a school").selectOption("de-leon");
  }
  await chooseStatus(page, "all");
  if (!noJavaScript) await settled(page);
  const q = new URL(page.url()).searchParams;
  for (const [key, value] of Object.entries(refinements)) assert.equal(q.get(key), value);
  assert.equal(new URL(page.url()).pathname, route);
  if (!noJavaScript) {
    assert.equal(await page.getByLabel("Or choose a school").inputValue(), "de-leon");
    assert.deepEqual(await ids(), ["de-leon-at-hawley-2026-week-7"]);
  }
  await page.screenshot({ path: `${evidence}/${label}-status-refinements-${noJavaScript ? "no-js" : "js"}.png`, fullPage: true });
  pass(`${label}: ${noJavaScript ? "native GET" : "hydrated"} legacy scope matrix, exact intersections, explicit status precedence and retained refinements`);
}
async function nearbyStatusRegression(page, route) {
  const label = route.slice(1);
  mode = "schedule";
  // Real catalog, no dynamic score overrides: reproduce both the clean and restricted sequences.
  for (const legacy of [false, true]) {
    await page.goto(origin + route + "?season=2026&week=6&mode=nearby" + (legacy ? "&result=verified" : ""));
    await settled(page);
    assert.equal(await page.getByRole("button", { name: "Use my location", exact: true }).count(),0);
    await page.getByRole("link", { name: "Week 7", exact: true }).click();
    await page.getByLabel("Or choose a school").selectOption("de-leon");
    assert.equal(await page.locator("[data-game-id]").count(), legacy ? 0 : 7);
    if (legacy) {
      await page.locator(".weekly-filters summary").click();
      assert.equal(await page.locator('select[name="filter"]').inputValue(), "legacy-all-verified");
      assert.match(await page.locator(".weekly-filters summary").getAttribute("aria-label"), /active/);
      await page.screenshot({ path: `${evidence}/${label}-de-leon-verified-empty.png`, fullPage: true });
      await chooseStatus(page, "legacy-all-verified");
      assert.equal(await page.locator("[data-game-id]").count(), 0);
      await chooseStatus(page, "all");
      assert.equal(await page.locator("[data-game-id]").count(), 7);
      assert.equal(await page.getByLabel("Or choose a school").inputValue(), "de-leon");
    }
  }
  const before = await page.locator(".weekly-refresh p").innerText();
  mode = "failure";
  await page.getByRole("button", { name: "Refresh scores", exact: true }).click();
  await page.getByRole("button", { name: "Retry score refresh", exact: true }).waitFor();
  assert.equal(await page.locator("[data-game-id]").count(), 7);
  assert.equal(await page.locator(".weekly-refresh p").innerText(), before);
  assert.equal(await page.getByLabel("Or choose a school").inputValue(), "de-leon");
  assert.match(await page.locator("main").innerText(), /Live scores are unavailable/);
  await page.screenshot({ path: `${evidence}/${label}-de-leon-refresh-failure.png`, fullPage: true });
  mode = "schedule";
  await chooseStatus(page, "upcoming");
  assert.equal(await page.locator("[data-game-id]").count(), 7);
  await chooseStatus(page, "completed");
  assert.equal(await page.locator("[data-game-id]").count(), 0);
  assert.equal(await page.getByLabel("Or choose a school").inputValue(), "de-leon");
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('select[name="filter"]')?.value === "upcoming");
  // History deliberately clears precise memory-only centers, as before this correction.
  assert.equal(await page.locator("[data-game-id]").count(), 0);
  await page.getByLabel("Or choose a school").selectOption("de-leon");
  assert.equal(await page.locator("[data-game-id]").count(), 7);
  await page.goForward();
  await page.waitForFunction(() => document.querySelector('select[name="filter"]')?.value === "completed");
  assert.equal(await page.locator("[data-game-id]").count(), 0);
  await page.goto(origin + route + "?season=2026&week=7&mode=nearby&state=current");
  await settled(page);
  await page.getByLabel("Or choose a school").selectOption("de-leon");
  const card = page.locator("[data-game-id]").first();
  await card.locator("summary").click();
  const href = await card.getByRole("link", { name: "Game Center →", exact: true }).getAttribute("href");
  const returnUrl = new URL(href, origin).searchParams.get("return");
  assert.equal(new URL(returnUrl, origin).pathname, route);
  assert.match(returnUrl, /filter=legacy-all-current/); assert.match(returnUrl, /state=current/);
  assert.ok(!/latitude|longitude/.test(returnUrl));
  await page.goto(origin + href);
  await page.getByRole("link", { name: "← Back to Games", exact: true }).click();
  await settled(page);
  assert.equal(await page.locator('select[name="filter"]').inputValue(), "legacy-all-current");
  assert.equal(await page.locator("[data-game-id]").count(), 0);
  assert.equal(await page.evaluate(() => window.locationCalls), 0);
  pass(`${label}: clean seven-game and legacy-zero sequence; explicit statuses preserve center; failed refresh retains seven rows/timestamp; history and detail returns clear center only`);
  mode = "normal";
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
async function refinementRegressions(page, route) {
  const label = route.slice(1);
  const unknown = 'Unknown fixture classification';
  const params = new URLSearchParams({season:'2026',week:'7',filter:'legacy-completed-current-verified',q:'Hawley',classification:unknown,district:'1',following:'1',mode:'nearby',radius:'100'});
  const link = origin + route + '?' + params;
  for (const width of [390,400,430,1280]) {
    await page.setViewportSize({width,height:900});
    await page.goto(link); await settled(page);
    await page.getByLabel('Or choose a school').selectOption('de-leon');
    assert.match(await page.locator('.weekly-filters summary').getAttribute('aria-label'), /8 active refinements/);
    await page.locator('.weekly-filters summary').click();
    assert.equal(await page.locator('select[name="classification"]').inputValue(),unknown);
    const before = new URL(page.url()).search;
    await page.getByRole('button',{name:'Apply filters',exact:true}).click();
    assert.equal(new URL(page.url()).search,before);
    assert.equal(await page.getByLabel('Or choose a school').inputValue(),'de-leon');
    for (const zoom of ['100%','200%']) {
      await page.evaluate(value=>document.documentElement.style.fontSize=value,zoom);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true, `${route} ${width} ${zoom}`);
    }
    await page.screenshot({path:`${evidence}/${label}-refinements-${width}.png`,fullPage:true});
    await page.evaluate(()=>document.documentElement.style.fontSize='100%');
  }
  const clears = [
    ['Search: Hawley','q'],['Completed','filter'],['Current and unresolved games','current'],['Verified finals only','verified'],
    [`Classification: ${unknown}`,'classification'],['District games only','district'],['Following only','following'],['Radius: 100 miles','radius']
  ];
  for (const [name,key] of clears) {
    await page.goto(link); await settled(page);
    await page.getByLabel('Or choose a school').selectOption('de-leon');
    const before = Object.fromEntries(new URL(page.url()).searchParams);
    const clear = page.getByRole('link',{name:`Clear ${name}`,exact:true});
    await clear.focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('.weekly-filters summary').getAttribute('aria-label'),/7 active refinements/);
    assert.equal(await page.locator('.weekly-filters summary').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.getByLabel('Or choose a school').inputValue(),'de-leon');
    const after = new URL(page.url()).searchParams;
    for (const field of ['q','classification','district','following','radius']) if(field !== key) assert.equal(after.get(field),before[field]);
    if(key !== 'current') assert.equal(after.get('state'),'current');
    if(key !== 'verified') assert.equal(after.get('result'),'verified');
    if(route === '/scoreboard') assert.equal(after.get('intent'),'scores');
    await page.goBack(); await settled(page);
    assert.match(await page.locator('.weekly-filters summary').getAttribute('aria-label'),/8 active refinements/);
    assert.equal(await page.locator('[data-game-id]').count(),0);
    await page.goForward(); await settled(page);
    assert.match(await page.locator('.weekly-filters summary').getAttribute('aria-label'),/7 active refinements/);
    const shared = page.url(); await page.goto(shared); await settled(page);
    assert.equal(page.url(),shared);
  }
  await page.goto(origin+route+'?season=2026&week=7&result=current'); await settled(page);
  assert.equal(await page.locator('select[name="filter"]').inputValue(),'all');
  assert.equal(await page.getByRole('navigation',{name:'Applied refinements'}).count(),0);
  await page.goto(origin+route+'?season=2026&week=7&q=nonexistent-fixture'); await settled(page);
  assert.equal(await page.getByRole('heading',{name:'No games match these filters',exact:true}).count(),1);
  assert.match(await page.locator('.weekly-refresh').innerText(),/0 games/);
  mode='failure';
  for (const nearby of [false,true]) {
    await page.goto(origin+route+'?season=2026&week=7&q=nonexistent-fixture'+(nearby?'&mode=nearby':'')); await settled(page);
    if(nearby) await page.getByLabel('Or choose a school').selectOption('de-leon');
    assert.match(await page.locator('main').innerText(),/Live scores (are unavailable|could not be loaded)/);
    assert.equal(await page.getByRole('heading',{name:'No games match these filters',exact:true}).count(),0);
    assert.doesNotMatch(await page.locator('.weekly-refresh').innerText(),/0 games/);
  }
  mode='normal';
  assert.equal(await page.evaluate(()=>window.locationCalls),0);
  for (const change of ['refinement','location','week','mode']) {
    await page.goto(origin+route+'?season=2026&week=7&mode=nearby&state=current'); await settled(page);
    await page.getByLabel('Or choose a school').selectOption('de-leon');
    let release, started;
    const waiting = new Promise(resolve => {release=resolve;});
    const observed = new Promise(resolve => {started=resolve;});
    await page.route('**/api/games/snapshot', async request => {
      started(); await waiting;
      await request.fulfill({status:200,contentType:'application/json',body:JSON.stringify({games:[],scoreLoadStatus:'loaded',fetchedAt:'2026-10-10T00:00:00Z'})}).catch(()=>{});
    },{times:1});
    await page.getByRole('button',{name:'Refresh scores',exact:true}).click(); await observed;
    if(change==='refinement') await page.getByRole('link',{name:'Clear Current and unresolved games',exact:true}).click();
    if(change==='location') await page.getByLabel('Or choose a school').selectOption('hawley');
    if(change==='week') await page.getByRole('link',{name:'Week 8',exact:true}).click();
    if(change==='mode') await page.getByRole('link',{name:'All Games',exact:true}).click();
    const current = await page.locator('.weekly-refresh').innerText();
    const ids = await page.locator('[data-game-id]').evaluateAll(es=>es.map(e=>e.dataset.gameId));
    release(); await page.waitForTimeout(100);
    assert.equal(await page.locator('.weekly-refresh').innerText(),current);
    assert.deepEqual(await page.locator('[data-game-id]').evaluateAll(es=>es.map(e=>e.dataset.gameId)),ids);
    await page.unroute('**/api/games/snapshot');
  }
  for (const week of [6,7,8,9,10,11]) {
    await page.goto(origin+route+`?season=2026&week=${week}&mode=nearby&result=verified`); await settled(page);
    assert.match(await page.locator('.weekly-filters summary').getAttribute('aria-label'),/1 active refinement/);
    assert.equal(await page.getByRole('button',{name:'Use my location',exact:true}).count(),[7,8,9].includes(week)?1:0);
    assert.doesNotMatch(await page.locator('.weekly-refresh').innerText(),/0 games/);
    assert.match(await page.locator('.weekly-measurement').innerText(),/Preference: don’t share/);
  }
  pass(`${route}: counts, unknown classification unchanged Apply, all individual clears, keyboard focus, shared/history restoration, result=current ignored, genuine empty versus failure, stale completion after refinement/location/week/mode changes, supported/unsupported weeks, mobile and 200% text; measurement declined`);
}

try {
 verification: {
  start();
  await ready();
  browser = await chromium.launch({ args: ["--no-sandbox"], executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  let c = await context();
  await authenticated(c);
  let page = await c.newPage();
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("BROWSER RUNTIME ERROR", e.message);
  });
  for (const route of ["/games", "/scoreboard"]) {
    if (process.env.FILTER_CORRECTION_ONLY !== "1") await nearMePresentation(page, route);
    await page.setViewportSize({ width: 390, height: 900 });
    await statusRegressions(page, route);
    await nearbyStatusRegression(page, route);
  }
  if (process.env.FILTER_CORRECTION_ONLY === "1") {
    for (const route of ["/games", "/scoreboard"]) await refinementRegressions(page, route);
    const nativeContext = await context({javaScriptEnabled:false});
    await authenticated(nativeContext);
    const native = await nativeContext.newPage();
    for (const route of ["/games", "/scoreboard"]) {
      await statusRegressions(native, route, true);
      await native.goto(origin+route+'?season=2026&week=7&result=verified&classification=Unknown%20fixture%20classification');
      await native.locator('.weekly-filters summary').click();
      assert.equal(await native.locator('select[name="classification"]').inputValue(),'Unknown fixture classification');
      await native.getByRole('button',{name:'Apply filters',exact:true}).click();
      assert.equal(new URL(native.url()).searchParams.get('classification'),'Unknown fixture classification');
      await native.getByRole('link',{name:'Clear Verified finals only',exact:true}).click();
      assert.equal(new URL(native.url()).searchParams.get('classification'),'Unknown fixture classification');
      assert.equal(new URL(native.url()).searchParams.has('result'),false);
    }
    await nativeContext.close();
    assert.deepEqual(errors, []);
    assert.equal(writes,0); assert.equal(telemetryRequests,0);
    writeFileSync(`${evidence}/results.json`, JSON.stringify({head:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),tree:execFileSync("git",["rev-parse","HEAD^{tree}"],{encoding:"utf8"}).trim(),results,writes,telemetryRequests,scoreCalls,fixture:"Local synthetic read-only backend; measurement declined and collection off."},null,2));
    break verification;
  }
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
  assert.match(await page.locator("main").innerText(), /nearest first/);
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
    /Choose a school or use your location/,
  );
  assert.ok(!page.url().includes("latitude"));
  await page.getByRole("link", { name: "Week 6", exact: true }).click();
  assert.match(
    await page.locator("main").innerText(),
    /Near Me is unavailable for Week 6/,
  );
  assert.equal(await page.getByRole("button", { name: "Use my location" }).count(), 0);
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
  await authenticated(c);
  for (const route of ["/games", "/scoreboard"]) {
    const native = await c.newPage();
    await statusRegressions(native, route, true);
    await native.close();
  }
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
      ["result=verified&filter=legacy-completed", "upcoming", "rio-vista-at-tolar-2026-week-7", "albany-at-stamford-2026-week-7"],
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
    assert.match(await page.locator("main").innerText(),/Near Me needs JavaScript/);
    assert.equal(await page.locator('.weekly-location').isVisible(),false);
    assert.equal(await page.locator('.weekly-measurement').getByRole('link',{name:'Privacy',exact:true}).isVisible(),true);
    assert.equal(await page.getByRole('link',{name:'Browse All Games',exact:true}).isVisible(),true);
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
      await button.click();
      assert.equal(await sharePage.evaluate(() => window.shared.at(-1).url), "https://varsityvue.com/schools/"+slug);
      await sharePage.evaluate(() => window.scrollTo(0,0));
      const heroBox = await sharePage.locator("section").filter({has:sharePage.locator("h1")}).boundingBox();
      await sharePage.screenshot({path:`${evidence}/school-${slug}-text-200-${width}.png`,fullPage:true,clip:heroBox});
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
  const previousScore=rows[0].home_score;
  rows[0].home_score=previousScore+1;
  await sharePage.getByRole("button",{name:"Refresh scores",exact:true}).click();
  await sharePage.waitForFunction(() => !document.querySelector('[data-game-id="de-leon-at-hawley-2026-week-7"] [role="status"]').textContent);
  assert.equal(await feedback.count(),0,"Changed share content resets obsolete feedback immediately");
  rows[0].home_score=previousScore;
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
  assert.equal(telemetryRequests, 0);
  const promotionsContext = await context();
  const promotions = await promotionsContext.newPage();
  await promotions.setViewportSize({width:390,height:900});
  await promotions.goto(origin+'/games?season=2026&week=7');await settled(promotions);
  const full = promotions.locator('.weekly-scorekeeper .weekly-promo-description');
  assert.equal(await full.isVisible(),true);
  assert.match(await promotions.locator('.weekly-membership').innerText(),/Save your teams. Keep your picks/);
  assert.match(await promotions.locator('.weekly-pickem').innerText(),/Closed.*Week 6 Pick/si);
  const allHeight = await promotions.locator('.weekly-scorekeeper').evaluate(e=>e.getBoundingClientRect().height);
  await promotions.getByRole('link',{name:'Near Me',exact:true}).click();
  assert.equal(await full.isVisible(),false);
  assert.match(await promotions.locator('.weekly-membership').innerText(),/Follow teams free/);
  assert.equal(await promotions.locator('.weekly-membership .weekly-promo-description').isVisible(),false);
  assert.equal(await promotions.locator('.weekly-pickem .weekly-promo-description').isVisible(),false);
  assert.ok(await promotions.locator('.weekly-scorekeeper').evaluate(e=>e.getBoundingClientRect().height)<allHeight);
  for (const width of [390,430,1280]) {
    await promotions.setViewportSize({width,height:900});
    await promotions.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.equal(await promotions.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await promotions.screenshot({path:`${evidence}/near-me-promotions-text-200-${width}.png`,fullPage:true});
  }
  await promotions.getByRole('link',{name:'All Games',exact:true}).click();
  assert.equal(await full.isVisible(),true);
  assert.match(await promotions.locator('.weekly-membership').innerText(),/Save your teams. Keep your picks/);
  await promotionsContext.close();
  pass('Near Me promotions shrink on client mode transitions; All Games restores original copy/layout; truthful closed contest; signed-out 200% text');
  pass("Synthetic read-only backend: zero writes; declined measurement and zero telemetry requests");
  writeFileSync(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        head: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(),
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {encoding: "utf8"}).trim(),
        results,
        scoreCalls,
        writes,
        telemetryRequests,
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

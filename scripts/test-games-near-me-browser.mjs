// Disposable mounted-page test: synthetic geolocation and a loopback-only read fixture.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const evidence = 'games-near-me-browser-evidence';
mkdirSync(evidence, { recursive: true });
const rows = [
  { game_id: 'de-leon-at-hawley-2026-week-7', status: 'live', home_score: 7, away_score: 0, verified: true, period: '1st', clock: '08:00', kickoff_override: null, result_type: null, official_winner_school_slug: null, attribution_type: 'publisher', attribution_username: 'fixture_keeper' },
  { game_id: 'albany-at-stamford-2026-week-7', status: 'final', home_score: 7, away_score: 0, verified: true, period: null, clock: null, kickoff_override: null, result_type: 'played', official_winner_school_slug: 'stamford', attribution_type: 'verified', attribution_username: null },
];
const api = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.url.startsWith('/rest/v1/rpc/public_score_states') ? rows : []));
});
await new Promise(resolve => api.listen(54325, '127.0.0.1', resolve));
const app = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54325', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'disposable-fixture-public-key', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', RESEND_API_KEY: '', CRON_SECRET: '' },
});
let browser;
const results = [];
const pass = name => { results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); };
try {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch('http://127.0.0.1:3000/games')).ok) break; } catch { /* runtime starting */ }
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.notEqual(i, 89, 'Disposable app did not become ready');
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await context.addInitScript(() => {
    window.geoFixture = { calls: 0, mode: 'granted', latitude: 32.123456789, longitude: -98.543210987, accuracy: 30 };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success, error, options) {
        const f = window.geoFixture; f.calls++; f.options = options;
        if (f.mode === 'hold') { f.release = () => success({ coords: f }); return; }
        if (f.mode === 'granted' || f.mode === 'poor') success({ coords: { ...f, accuracy: f.mode === 'poor' ? 5000 : f.accuracy } });
        else error({ code: { denied: 1, unavailable: 2, timeout: 3 }[f.mode] });
      },
      watchPosition() { throw Error('watchPosition must never be used'); },
    } });
  });
  const page = await context.newPage();
  const errors = [], consoleMessages = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => consoleMessages.push(msg.text()));
  page.on('request', req => requests.push(req.url() + (req.postData() ?? '')));
  await context.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
  const nearby = page.locator('#nearby-games');
  const locate = nearby.getByRole('button', { name: 'Games Near Me', exact: true });
  async function pilot() {
    await page.goto('http://127.0.0.1:3000/games', { waitUntil: 'networkidle' });
    await nearby.locator('#nearby-week').selectOption('7');
    assert.equal(await page.evaluate(() => window.geoFixture.calls), 0);
    assert.equal(await locate.isEnabled(), true);
  }
  await page.goto('http://127.0.0.1:3000/scoreboard', { waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('heading', { name: 'Help cover local games' }).count(), 1);
  await page.getByRole('link', { name: 'Games Near Me →', exact: true }).click();
  await nearby.waitFor();
  assert.ok(page.url().endsWith('/games#nearby-games'));
  assert.equal(await page.evaluate(() => window.geoFixture.calls), 0);
  pass('Scoreboard entry navigates without permission request and preserves one recruitment CTA');
  await nearby.locator('#nearby-week').selectOption('6');
  assert.equal(await locate.isDisabled(), true);
  assert.match(await nearby.innerText(), /venue information is incomplete/);
  await nearby.locator('#nearby-week').selectOption('9');
  assert.equal(await locate.isDisabled(), true);
  pass('Week 6/current-week incomplete message and Week 9 fail-closed guard');
  await pilot();
  await page.waitForLoadState('networkidle');
  const before = requests.length;
  await locate.click();
  await nearby.getByText('Location ready.', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.geoFixture.calls), 1);
  const options = await page.evaluate(() => window.geoFixture.options);
  assert.deepEqual(options, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  await page.waitForTimeout(500);
  assert.equal(requests.length, before, 'Location discovery caused a server request');
  assert.match(await nearby.innerText(), /Near your location · Within 50 miles/);
  assert.ok(await nearby.locator('a[href^="/games/"]').count() > 0);
  assert.equal(await nearby.locator('#nearby-radius').inputValue(), '50');
  await nearby.locator('#nearby-radius').selectOption('150');
  const cards = nearby.locator('a[href^="/games/"]');
  assert.equal(await cards.count(), 16); // one fixture FINAL is separate
  assert.match(await cards.first().innerText(), /LIVE · score available/);
  assert.match(await cards.first().innerText(), /De Leon at Hawley/);
  assert.equal(await nearby.getByRole('heading', { name: 'Help cover local games' }).count(), 1);
  assert.equal(await nearby.getByRole('link', { name: 'Become a Scorekeeper' }).getAttribute('href'), '/contributors');
  await nearby.locator('#nearby-search').fill('not-a-matching-school');
  assert.match(await nearby.innerText(), /No matches with these filters/);
  await nearby.locator('#nearby-search').fill('');
  await nearby.locator('#nearby-status').selectOption('final');
  assert.equal(await cards.count(), 1); assert.match(await nearby.innerText(), /Nearby final results/);
  await nearby.locator('#nearby-status').selectOption('all');
  pass('Explicit Week 7, granted location, defaults/radius/count, LIVE ordering, FINAL separation and filter empty state');
  // Only presentation state goes into the recruitment module; no member/provenance IDs.
  assert.doesNotMatch(await nearby.innerHTML(), /applicant_id|reviewed_by|source_submission_id|updated_by|user_id|sourceReferences|verifiedAt|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const exact = await page.evaluate(() => [String(window.geoFixture.latitude), String(window.geoFixture.longitude)]);
  const privacy = await page.evaluate(async () => ({ url: location.href, html: document.documentElement.outerHTML, local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), cookie: document.cookie, databases: indexedDB.databases ? await indexedDB.databases() : [] }));
  for (const coordinate of exact) {
    assert.ok(!JSON.stringify(privacy).includes(coordinate));
    assert.ok(!requests.join('\n').includes(coordinate));
    assert.ok(!consoleMessages.join('\n').includes(coordinate));
  }
  assert.equal(privacy.databases.length, 0);
  assert.ok((await context.cookies()).every(c => exact.every(v => !c.value.includes(v))));
  for (const href of await nearby.locator('a').evaluateAll(links => links.map(a => a.href))) assert.ok(exact.every(v => !href.includes(v)));
  pass('Precise synthetic center absent from URL, markup, cookies, storage, IndexedDB, requests, console, analytics and contributor links');
  await nearby.getByRole('button', { name: 'Change center', exact: true }).click();
  await nearby.locator('#nearby-center').selectOption('de-leon');
  assert.match(await nearby.innerText(), /Searching near De Leon/);
  assert.equal(await page.evaluate(() => window.geoFixture.calls), 1);
  pass('GPS-to-school center switch is explicit and does not request location');
  for (const width of [390, 400, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await nearby.scrollIntoViewIfNeeded();
    const layout = await nearby.evaluate(el => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, actions: [...el.querySelectorAll('button, select, input')].filter(e => e.getBoundingClientRect().height > 0).map(e => ({ height: e.getBoundingClientRect().height, right: e.getBoundingClientRect().right, left: e.getBoundingClientRect().left })), headings: [...el.querySelectorAll('h2')].map(e => e.textContent) }));
    assert.ok(layout.scroll <= width, `Overflow at ${width}px: ${layout.scroll}`);
    for (const action of layout.actions) { assert.ok(action.height >= 44); assert.ok(action.left >= 0 && action.right <= width); }
    assert.ok(layout.headings.includes('Games Near Me'));
    await page.screenshot({ path: `${evidence}/nearby-${width}.png`, fullPage: false });
    pass(`${width}px responsive: no overflow, readable controls, 44px targets`);
  }
  await page.keyboard.press('Tab');
  await locate.focus();
  const focus = await locate.evaluate(el => ({ active: document.activeElement === el, outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
  assert.equal(focus.active, true); assert.notEqual(focus.outline, 'none'); assert.notEqual(focus.width, '0px');
  await page.keyboard.press('Enter'); await nearby.getByText('Location ready.', { exact: true }).waitFor();
  assert.equal(await nearby.locator('[aria-live="assertive"]').count(), 0);
  await nearby.locator('#nearby-radius').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'nearby-search');
  pass('Keyboard activation, focus visibility, semantic heading, labeled selectors and restrained status');
  await nearby.getByRole('button', { name: 'Clear', exact: true }).click();
  assert.equal(await cards.count(), 0); assert.ok(await page.locator('#all-matchups').count());
  pass('Clear removes center/results; normal server schedule stays available');
  for (const mode of ['denied', 'timeout', 'unavailable', 'poor']) {
    await page.evaluate(mode => { window.geoFixture.mode = mode; }, mode);
    await locate.click();
    assert.match(await nearby.locator('[role="status"]').innerText(), { denied: /permission was denied/, timeout: /timed out/, unavailable: /location is unavailable/, poor: /too approximate/ }[mode]);
    assert.equal(await cards.count(), 0);
    assert.ok(await nearby.locator('#nearby-center').isVisible());
    pass(`${mode} geolocation fails safely with school fallback`);
  }
  await page.evaluate(() => { window.geoFixture.mode = 'granted'; });
  await locate.click(); await nearby.getByText('Location ready.', { exact: true }).waitFor();
  pass('Explicit retry after failure');
  await nearby.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.evaluate(() => { window.geoFixture.mode = 'hold'; });
  await locate.click(); await nearby.getByRole('button', { name: 'Cancel location request' }).click();
  await page.evaluate(() => window.geoFixture.release());
  assert.equal(await cards.count(), 0);
  pass('Cancelled late geolocation callback cannot restore cleared center');
  await page.evaluate(() => { Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined }); });
  await locate.click(); assert.match(await nearby.innerText(), /does not support location/);
  await nearby.locator('#nearby-center').selectOption('de-leon');
  assert.match(await nearby.innerText(), /Searching near De Leon/);
  pass('Unsupported API still offers verified school center without login');
  // Far-away synthetic point gives true zero-radius results; no owner GPS involved.
  await pilot();
  await page.evaluate(() => { window.geoFixture.latitude = 45.123456789; window.geoFixture.longitude = -110.543210987; });
  await locate.click(); assert.match(await nearby.innerText(), /No nearby tracked games/);
  pass('Zero nearby tracked games distinguished from filtered empty results');
  await nearby.locator('#nearby-week').selectOption('9'); assert.equal(await cards.count(), 0); assert.equal(await locate.isDisabled(), true);
  pass('Changing to unverified week clears center and remains disabled');
  await nearby.locator('#nearby-week').selectOption('8');
  assert.equal(await locate.isEnabled(), true);
  await nearby.getByRole('button', { name: 'Choose a school instead' }).click();
  await nearby.locator('#nearby-center').selectOption('hamilton');
  await nearby.locator('#nearby-radius').selectOption('150');
  assert.equal(await cards.count(), 16);
  assert.match(await nearby.innerText(), /Searching near Hamilton/);
  assert.doesNotMatch(await nearby.innerText(), /venue information is incomplete/);
  const distances = await cards.evaluateAll(nodes => nodes.map(n => Number(n.innerText.match(/(\d+) mi away/)?.[1] ?? 0)));
  assert.deepEqual(distances, [...distances].sort((a,b) => a-b));
  await nearby.locator('#nearby-radius').selectOption('10');
  assert.equal(await cards.count(), 1);
  assert.match(await cards.first().innerText(), /Clifton at Hamilton/);
  await nearby.getByRole('button', { name: 'Clear', exact: true }).click();
  assert.equal(await cards.count(), 0);
  pass('Week 8 17/17, Hamilton school center, radius/sorting, clear and normal schedule fallback');
  for (const width of [390,400,430,1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/games', '/schools/hamilton', '/schools']) {
      await page.goto('http://127.0.0.1:3000'+path, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${path} overflow at ${width}`);
      if(path === '/schools/hamilton') {
        await page.getByRole('heading', { name: 'Hamilton', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Follow Hamilton', exact: true }).waitFor();
        await page.getByRole('link', { name: 'Team Feed', exact: true }).first().waitFor();
        const logo = page.getByRole('img', { name: 'Hamilton Bulldogs logo', exact: true }).first();
        await logo.waitFor();
        const dimensions = await logo.evaluate(el => ({ natural: el.naturalWidth/el.naturalHeight, objectFit: getComputedStyle(el).objectFit, loaded: el.complete && el.naturalWidth > 0 }));
        assert.ok(dimensions.loaded); assert.equal(dimensions.natural, 1.5); assert.equal(dimensions.objectFit, 'contain');
      }
      if(path === '/schools') {
        const placement = await page.locator('a[href="/schools/hamilton"]').evaluateAll(nodes => nodes.map(n => {
          const h = [...document.querySelectorAll('h2')].filter(h => h.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
          return h?.textContent;
        }));
        assert.deepEqual(placement, ['Featured Schools']);
      }
      await page.screenshot({ path: `${evidence}/${path === '/games' ? 'week8-games' : path === '/schools' ? 'featured-directory' : 'hamilton-hub'}-${width}.png`, fullPage: true });
    }
    pass(`${width}px Hamilton hub/logo/follow/feed, Featured directory, Games Near Me: no overflow`);
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${evidence}/results.json`, JSON.stringify({ results, screenReader: 'NOT VERIFIED: no manual screen-reader session', backend: 'loopback read-only synthetic score fixture', geolocation: 'mocked only' }, null, 2));
} finally {
  await browser?.close(); app.kill('SIGTERM'); api.close();
}

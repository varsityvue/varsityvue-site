// Isolated runner only: local read-only API fixture, no production requests/writes.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const fixture = JSON.parse(readFileSync(process.env.ATTRIBUTION_BROWSER_FIXTURE, 'utf8'));
assert.equal(fixture.length, 1);
let rows = fixture;
const api = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.url.startsWith('/rest/v1/rpc/public_score_states') ? rows : []));
});
await new Promise(resolve => api.listen(54325, '127.0.0.1', resolve));
const app = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54325',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'disposable-fixture-public-key' },
});
let browser;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch('http://127.0.0.1:3000/scoreboard')).ok) break; } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.notEqual(attempt, 59, 'Next dev server did not become ready');
  }
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  mkdirSync('attribution-browser-evidence', { recursive: true });
  const username = fixture[0].attribution_username;
  assert.equal(username.length, 30);
  const routes = ['/scoreboard', `/games/${fixture[0].game_id}`, '/schools/miles'];
  for (const width of [390, 400, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [index, route] of routes.entries()) {
      await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' });
      const lines = page.getByText(`Updated by @${username}`, { exact: true });
      assert.ok(await lines.count(), `${route}: missing LIVE attribution`);
      const layout = await page.evaluate(() => {
        const lines = [...document.querySelectorAll('p')].filter(p => p.textContent.startsWith('Updated by @') && p.getBoundingClientRect().height > 0);
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          overlay: Boolean(document.querySelector('[data-nextjs-dialog]')),
          lines: lines.map(p => ({ text: p.textContent, width: p.getBoundingClientRect().width,
            parentWidth: p.parentElement.getBoundingClientRect().width, fontSize: getComputedStyle(p).fontSize,
            color: getComputedStyle(p).color, wrap: getComputedStyle(p).overflowWrap,
            assertive: Boolean(p.closest('[aria-live="assertive"]')) })) };
      });
      assert.equal(layout.overlay, false);
      assert.ok(layout.scrollWidth <= width, `${route}@${width}: horizontal overflow ${layout.scrollWidth}`);
      assert.ok(layout.lines.length > 0);
      for (const line of layout.lines) {
        assert.equal(line.text, `Updated by @${username}`);
        assert.equal(line.fontSize, '12px');
        assert.equal(line.color, 'rgb(176, 176, 176)');
        assert.equal(line.wrap, 'anywhere');
        assert.equal(line.assertive, false);
        assert.ok(line.width <= line.parentWidth);
      }
      assert.doesNotMatch(await page.locator('main').innerText(), /00000000-0000|@example\.invalid|Private correction/);
      await page.screenshot({ path: `attribution-browser-evidence/${index}-${width}.png`, fullPage: false });
      console.log(`PASS ${route} ${width}px: LIVE byline, complete handle, no overflow, no private identity`);
    }
  }
  // Actual mounted pages also exercise fallback/correction and compact FINAL policies.
  for (const [type, username, expected] of [
    ['publisher', null, 'Updated by VarsityVue contributor'],
    ['correction', null, 'Corrected by VarsityVue'],
  ]) {
    rows = [{ ...fixture[0], attribution_type: type, attribution_username: username }];
    for (const route of routes) {
      await page.goto(`http://127.0.0.1:3000${route}`);
      assert.ok(await page.getByText(expected, { exact: true }).count());
    }
  }
  for (const [type, expected] of [['verified', 'Verified by VarsityVue'], ['correction', 'Corrected by VarsityVue'], ['outcome', 'Outcome confirmed by VarsityVue']]) {
    rows = [{ ...fixture[0], status: 'final', result_type: type === 'outcome' ? 'no_contest' : 'played',
      attribution_type: type, attribution_username: null,
      home_score: type === 'outcome' ? null : 0, away_score: type === 'outcome' ? null : 7 }];
    await page.goto(`http://127.0.0.1:3000/games/${fixture[0].game_id}`);
    assert.ok(await page.getByText(expected, { exact: true }).count());
    for (const route of ['/scoreboard', '/schools/miles', '/']) {
      await page.goto(`http://127.0.0.1:3000${route}`);
      assert.equal(await page.getByText(/Updated by @|VarsityVue contributor|Corrected by VarsityVue|Outcome confirmed by VarsityVue|Verified by VarsityVue/).count(), 0);
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS full mounted surface policies, FINAL/history/homepage exclusion, fallback/correction/outcome, no page errors');
} finally {
  await browser?.close();
  app.kill('SIGTERM');
  api.close();
}

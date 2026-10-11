// CI-only, synthetic comparison. Never targets a deployed site or database.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const base = process.env.PACKAGE2_BASE_SHA;
if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('An exact baseline SHA is required');
const root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), 'varsityvue-browser-comparison-'));
const baseline = join(directory, 'baseline');
const generated = [];
const results = [];
try {
  execFileSync('git', ['worktree', 'add', '--detach', baseline, base], { stdio: 'inherit', timeout: 30000 });
  execFileSync('npm', ['ci'], { cwd: baseline, stdio: 'inherit', timeout: 180000 });
  symlinkSync(resolve(root, 'node_modules/playwright'), join(baseline, 'node_modules/playwright'), 'dir');
  for (const [label, cwd] of [['main', baseline], ['candidate', root]]) {
    const source = readFileSync(join(cwd, 'scripts/test-unified-games-browser.mjs'), 'utf8');
    const start = source.indexOf('\ntry {\n {\n  start();');
    const cleanup = source.lastIndexOf('\n} finally {');
    if (start < 0 || cleanup <= start) throw new Error('Browser fixture structure changed');
    const fixture = join(cwd, 'scripts/package2-browser-comparison.generated.mjs');
    generated.push(fixture);
    writeFileSync(fixture, source.slice(0, start) + `
try {
  start(); await ready();
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const c = await context(); await authenticated(c);
  const page = await c.newPage();
  for (const route of ['/games', '/scoreboard']) {
    await allGamesRefinements(page, route);
    await refinementRegressions(page, route);
  }
` + source.slice(cleanup));
    try {
      execFileSync(process.execPath, [fixture], { cwd, stdio: 'inherit', timeout: 240000, killSignal: 'SIGTERM' });
      results.push({ revision: label, status: 'passed' });
    } catch (error) {
      results.push({ revision: label, status: 'failed', exit: error.status, signal: error.signal });
      // A timed-out fixture may leave its detached server alive. End this job;
      // never start another fixture against that process or terminate arbitrary sessions.
      if (error.signal) break;
    } finally {
      const evidence = join(cwd, 'unified-games-browser-evidence');
      if (existsSync(evidence)) cpSync(evidence, join(root, 'package2-baseline-comparison-evidence', label), { recursive: true });
    }
  }
  console.log('PACKAGE2_BASELINE_COMPARISON', JSON.stringify({ base, results }));
  if (results.length !== 2 || results.some(result => result.status !== 'passed')) process.exitCode = 1;
} finally {
  for (const file of generated) rmSync(file, { force: true });
  try { execFileSync('git', ['worktree', 'remove', '--force', baseline], { stdio: 'inherit', timeout: 30000 }); } catch { /* Runner cleanup owns a failed temporary worktree. */ }
  rmSync(directory, { recursive: true, force: true });
}

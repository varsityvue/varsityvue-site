// One-shot, sequential public checks. No scheduler, database credentials or alerts.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function checkAvailability(base, config, fetcher = fetch) {
  const origin = new URL(base);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (!loopback && (!config.enabled || !['varsityvue.com', 'www.varsityvue.com'].includes(origin.hostname) || origin.protocol !== 'https:'))
    throw new Error('Production monitoring is dormant until separately authorized configuration enables it.');
  const results = [];
  for (const path of config.publicPaths) {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid monitor path');
    const start = performance.now();
    try {
      const response = await fetcher(new URL(path, origin), { redirect: 'error', cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(config.timeoutMs) });
      let healthy = response.ok;
      if (path === '/api/games/snapshot' && healthy) {
        const body = await response.json();
        healthy = Array.isArray(body.games) && ['primary', 'fallback'].includes(body.scoreLoadStatus) && Number.isFinite(Date.parse(body.fetchedAt)) && Math.abs(Date.now() - Date.parse(body.fetchedAt)) < 60000;
      } else { await response.body?.cancel(); }
      results.push({ path, healthy, status: response.status, elapsedMs: Math.round(performance.now() - start) });
    } catch { results.push({ path, healthy: false, status: null, elapsedMs: Math.round(performance.now() - start) }); }
  }
  return { observedAt: new Date().toISOString(), results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(await readFile(new URL('../ops/package2-monitoring.json', import.meta.url), 'utf8'));
  const result = await checkAvailability(process.argv[2] ?? 'http://127.0.0.1:3000', config);
  console.log(JSON.stringify(result));
  if (result.results.some(row => !row.healthy)) process.exitCode = 1;
}

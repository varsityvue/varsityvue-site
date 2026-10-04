// Disposable loopback Redis + real REST adapter/Lua. No hosted service or notification destination.
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import { FLEET_CLOCK, FLEET_PREFIX, FLEET_RECORD_SCRIPT, FLEET_CENTRAL_SCRIPT } from '../lib/coverage-fleet-scripts.ts';
import { redisFleetStore, fleetCollector, fleetSnapshot, notifyFleet, runFleet } from '../lib/coverage-fleet.ts';

const port = Number(process.env.COVERAGE_FLEET_LOCAL_REDIS_PORT);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535, 'explicit disposable loopback Redis port required');
const base = Math.floor(Date.now() / 300000) + 1;
let now = base * 300 + 5, server, origin, store, requests = 0, lose = false;
function command(args) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port }); let data = Buffer.alloc(0);
    socket.setTimeout(2000, () => socket.destroy(Error('fixture timeout')));
    socket.on('error', reject);
    socket.on('connect', () => socket.write(Buffer.concat([Buffer.from(`*${args.length}\r\n`), ...args.flatMap(arg => {
      const bytes = Buffer.from(String(arg)); return [Buffer.from(`$${bytes.length}\r\n`), bytes, Buffer.from('\r\n')];
    })])));
    socket.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      function parse(offset) {
        const end = data.indexOf('\r\n', offset); if (end < 0) return;
        const kind = String.fromCharCode(data[offset]), value = data.toString('utf8', offset + 1, end); let cursor = end + 2;
        if (kind === '+') return [value, cursor]; if (kind === '-') throw Error(value);
        if (kind === ':') return [Number(value), cursor];
        if (kind === '$') { const length = Number(value); if (length === -1) return [null, cursor]; if (data.length < cursor + length + 2) return;
          return [data.toString('utf8', cursor, cursor + length), cursor + length + 2]; }
        if (kind === '*') { const items = []; for (let i = 0; i < Number(value); i++) { const item = parse(cursor); if (!item) return; items.push(item[0]); cursor = item[1]; } return [items, cursor]; }
        throw Error('fixture protocol');
      }
      try { const result = parse(0); if (result) { socket.end(); resolve(result[0]); } } catch (error) { socket.destroy(); reject(error); }
    });
  });
}
before(async () => {
  assert.equal(await command(['PING']), 'PONG');
  server = http.createServer(async (req, res) => {
    try {
      assert.equal(req.method, 'POST'); assert.equal(req.url, '/'); assert.equal(req.headers.authorization, 'Bearer disposable-local');
      let text = ''; for await (const chunk of req) { text += chunk; assert.ok(text.length < 30000); }
      const args = JSON.parse(text); assert.equal(args[0], 'EVAL'); assert.ok([FLEET_RECORD_SCRIPT, FLEET_CENTRAL_SCRIPT].includes(args[1]));
      // Fixture-only clock substitution. Production always uses Redis TIME; no caller clock exists.
      args[1] = args[1].replace(FLEET_CLOCK, `local now = ${now}`); requests++;
      const result = await command(args);
      if (lose) { lose = false; req.socket.destroy(); return; }
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ result }));
    } catch { res.statusCode = 503; res.end('{}'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); origin = `http://127.0.0.1:${server.address().port}/`;
  const loopbackSend = async (_url, init) => {
    assert.equal(_url, 'https://fixture.upstash.io/');
    return fetch(origin, init);
  };
  store = redisFleetStore('https://fixture.upstash.io/', 'disposable-local', loopbackSend, () => now * 1000);
});
beforeEach(async () => { await command(['FLUSHDB']); now = base * 300 + 5; requests = 0; lose = false; });
after(async () => { if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } });
const bucket = w => FLEET_PREFIX + 'b:' + w;
const state = FLEET_PREFIX + 'state';
async function record(w, a = 0, d = 0, c = 0, indeterminate = false) { now = w * 300 + 5; return store.record(w, { accepted: a, database_failure: d, capacity_failure: c, indeterminate }); }
async function evaluate(w) { now = (w + 1) * 300 + 31; return fleetSnapshot(await store.central('evaluate')); }
async function commission() {
  await record(base, 3); await evaluate(base); await record(base + 1, 3); const view = await evaluate(base + 1);
  assert.deepEqual(await store.central('recover', view.revision, view.window), [1]);
}
test('actual Lua atomic increments aggregate 40 concurrent instances without identities', async () => {
  await Promise.all(Array.from({ length: 40 }, (_, i) => {
    const collector = fleetCollector(() => now * 1000); collector.observe(i % 2 ? 'accepted' : 'database_failure');
    return collector.flush(store);
  }));
  assert.equal(await command(['HGET', bucket(base), 'accepted']), '20');
  assert.equal(await command(['HGET', bucket(base), 'database_failure']), '20');
  assert.deepEqual((await command(['HKEYS', bucket(base)])).sort(), ['accepted', 'capacity_failure', 'database_failure', 'finalized', 'indeterminate']);
});
test('two consecutive fleet thresholds, independent capacity threshold, no instance success recovery', async () => {
  await commission();
  await record(base + 2, 4, 3, 2); let view = await evaluate(base + 2); assert.equal(view.incident, 0);
  await record(base + 3, 5, 5); view = await evaluate(base + 3); assert.ok(view.incident & 1);
  await record(base + 4, 100, 0, 5); await evaluate(base + 4);
  await record(base + 5, 100, 0, 5); view = await evaluate(base + 5); assert.ok(view.incident & 2);
  await record(base + 6, 3); await evaluate(base + 6); await record(base + 7, 3); view = await evaluate(base + 7);
  assert.equal(view.clean_windows, 2); assert.equal(view.incident, 3);
});
test('no traffic neither triggers ingestion failure nor recovers a latched incident', async () => {
  await commission(); const clear = await evaluate(base + 2); assert.equal(clear.incident, 0); assert.equal(clear.clean_windows, 0);
  await record(base + 3, 0, 5); await evaluate(base + 3); await record(base + 4, 0, 5); let view = await evaluate(base + 4);
  view = await evaluate(base + 5); assert.ok(view.incident & 1); assert.equal(view.clean_windows, 0);
  assert.deepEqual(await store.central('recover', view.revision, view.window), [0]);
});
test('manual recovery rejects stale review, missing windows, false attestations and ongoing failures', async () => {
  await commission(); await record(base + 2, 0, 5); await evaluate(base + 2); await record(base + 3, 0, 5); await evaluate(base + 3);
  await record(base + 4, 3); await evaluate(base + 4); await record(base + 5, 3); let view = await evaluate(base + 5);
  assert.deepEqual(await store.central('recover', view.revision + 1, view.window), [0]);
  // A healthy finalized pair cannot conceal another instance failing in the current open window.
  now = (base + 6) * 300 + 32; await store.record(base + 6, { accepted: 0, database_failure: 1, capacity_failure: 0, indeterminate: false });
  assert.deepEqual(await store.central('recover', view.revision, view.window), [0]);
  await record(base + 7, 3); await evaluate(base + 7); await record(base + 8, 3); view = await evaluate(base + 8);
  const body = { expected_revision: view.revision, reviewed_window: view.window, cause_resolved: true, transport_reviewed: true, loss_accepted: true };
  const req = value => new Request('https://fixture.invalid/recover', { method: 'POST', headers: { authorization: 'Bearer disposable' }, body: JSON.stringify(value) });
  const cfg = { enabled: true, configured: true, secret: 'disposable' };
  assert.equal((await runFleet(req({ ...body, transport_reviewed: false }), 'recover', cfg, store, async () => true, async () => true)).status, 400);
  assert.equal((await runFleet(req(body), 'recover', cfg, store, async () => true, async () => true)).status, 200);
  assert.equal(fleetSnapshot(await store.central('review')).incident, 0);
  assert.equal((await runFleet(req(body), 'recover', cfg, store, async () => true, async () => true)).status, 409);
});
test('30-second grace, rejected finalized/late writes, duplicate evaluation and bounded expiry', async () => {
  await record(base, 1); now = (base + 1) * 300 + 29;
  assert.ok(await store.record(base, { accepted: 1, database_failure: 0, capacity_failure: 0, indeterminate: false }));
  const before = await evaluate(base), again = fleetSnapshot(await store.central('evaluate'));
  assert.deepEqual(before, again); assert.equal(await command(['HGET', bucket(base), 'accepted']), '2');
  assert.equal(await store.record(base, { accepted: 1, database_failure: 0, capacity_failure: 0, indeterminate: false }), false);
  assert.equal(await command(['HGET', bucket(base), 'accepted']), '2');
  assert.ok(fleetSnapshot(await store.central('review')).incident & 4);
  const expiration = await command(['EXPIRETIME', bucket(base)]); assert.equal(expiration, (base + 1) * 300 + 86400);
  await command(['EXPIREAT', bucket(base), Math.floor(Date.now() / 1000) - 1]); assert.equal(await command(['EXISTS', bucket(base)]), 0);
  await store.central('evaluate'); assert.equal(fleetSnapshot(await store.central('review')).clean_windows, 0);
});
test('saturation and counter reset are indeterminate; missed evaluation and deleted state require review', async () => {
  await record(base, 1000000); let view = await evaluate(base); assert.ok(view.incident & 4); assert.equal(view.clean_windows, 0);
  await command(['DEL', state]); view = fleetSnapshot(await store.central('review')); assert.equal(view.incident, 4); assert.equal(view.transport_fault, 1);
  now += 3900; view = fleetSnapshot(await store.central('evaluate')); assert.ok(view.incident & 4); assert.equal(view.clean_windows, 0);
  assert.equal(Number(await command(['HLEN', state])), 12);
});
test('ambiguous acknowledgment commits once, marks uncertainty and is never retried as a delta', async () => {
  const collector = fleetCollector(() => now * 1000); collector.observe('accepted'); lose = true;
  await collector.flush(store); assert.equal(await command(['HGET', bucket(base), 'accepted']), '1');
  assert.ok(fleetSnapshot(await store.central('review')).incident & 4);
  const count = requests; await collector.flush(store); assert.equal(requests, count);
});
test('notification claims serialize, failed delivery retries after 60 seconds; stale ack cannot erase escalation', async () => {
  await commission(); await record(base + 2, 0, 5); await evaluate(base + 2); await record(base + 3, 0, 5); await evaluate(base + 3);
  const claims = await Promise.all([store.central('claim'), store.central('claim')]); assert.equal(claims.filter(x => x.length === 2).length, 1);
  const claim = claims.find(x => x.length === 2); await store.central('ack', claim[0], 0, false);
  assert.deepEqual(await store.central('claim'), [0]); now += 60;
  assert.equal(await notifyFleet(store, async signal => { assert.equal(signal, 'fail'); return true; }), true);
  assert.deepEqual(await store.central('claim'), [0]);
  await store.central('fault'); await store.central('ack', claim[0], 0, true);
  const next = await store.central('claim'); assert.equal(next.length, 2); assert.ok(next[0] > claim[0]); assert.ok(next[1] & 4);
});
test('store outage sanitizes response and signals independent evaluator failure without clearing incident', async () => {
  const signals = []; const down = { record: async () => { throw Error('down'); }, central: async () => { throw Error('private'); } };
  const response = await runFleet(new Request('https://fixture.invalid/evaluate', { headers: { authorization: 'Bearer disposable' } }), 'evaluate',
    { secret: 'disposable', enabled: true, configured: true }, down, async s => { signals.push(s); return true; }, async s => { signals.push('incident:' + s); return true; });
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { state: 'monitor_unavailable' }); assert.deepEqual(signals, ['fail']);
});

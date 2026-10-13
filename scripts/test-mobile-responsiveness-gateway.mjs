// Disposable verification only. No externally reachable ports or production target.
import http from 'node:http';
import assert from 'node:assert/strict';
assert.equal(process.cwd(), '/vercel/package');
let mode = 'normal';
let paths = {}, writes = 0;
const gateway = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/__test/control' && req.method === 'POST') {
    let body = ''; req.on('data', chunk => body += chunk);
    req.on('end', () => { const value = JSON.parse(body); mode = value.mode; if (value.reset) { paths = {}; writes = 0; }
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({mode, paths, writes})); });
    return;
  }
  if (path === '/__test/stats') { res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify({mode,paths,writes})); return; }
  paths[path] = (paths[path] ?? 0) + 1;
  const isWrite = req.method === 'POST' && ['/rest/v1/rpc/submit_pickem_contest_entry','/rest/v1/rpc/save_pickem_contest_draft'].includes(path);
  if (isWrite) writes++;
  const fail = mode === 'entry-fail' && path === '/rest/v1/pickem_contest_entries' ||
    mode === 'void-fail' && path === '/rest/v1/pickem_contest_void_games' ||
    mode === 'status-fail' && path === '/rest/v1/member_account_status' ||
    mode === 'history-fail' && path === '/rest/v1/rpc/own_pickem_season_summary';
  if (fail) { res.writeHead(503, {'content-type':'application/json'}); res.end(JSON.stringify({code:'PGRST003',message:'PRIVATE_TEST_DIAGNOSTIC'})); return; }
  if (mode === 'slate-hang' && path === '/rest/v1/pickem_game_cards') return;
  const forward = () => {
    const upstream = http.request({host:'127.0.0.1',port:54321,path:req.url,method:req.method,headers:req.headers}, reply => {
      if (mode === 'drop-success' && isWrite && reply.statusCode < 300) {
        reply.resume(); reply.on('end', () => { res.writeHead(503, {'content-type':'application/json'}); res.end(JSON.stringify({message:'Synthetic lost committed response'})); }); return;
      }
      res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(503); res.end(); });
    req.pipe(upstream);
  };
  const optional = ['/rest/v1/rpc/own_pickem_season_summary','/rest/v1/rpc/public_pickem_season_standings','/rest/v1/rpc/public_pickem_week_standings'].includes(path);
  const delay = mode === 'delay-150' && path.startsWith('/rest/v1/') ? 150 : mode === 'optional-delay' && optional ? 1500 : 0;
  if (delay) setTimeout(forward, delay); else forward();
});
gateway.listen(54323, '127.0.0.1', () => console.log('TEST_GATEWAY_LOOPBACK_ONLY'));

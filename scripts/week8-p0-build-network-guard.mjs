import fs from 'node:fs';
const original = globalThis.fetch;
globalThis.fetch = async function(input, init) {
 const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
 const u = new URL(raw);
 if (u.href === 'https://varsityvue.com/logos/varsityvue-logo.png') {
  return new Response(fs.readFileSync(process.env.P1_LOGO_FIXTURE), {headers:{'content-type':'image/png'}});
 }
 if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw new Error('P1 external fetch forbidden: '+u.hostname);
 return original.call(this, input, init);
};

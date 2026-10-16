// UI fixture for the actual recovery button; server authorization is tested separately.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { build } = require("esbuild");
const { chromium } = require("playwright");

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import React, {useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {CheckAccessButton} from './app/account-unavailable/check-access-button';
    function Fixture() {
      const [message, setMessage] = useState('');
      return <main><h1>Member access temporarily unavailable</h1>
        <form action={async () => {const result = await fetch('/check', {method:'POST'}); setMessage(await result.text());}}>
          <CheckAccessButton />
        </form><p role="status">{message}</p><a href="/games">Games &amp; Scores</a></main>;
    }
    createRoot(document.getElementById('root')).render(<Fixture/>);
  ` },
  bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
});
let requests = 0;
const server = createServer((req, res) => {
  if (req.url === "/check") {
    requests++;
    setTimeout(() => res.end(requests % 2 ? "We still could not verify access." : "Access verified."), 400);
    return;
  }
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript" : "text/html");
  res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : '<!doctype html><meta name="viewport" content="width=device-width"><div id="root"></div><script src="/fixture.js"></script>');
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const button = page.getByRole("button", { name: "Check account access" });
    await button.waitFor();
    assert.equal(requests, width === 390 ? 0 : 2); // No automatic checks.
    await page.keyboard.press("Tab");
    assert.equal(await button.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Enter");
    const busy = page.getByRole("button", { name: "Checking access…" });
    await busy.waitFor();
    assert.equal(await busy.isDisabled(), true);
    assert.equal(await busy.getAttribute("aria-busy"), "true");
    await page.getByRole("status").filter({ hasText: "We still could not verify access." }).waitFor();
    await button.click();
    await page.getByRole("status").filter({ hasText: "Access verified." }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  assert.equal(requests, 4);
  console.log("PASS: recovery button keyboard access, busy/disabled state, manual retry and no automatic checks at 390px and 1280px.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

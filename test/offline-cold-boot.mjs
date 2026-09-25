// Does the app boot with no network at all?
//
// This is the app's founding promise — "it must work offline" — and until now
// nothing tested it. It could not: every other harness sets
// `serviceWorkers: 'block'`, which is necessary there (without it the service
// worker mediates fetches and `ctx.route` never fires) but means the offline
// shell has never been exercised by anything.
//
// The gap was not theoretical. `web/sw.js` precaches a hand-written list, and
// three modules on the boot path — currency.js, install.js, search.js — had
// been added in later rounds and never listed. A phone that installed the app
// and had not opened it a second time online did not boot with no signal at
// all: no tab bar, no screen, and no error either, because a failed module
// import just leaves the boot cover up. `build.mjs` now fails on a mismatch,
// and this proves the shell those entries describe actually works.
//
// THE STATE THIS RECREATES, and it is the one that matters:
//
//   1. load once online       — `install` precaches the ASSETS list
//   2. delete everything the RUNTIME handler cached on top of it
//   3. go offline and cold-launch
//
// Step 2 is the whole point. A second online load repairs an incomplete shell
// by itself, because the service worker is controlling by then and its
// network-first handler caches whatever it fetches — which is exactly why the
// defect survived so long. Without that wipe this harness would pass against a
// shell that is missing half its modules.
//
// It reopens on every deploy, too: the cache is named after sw.js's VERSION and
// `activate` deletes every cache that is not the current one.
//
// WHY THIS SERVES THE APP ITSELF INSTEAD OF USING THE SHARED SERVER, AND WHY
// IT DOES NOT USE `context.setOffline()`.
//
// Because `setOffline` does not stop the SERVICE WORKER from reaching the
// network. Measured: with the three entries removed and the context set
// offline, the shell cache went from 35 modules to 38 DURING the offline load
// — the service worker had fetched the missing three for real. A harness built
// on it therefore passes or fails on timing, and this one did both on the same
// defect before the cause was found.
//
// So the network is removed rather than emulated: this file runs its own
// server on an ephemeral port, loads the app once so the service worker
// installs, then CLOSES that server and destroys its sockets. Nothing can
// fetch anything after that — not the page, not the service worker — which is
// what "no signal" actually means.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/runtime.mjs';

const ROOT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'web');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

const sockets = new Set();
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = join(ROOT, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''));
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = join(path, 'index.html');
  } catch {
    if (extname(path)) { res.writeHead(404); res.end('not found'); return; }
    path = join(ROOT, 'index.html');
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
server.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const SPA = `http://127.0.0.1:${server.address().port}`;

/** Really gone: stop listening AND drop every keep-alive socket. */
const killServer = () => new Promise((r) => {
  for (const s of sockets) s.destroy();
  server.close(() => r());
});

const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 220)}` : ''));
};

const browser = await launch();
// Service workers NOT blocked — the whole point of this file.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
const page = await ctx.newPage();

/** What is in the shell cache right now, JS modules only. */
const shellJs = () => page.evaluate(async () => {
  const name = (await caches.keys()).find((k) => k.includes('shell'));
  if (!name) return [];
  return (await (await caches.open(name)).keys())
    .map((r) => new URL(r.url).pathname)
    .filter((p) => p.startsWith('/js/'));
});

// ---- 1. one online load, so the service worker installs and precaches ------
await page.goto(`${SPA}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker?.controller, { timeout: 20000 }).catch(() => {});
// The install event precaches in the background; give it room to finish.
await page.waitForTimeout(3500);

const precached = await shellJs();
check('the service worker installed and precached the shell', precached.length > 0, `${precached.length} modules`);
check('the service worker is controlling the page',
      await page.evaluate(() => Boolean(navigator.serviceWorker.controller)));

// Every module the app ships must be in the PRECACHE, not merely reachable.
const shipped = await page.evaluate(async () => {
  const res = await fetch('./sw.js');
  const text = await res.text();
  return [...text.matchAll(/'\.\/(js\/[^']+)'/g)].map((m) => `/${m[1]}`);
});
const absent = shipped.filter((m) => !precached.includes(m));
check('every module sw.js lists is really in the precache', absent.length === 0, absent.join(', '));

// ---- 2. wipe what the runtime handler cached on top -------------------------
await page.evaluate(async (keep) => {
  const name = (await caches.keys()).find((k) => k.includes('shell'));
  const cache = await caches.open(name);
  for (const req of await cache.keys()) {
    const p = new URL(req.url).pathname;
    if (p.startsWith('/js/') && !keep.includes(p)) await cache.delete(req);
  }
}, precached);

// ---- 3. offline, cold ------------------------------------------------------
//
// The server is gone from here on. Not throttled, not emulated — closed, with
// its sockets destroyed, so a fetch by anyone fails at the transport.
await killServer();
const stillUp = await fetch(`${SPA}/index.html`).then(() => true).catch(() => false);
check('the server really is down, so this is a true no-network test', !stillUp);
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));

let gotoFailed = '';
await page.goto(`${SPA}/index.html`, { waitUntil: 'domcontentloaded' })
  .catch((e) => { gotoFailed = e.message.slice(0, 120); });
check('the page itself is served from the cache with no network', !gotoFailed, gotoFailed);

// Poll for the boot to finish rather than sleeping a fixed time — and through
// page.evaluate, since waitForFunction runs in the isolated world.
let booted = false;
for (let i = 0; i < 40 && !booted; i += 1) {
  booted = await page.evaluate(() => document.querySelectorAll('#tabbar [data-tab]').length > 0);
  if (!booted) await page.waitForTimeout(250);
}

// `app.js` fades the cover and removes it 300ms later, so a check fired the
// instant the tab bar appears races that timer rather than testing anything.
let coverGone = false;
for (let i = 0; i < 12 && !coverGone; i += 1) {
  coverGone = await page.evaluate(() => !document.querySelector('#boot'));
  if (!coverGone) await page.waitForTimeout(200);
}

const seen = await page.evaluate(() => ({
  tabs: [...document.querySelectorAll('#tabbar [data-tab]')].map((t) => t.dataset.tab),
  screenChars: (document.querySelector('#screen')?.innerText || '').trim().length,
  bootStillUp: Boolean(document.querySelector('#boot')),
  bootText: (document.querySelector('#boot')?.innerText || '').trim().slice(0, 120),
}));

check('the app boots offline — the tab bar is there', seen.tabs.length > 0,
      `tabs=${JSON.stringify(seen.tabs)} bootCover=${seen.bootStillUp} ${seen.bootText}`);
check('all five tabs, so no screen module failed to load',
      seen.tabs.length === 5, JSON.stringify(seen.tabs));
check('a screen actually rendered', seen.screenChars > 0, `${seen.screenChars} chars`);
check('the boot cover is taken down, not left over the app', coverGone, seen.bootText);

// Every screen must open with no network — "every screen reads from the phone".
const reached = [];
for (const tab of ['map', 'plan', 'shop', 'prep', 'log']) {
  await page.evaluate((t) => document.querySelector(`#tabbar [data-tab="${t}"]`)?.click(), tab);
  await page.waitForTimeout(400);
  const chars = await page.evaluate(() => (document.querySelector('#screen')?.innerText || '').trim().length);
  reached.push(`${tab}:${chars}`);
}
check('every tab renders something offline', reached.every((r) => Number(r.split(':')[1]) > 0), reached.join(' '));

check('no page error was thrown', pageErrors.length === 0, pageErrors.join(' | '));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
await browser.close();
await killServer().catch(() => {});
process.exit(fail.length || pageErrors.length ? 1 : 0);

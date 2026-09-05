import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const APP = 'http://127.0.0.1:8123', AUTH = 'http://127.0.0.1:9099', PROJECT = 'travel-planner-3e0d3';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => localStorage.setItem('travel-planner:emulators', JSON.stringify({ auth: 9099, firestore: 8080 })));
const page = await ctx.newPage();
const warn = [];
page.on('console', (m) => { const t = m.text(); if (/travel-planner/.test(t)) warn.push(t.slice(0, 190)); });
const load = async (url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await page.waitForTimeout(1600);
  await page.evaluate(async () => {
    window.__store = await import('./js/store.js');
    window.__persist = await import('./js/persist.js');
    window.__nav = await import('./js/nav.js');
  });
};
await load(APP + '/index.html#map');
await page.evaluate(() => window.__persist.sendSignInEmail('locked@example.com'));
await page.waitForTimeout(900);
const { oobCodes } = await (await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)).json();
const mine = oobCodes.filter((c) => c.email === 'locked@example.com').pop();
await load(mine.oobLink.replace('http://localhost:9099', AUTH));
await page.waitForTimeout(1200);
const state = await page.evaluate(() => ({
  mode: window.__store.state.mode,
  stranded: window.__store.state.stranded,
  reason: window.__store.strandedReason(),
  signedIn: Boolean(window.__store.state.account),
}));
console.log('mode:      ' + state.mode);
console.log('signed in: ' + state.signedIn);
console.log('stranded:  ' + state.stranded);
console.log('reason:    ' + state.reason);
await page.evaluate(() => window.__nav.go('map'));
await page.waitForTimeout(900);
const banner = await page.locator('.stranded').innerText().catch(() => '(no banner)');
console.log('banner:    ' + banner.replace(/\n/g, ' '));
// `process.env.SC` was undefined whenever it was not exported, so this wrote
// a screenshot into a literal `undefined/` directory at the repo root. Default
// to the system temp dir instead: the frame is a debugging aid, not an
// artefact anyone commits.
await page.screenshot({ path: `${process.env.SC || '/tmp'}/locked-rules.png` });
console.log('warnings:  ' + JSON.stringify(warn.slice(0, 3)));
await browser.close();

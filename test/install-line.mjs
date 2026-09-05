// Batch 8 — the Android install line. OD-8, answered YES at one exact scope:
// Android only, one unobtrusive line on the trips home after a SECOND launch,
// no first-visit prompt, no banner, iOS not prompted.
//
// The scope really is the line alone, so this also asserts the three things
// the decision says NOT to touch: the manifest, the icons and the service
// worker. `beforeinstallprompt` is dispatched here as a real event, because
// that is the signal the app keys off — no user-agent sniffing, which is what
// makes "Android only" true without ever naming Android.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 200)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

/** A fresh phone, or one that has been opened before. */
const openPhone = async (launches = 0) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block',
  });
  await ctx.addInitScript((n) => {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
    if (n) localStorage.setItem('travel-planner:launches', String(n));
  }, launches);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.route(/tile\.openstreetmap\.org|gstatic|nominatim|open-meteo|frankfurter/, (r) => r.abort());
  await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    window.__store = await import('./js/store.js');
    window.__nav = await import('./js/nav.js');
    window.__install = await import('./js/install.js');
  });
  return { ctx, page, errs };
};

/** The event Chrome fires on an installable Android page, and nothing else. */
const fireInstallable = (page) => page.evaluate(async () => {
  const event = new Event('beforeinstallprompt');
  event.prompt = () => { window.__prompted = (window.__prompted || 0) + 1; };
  event.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(event);
  await new Promise((r) => setTimeout(r, 300));
});
const lineOn = (page) => page.evaluate(() => {
  const btn = document.querySelector('[data-act="install"]');
  const row = btn?.closest('.row');
  return btn ? {
    text: row?.textContent.replace(/\s+/g, ' ').trim(),
    action: btn.textContent.trim(),
    dismiss: !!row?.querySelector('[data-act="install-no"]'),
    ghost: /btn sm ghost/.test(btn.className),
    fontSize: getComputedStyle(row.querySelector('.grow')).fontSize,
  } : null;
});

// ============================== a first visit is never prompted
{
  const { ctx, page, errs } = await openPhone(0);
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(400);
  const before = await lineOn(page);
  check('a first visit shows nothing, before the browser has even said installable', !before);

  await fireInstallable(page);
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(500);
  const after = await lineOn(page);
  check('OD-8 · and still nothing on the FIRST launch, even when installable', !after,
    after ? after.text : '');
  const n = await page.evaluate(() => window.__install.launches());
  check('the launch really was counted', n === 1, String(n));
  check('no page errors on a phone that never sees the line', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ============================== the second launch, installable
{
  const { ctx, page, errs } = await openPhone(1);
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(400);
  const quiet = await lineOn(page);
  check('a second launch that is NOT installable still shows nothing', !quiet);

  await fireInstallable(page);
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(500);
  const line = await lineOn(page);
  check('OD-8 · the line appears on the second launch, when installable', !!line, line?.text);
  check('OD-8 · it is ONE line with one action, not a banner', line && line.dismiss && line.ghost,
    `${line?.action} ghost=${line?.ghost}`);
  check('OD-8 · unobtrusive — 11px soft, the same as the other quiet lines here',
    line?.fontSize === '11px', line?.fontSize);
  check('the action is a ghost, never an ink primary', line?.ghost, line?.action);

  // The browser's own bar is suppressed, and prompt() only runs from a tap.
  const auto = await page.evaluate(() => window.__prompted || 0);
  check('OD-8 · NOT a prompt — nothing was prompted automatically', auto === 0, String(auto));
  await page.evaluate(() => document.querySelector('[data-act="install"]').click());
  await page.waitForTimeout(400);
  const tapped = await page.evaluate(() => window.__prompted || 0);
  check('and prompt() runs only from a real tap on the line', tapped === 1, String(tapped));
  check('no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ============================== dismissing it, and it staying dismissed
{
  const { ctx, page } = await openPhone(3);
  await fireInstallable(page);
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(500);
  check('the line is up before dismissing', !!(await lineOn(page)));
  await page.evaluate(() => document.querySelector('[data-act="install-no"]').click());
  await page.waitForTimeout(400);
  check('dismissing removes it', !(await lineOn(page)));
  const stored = await page.evaluate(() => localStorage.getItem('travel-planner:install-dismissed'));
  check('and it is remembered, so it does not come back on the next launch', stored === '1', stored);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await page.waitForTimeout(900);
  await page.evaluate(async () => { window.__nav = await import('./js/nav.js'); window.__nav.go('trips'); });
  await page.waitForTimeout(400);
  check('confirmed across a relaunch', !(await lineOn(page)));
  await ctx.close();
}

// ============================== the scope: three things NOT touched
{
  const manifest = await fetch(`${APP}/manifest.webmanifest`);
  const body = await manifest.json();
  check('the manifest still serves 200 — it was never missing', manifest.status === 200, String(manifest.status));
  check('and still names its four icons', (body.icons || []).length === 4, String((body.icons || []).length));

  const sw = await (await fetch(`${APP}/sw.js`)).text();
  check('sw.js still adds assets individually, not with addAll',
    /cache\.add\(url\)\.catch/.test(sw) && !/addAll/.test(sw.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')));

  const install = await (await fetch(`${APP}/js/install.js`)).text();
  check('OD-8 · the line never sniffs the user agent — beforeinstallprompt IS the Android test',
    !/userAgent|Android|iPhone|iPad/i.test(install.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')));
  check('OD-8 · and it suppresses the browser\'s own bar', /preventDefault\(\)/.test(install));
  check('OD-8 · it never calls prompt() outside the tap handler',
    (install.match(/\.prompt\(\)/g) || []).length === 1);
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
await browser.close();
process.exit(fail.length ? 1 : 0);

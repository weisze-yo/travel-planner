// Deleting a sub route, and an already-archived stop, from the Plan
// screen's own edit mode — a different render path from sub.js's dedicated
// delete row (test/swipe-delete.mjs covers that one), and one with a real
// production bug of its own: plan.js's loopCard() and archive() built their
// conditional data-loop-row / data-plan-row attributes as a plain (untagged)
// template-literal chunk containing the attribute's own quote characters,
// then interpolated that whole chunk as an ordinary value into the `html`
// tagged template. `html`'s render() escapes every interpolated value that
// isn't wrapped in raw() — so the quotes meant to delimit the attribute got
// turned into &quot; entities, breaking the attribute's quoting. The browser
// still parsed it (as an unquoted value), decoding &quot; back to a literal
// " character as part of the value text — so the id silently arrived at
// deleteSubRoute()/deletePlanItem() wrapped in an extra pair of literal
// quote characters, which never matches any real row, so the delete
// silently no-ops. Everything downstream (the confirm dialog, the sync dot)
// looked completely normal, which is what made this so easy to miss: no
// error, no exception, no stuck/red sync state — the write is never even
// attempted, because the lookup failed before it ever got that far.
//
// Confirmed live with a real user report: swipe/bin/confirm all behaved
// correctly, but the sub route was never actually removed, 100% of the time,
// on a real iPhone — reproduced here by asserting on the actual DOM
// attribute value and the underlying store state, not just what the screen
// visually did.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium, devices } = pw;

const APP = 'http://127.0.0.1:8123';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n + (extra ? ` — ${String(extra).slice(0, 200)}` : ''));
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra && !ok ? ` — ${String(extra).slice(0, 200)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});

const cdp = await ctx.newCDPSession(page);
async function touch(type, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
}
async function swipeOpen(locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await locator.boundingBox();
  const startX = box.x + box.width - 20;
  const y = box.y + box.height / 2;
  await touch('touchStart', startX, y);
  for (let i = 1; i <= 10; i++) { await touch('touchMove', startX - (140 * i) / 10, y); await page.waitForTimeout(20); }
  await touch('touchEnd', startX - 140, y);
  await page.waitForTimeout(300);
}
async function tap(locator) {
  const box = await locator.boundingBox();
  await touch('touchStart', box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(50);
  await touch('touchEnd', box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
}

console.log('=== a sub route, deleted from Plan\'s own edit mode ===');
await page.evaluate(async () => {
  await window.__store.createTrip({ name: 'Plan delete regression', startDate: '2026-11-10', dayCount: 1 });
  await window.__store.captureStop(1, { input: 'Hallgrimskirkja, Reykjavik', time: '10:00', endTime: '11:00', kind: 'main' });
});
await page.waitForTimeout(1200);
const loop = await page.evaluate(() => {
  const l = window.__store.addSubRoute(1, { name: 'Old town loop' });
  return l ? { id: l.id, name: l.name } : null;
});
check('a sub route exists to delete', Boolean(loop?.id), JSON.stringify(loop));

await page.evaluate(() => window.__nav.go('plan'));
await page.waitForTimeout(500);
await page.evaluate(() => window.__store.setEditingPlan(true));
await page.waitForTimeout(400);

const loopRow = page.locator('[data-loop-row]');
check('the loop card is reachable in Plan edit mode', (await loopRow.count()) > 0);
const loopAttr = await page.evaluate(() => document.querySelector('[data-loop-row]')?.dataset.loopRow);
check('the rendered data-loop-row attribute is the clean id, not quote-corrupted', loopAttr === loop.id, loopAttr);

await swipeOpen(loopRow);
await tap(page.locator('[data-swipe-delete]'));
check('bin tap asks in the row', await page.evaluate(() => Boolean(document.querySelector('[data-loop-row] .swipe-ask'))));
await tap(page.locator('.swipe-ask-yes'));

const loopsLeft = await page.evaluate(() => window.__store.subRoutesFor(1).length);
check('the sub route is actually gone from state right after Delete', loopsLeft === 0, String(loopsLeft));
const domGone = await page.evaluate(() => document.querySelectorAll('[data-loop-row]').length === 0);
check('and the row is gone from the DOM', domGone);

console.log('\n=== an archived stop, permanently deleted from Plan\'s own edit mode ===');
// Reuses the stop already on the day from the sub-route case above, rather
// than geocoding a second place — this is testing the id-attribute bug, not
// live geocoding, and the sandbox's network access to Nominatim is flaky.
const stopId = await page.evaluate(() => {
  const day = window.__store.state.days.find((d) => d.dayNumber === 1);
  return day.items.find((i) => /hallgrimskirkja/i.test(i.name))?.id;
});
console.log('stop id reused:', JSON.stringify(stopId));
await page.evaluate((id) => window.__store.archivePlanItem(1, id), stopId);
await page.waitForTimeout(400);
await page.evaluate(() => window.__nav.go('plan'));
await page.waitForTimeout(500);
await page.evaluate(() => window.__store.setEditingPlan(true));
await page.waitForTimeout(400);

const planRow = page.locator('[data-plan-row]').first();
check('the archived stop is reachable in Plan edit mode', (await planRow.count()) > 0);
const planAttr = await page.evaluate(() => document.querySelector('[data-plan-row]')?.dataset.planRow);
check('the rendered data-plan-row attribute is the clean id, not quote-corrupted', planAttr === stopId, planAttr);

await swipeOpen(planRow);
await tap(page.locator('[data-swipe-delete]').first());
check('bin tap asks in the row', await page.evaluate(() => Boolean(document.querySelector('[data-plan-row] .swipe-ask'))));
await tap(page.locator('.swipe-ask-yes'));

const stopGone = await page.evaluate((id) => {
  const day = window.__store.state.days.find((d) => d.dayNumber === 1);
  return !(day.items || []).some((i) => i.id === id);
}, stopId);
check('the archived stop is actually gone after Delete', stopGone);

check('no page errors during the whole flow', pageErrors.length === 0, JSON.stringify(pageErrors));

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
await browser.close();
process.exit(fail.length ? 1 : 0);

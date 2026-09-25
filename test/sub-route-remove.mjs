// The ✕ that takes a place out of a sub route.
//
// §3.7 · F5 (b) made sub-route membership singular: `toggleSubRoutePlace`
// (a toggle against "whichever loop is in hand") became `setSubRoutePlace`
// (a set, with the loop named), and the second argument changed from a route
// OBJECT to a route ID, with `null` meaning "out of every loop on the day".
//
// `screens/sub.js` was not updated with it. Its `[data-drop]` handler went on
// calling `store.toggleSubRoutePlace(id, store.activeLoop())` — a function that
// no longer exists — so the ✕ in the sub route's edit mode threw
// `store.toggleSubRoutePlace is not a function` and did nothing at all.
//
// Nothing caught it. The rename is *described* in nearby-managing.mjs's header
// comment, but no harness has ever clicked that button, and a dead handler is
// invisible to every other kind of check: the markup renders, the module
// parses, and the click simply has no effect.
//
// So this drives the real button on the real screen and asserts the place is
// gone from the loop afterwards. It was proved to catch the bug by restoring
// the old call and watching it go red.
import { launch, blockOutside, APP } from './lib/runtime.mjs';

const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 220)}` : ''));
};

const browser = await launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block',
});
await ctx.addInitScript(() => {
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await blockOutside(page);
await page.goto(`${APP}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(800);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});

// The demo trip's Day 3 carries a sub route with places in it.
const opened = await page.evaluate(async () => {
  const s = window.__store;
  for (const day of s.state.days) {
    const loops = s.subRoutesFor(day.dayNumber);
    const loop = loops.find((l) => (l.placeIDs || []).length > 0);
    if (loop) {
      s.selectDay(day.dayNumber);
      s.selectLoop(loop.id);
      window.__nav.go('sub', { id: loop.id });
      return { dayNumber: day.dayNumber, loopID: loop.id, placeIDs: [...loop.placeIDs] };
    }
  }
  return null;
});
check('a sub route with places exists to test against', Boolean(opened), JSON.stringify(opened));
if (!opened) { console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`); await browser.close(); process.exit(1); }

await page.waitForTimeout(600);

// Edit mode is where the ✕ lives — it is deliberately not on the view screen.
await page.evaluate(() => document.querySelector('[data-act="toggle-edit"]')?.click());
await page.waitForTimeout(600);

const drops = await page.evaluate(() => [...document.querySelectorAll('[data-drop]')].map((b) => b.dataset.drop));
check('edit mode shows a ✕ per place in the sub route', drops.length > 0, `${drops.length} found`);
if (!drops.length) { console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`); await browser.close(); process.exit(1); }

const victim = drops[0];
const before = await page.evaluate(([id]) => (window.__store.subRouteByID(id)?.placeIDs || []).slice(), [opened.loopID]);

await page.evaluate(([id]) => document.querySelector(`[data-drop="${id}"]`)?.click(), [victim]);
await page.waitForTimeout(900);

const after = await page.evaluate(([id]) => (window.__store.subRouteByID(id)?.placeIDs || []).slice(), [opened.loopID]);

check('the ✕ takes that place out of the sub route',
      before.includes(victim) && !after.includes(victim),
      `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
check('and takes out only that one', after.length === before.length - 1, `${before.length} -> ${after.length}`);

// The place itself survives — it goes back to being saved, not deleted. That
// is the whole point of "out of every loop on the day leaves it saved".
const stillAPlace = await page.evaluate(([id]) => Boolean(window.__store.place(id)), [victim]);
check('the place still exists — it is removed from the loop, not deleted', stillAPlace);

check('no page error was thrown', pageErrors.length === 0, pageErrors.join(' | '));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

// Swipe-to-delete under a real touch gesture, not a mouse click.
//
// Every other check of this flow — including the one written for the
// Session 4 acceptance pass — drove the delete row with page.click(), which
// dispatches a mouse-style click straight at the bin regardless of whether a
// real swipe would ever have revealed it. That is not what an iPhone does.
// It cost a production bug: the sub route's delete row sits below several
// other fields in edit mode, so a phone user must scroll down to reach it,
// and the touch that starts the swipe often still carries a little vertical
// motion left over from that scroll. swipeToDelete's direction lock in
// web/js/screens/parts.js judged direction from a single early sample with a
// bare dy-vs-dx tie-break, so one unlucky pixel of vertical drift locked the
// gesture in as "that's a scroll" for good — dragging never got set back to
// true for the rest of that touch, and the row simply never opened. A
// mouse-driven or scripted straight-line drag never has that jitter, which
// is exactly why it went unseen.
//
// This drives the gesture with real CDP touch events (Input.dispatchTouchEvent
// — the actual touch/gesture pipeline a phone uses, not a synthesized
// PointerEvent and not page.click()) against a mobile-emulated context, with
// a deliberately imperfect path on the way in, then confirms:
//   - that realistic swipe still opens the row (the regression this guards)
//   - a clearly vertical drag still scrolls rather than being hijacked open
//   - the revealed bin, tapped with a real touch, asks in the row
//   - "Delete" really deletes and starts the undo bar
//   - no window.confirm() ever appears
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
const dialogs = [];
page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});

await page.evaluate(async () => {
  await window.__store.createTrip({ name: 'Swipe-delete regression', startDate: '2026-11-10', dayCount: 1 });
  await window.__store.captureStop(1, { input: 'Hallgrimskirkja, Reykjavik', time: '10:00', endTime: '11:00', kind: 'main' });
});
await page.waitForTimeout(1200);
const loop = await page.evaluate(() => {
  const l = window.__store.addSubRoute(1, { name: 'Old town loop' });
  return l ? { id: l.id, name: l.name } : null;
});
check('a sub route exists to delete', Boolean(loop?.id), JSON.stringify(loop));

await page.evaluate((loopID) => window.__nav.go('sub', { loopID }), loop.id);
await page.waitForTimeout(500);
await page.click('[data-act="toggle-edit"]');
await page.waitForTimeout(400);

const row = page.locator('[data-loop-row]');
await row.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const box = await row.boundingBox();
check('the delete row is reachable in edit mode', Boolean(box));

const cdp = await ctx.newCDPSession(page);
async function touch(type, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
}

// --- 1. A clearly vertical drag must still scroll, not pop the row open ---
{
  const x = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await touch('touchStart', x, startY);
  for (const dy of [8, 20, 40, 65, 95, 130]) {
    await touch('touchMove', x + (dy > 20 ? 2 : 0), startY - dy);
    await page.waitForTimeout(30);
  }
  await touch('touchEnd', x + 2, startY - 130);
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => document.querySelector('[data-loop-row]')?.className || '');
  check('a clearly vertical drag scrolls rather than opening the row', !state.includes('open'), state);
  // Settle back to the row before the next gesture.
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

// --- 2. A realistic finger swipe (a little vertical drift up front, then
//        clearly horizontal) must still open the row — this is the bug ---
{
  const b = await row.boundingBox();
  const startX = b.x + b.width - 20;
  const startY = b.y + b.height / 2;
  const path = [
    { dx: 3, dy: 5 }, { dx: 7, dy: 9 }, { dx: 20, dy: 10 },
    { dx: 45, dy: 8 }, { dx: 75, dy: 4 }, { dx: 110, dy: 2 }, { dx: 140, dy: 0 },
  ];
  await touch('touchStart', startX, startY);
  for (const p of path) {
    await touch('touchMove', startX - p.dx, startY + p.dy);
    await page.waitForTimeout(35);
  }
  await touch('touchEnd', startX - 140, startY);
  await page.waitForTimeout(400);

  const opened = await page.evaluate(() => {
    const r = document.querySelector('[data-loop-row]');
    return { classes: r?.className || '', transform: r?.querySelector('.swipe-face')?.style.transform || '' };
  });
  check('a realistic finger swipe (early vertical drift, then horizontal) opens the row',
    opened.classes.includes('open') && opened.classes.includes('latched'), JSON.stringify(opened));
}

// --- 3. The revealed bin, tapped with a real touch, asks in the row ---
const binBox = await page.locator('[data-swipe-delete]').boundingBox();
await touch('touchStart', binBox.x + binBox.width / 2, binBox.y + binBox.height / 2);
await page.waitForTimeout(60);
await touch('touchEnd', binBox.x + binBox.width / 2, binBox.y + binBox.height / 2);
await page.waitForTimeout(400);
const asking = await page.evaluate(() => Boolean(document.querySelector('[data-loop-row] .swipe-ask')));
check('tapping the revealed bin asks in the row (no native dialog)', asking && dialogs.length === 0, JSON.stringify(dialogs));

// --- 4. "Delete" really deletes, and the undo bar appears ---
const yesBox = await page.locator('.swipe-ask-yes').boundingBox();
await touch('touchStart', yesBox.x + yesBox.width / 2, yesBox.y + yesBox.height / 2);
await page.waitForTimeout(60);
await touch('touchEnd', yesBox.x + yesBox.width / 2, yesBox.y + yesBox.height / 2);
await page.waitForTimeout(600);

const remaining = await page.evaluate(() => window.__store.subRoutesFor(1).length);
check('the sub route is actually gone', remaining === 0, String(remaining));
const undo = await page.evaluate(() => {
  const el = document.querySelector('#undo');
  return { hidden: el?.hasAttribute('hidden'), text: el?.textContent?.trim() || '' };
});
check('the undo bar appears and names what was deleted', undo.hidden === false && /old town loop/i.test(undo.text), JSON.stringify(undo));
check('window.confirm() was never used', dialogs.length === 0, JSON.stringify(dialogs));
check('no page errors during the whole flow', pageErrors.length === 0, JSON.stringify(pageErrors));

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
await browser.close();
process.exit(fail.length ? 1 : 0);

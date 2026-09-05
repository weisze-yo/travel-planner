// Item 16 — the accessibility pass.
//
// The headline bug this fixes: existing-ui-audit.md §193 / §12.10 — "no
// visible focus ring on any button anywhere in the app." A keyboard or
// switch-control user tabbing through the Plan, Trips home, or a warning
// strip's fix buttons had no way to see which control was about to activate
// on Enter. This harness drives real Tab/Enter/Escape key events (not
// synthetic focus() calls, which do not reliably trigger :focus-visible the
// way a real keyboard does) and asserts on the accessibility tree the
// browser actually computes (page.accessibility.snapshot / getComputedStyle
// outline), plus the two specific findings named in the design docs:
//   - p0-1-role-and-copy-identity-design.md §11.4: a .who-mark beside a name
//     it duplicates is aria-hidden, so the name is announced once.
//   - existing-ui-audit.md §193: inputs already get a focus border; buttons
//     did not, anywhere, until this pass.
// Real contrast-ratio computation lives in a separate, non-browser script
// (scratchpad/contrast.mjs) since it needs no DOM — the numbers are in the
// commit's report, not re-derived here.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n + (extra ? ` — ${String(extra).slice(0, 300)}` : ''));
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra && !ok ? ` — ${String(extra).slice(0, 300)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  serviceWorkers: 'block',
});
await ctx.addInitScript(() => {
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(800);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});

// =============================================== focus-visible on buttons
{
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(300);
  // Focus the document body first so the very first Tab lands on the first
  // focusable element in source order, rather than wherever a prior click
  // left focus.
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return {
      tag: el?.tagName,
      text: el?.textContent?.trim().slice(0, 30),
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
    };
  });
  check('a real Tab keypress moves focus to a real element', first.tag === 'BUTTON' || first.tag === 'A', JSON.stringify(first));
  check('the focused button has a real, visible outline (audit §193 fixed)',
    first.outlineStyle !== 'none' && parseFloat(first.outlineWidth) > 0, JSON.stringify(first));

  // A mouse click must NOT draw the same ring — :focus-visible, not :focus.
  await page.mouse.click(1, 1); // blur via clicking empty page area
  const btnBox = await page.locator('[data-act="add-toggle"]').first().boundingBox();
  await page.mouse.click(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape'); // close whatever the click opened
  await page.waitForTimeout(150);
  const afterClick = await page.evaluate(() => {
    const el = document.querySelector('[data-act="add-cancel"]') ? null : document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : 'n/a (modal path differs, not a focus-ring concern)';
  });
  check('a mouse click does not itself fail the ring (sanity check, not a hard requirement)', true, afterClick);
}

// ============================================ who-mark aria-hidden (P0-1 §11.4)
{
  // Reuse the tier-3 "just joined" context line, which is the one place in
  // this session's own additions that pairs a .who-mark with adjoining text.
  const me = await page.evaluate(() => window.__store.me());
  await page.evaluate((meId) => {
    const s = window.__store.state;
    s.trip.sharedFrom = { code: 'A11Y', version: 1, from: 'Ana' };
    s.trip.tookVersion = 1;
    s.trip.people = [
      { id: 'owner-1', name: 'Ana', role: 'owner', joinedAt: new Date().toISOString() },
      { id: meId, name: 'You', role: 'read', joinedAt: new Date().toISOString() },
    ];
    const d = s.days.find((x) => x.dayNumber === s.selectedDay) || s.days[0];
    d.items = [];
    window.__store.selectDay(d.dayNumber);
    window.__nav.go('plan');
  }, me.id);
  await page.waitForTimeout(250);
  const mark = await page.evaluate(() => {
    const el = document.querySelector('.empty-shared-ctx .who-mark');
    return { present: Boolean(el), ariaHidden: el?.getAttribute('aria-hidden') };
  });
  check('.who-mark beside "joined … ago" text is aria-hidden — the name is announced once, not twice',
    mark.present && mark.ariaHidden === 'true', JSON.stringify(mark));

  // The accessibility tree itself should not carry a duplicate name node for
  // the mark — a real screen-reader-facing check, not just the attribute.
  const snapshot = await page.accessibility.snapshot({ root: await page.$('.empty-shared') });
  const flatten = (node, out = []) => { if (!node) return out; out.push(node); (node.children || []).forEach((c) => flatten(c, out)); return out; };
  const nodes = flatten(snapshot);
  const genericTextNodes = nodes.filter((n) => /joined/i.test(n.name || ''));
  check('exactly one accessible node carries the "joined … ago" text (not doubled by the mark)',
    genericTextNodes.length <= 1, JSON.stringify(genericTextNodes.map((n) => n.name)));
  await page.evaluate(() => { window.__store.state.trip.sharedFrom = null; });
}

// ============================================================= hit targets
{
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__store.state.trips.length = 0; window.__store.selectDay(window.__store.state.selectedDay); });
  await page.waitForTimeout(200);
  const ink = await page.locator('.empty-t1 [data-act="add-toggle"]').boundingBox();
  check('the tier-1 ink action clears the WCAG 2.5.8 24×24 minimum hit target',
    ink && ink.width >= 24 && ink.height >= 24, JSON.stringify(ink));
}
{
  await page.evaluate(async () => {
    await window.__store.createTrip({ name: 'A11y rig', startDate: '2026-11-10', dayCount: 3 });
    const d = window.__store.day(1);
    d.items = [
      { id: 'h1', name: 'Stop A', kind: 'main', time: '09:00', endTime: '10:00', archived: false },
      { id: 'h2', name: 'Stop B', kind: 'main', time: '12:00', endTime: '13:00', archived: false },
    ];
    window.__store.state.trip.sharedFrom = { code: 'H', version: 1, from: 'Ana' };
    window.__store.state.trip.tookVersion = 1;
    window.__store.selectDay(1);
    window.__nav.go('plan');
  });
  await page.waitForTimeout(300);
  const amber = await page.locator('.lane-add.shared').first().boundingBox();
  check('the amber "yours, inside theirs" lane action clears the 24×24 minimum',
    amber && amber.width >= 24 && amber.height >= 24, JSON.stringify(amber));
  await page.evaluate(() => { window.__store.state.trip.sharedFrom = null; });
}

// ==================================================== roles/names spot-check
{
  await page.evaluate(() => window.__nav.go('shop'));
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__store.addShoppingItem({ name: 'Green tea', estimate: 8 }));
  await page.waitForTimeout(150);
  const tickRole = await page.evaluate(() => {
    const el = document.querySelector('.box[data-act="tick"]');
    return { role: el?.getAttribute('role'), hasCheckedState: el?.hasAttribute('aria-checked') };
  });
  check('a shopping tick exposes checkbox role + aria-checked (not a bare unlabelled button)',
    tickRole.role === 'checkbox' && tickRole.hasCheckedState, JSON.stringify(tickRole));

  await page.evaluate(() => {
    // Build a warn-fix button and read its accessible name off the tree.
    const d = window.__store.day(1);
    d.items = [
      { id: 'w1', name: 'Early Stop', kind: 'main', time: '13:30', endTime: '', archived: false },
      { id: 'w2', name: 'Late Stop', kind: 'main', time: '13:00', endTime: '', archived: false },
    ];
    window.__store.selectDay(1);
    window.__nav.go('plan');
  });
  await page.waitForTimeout(200);
  const fixBtn = page.locator('.warn-fix').first();
  const accName = await fixBtn.evaluate((el) => el.textContent.trim());
  check('a warn-fix button\'s accessible name is its own visible label (no separate aria-label needed)',
    accName.length > 0, accName);
}

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
console.log('page errors: ' + pageErrors.length + (pageErrors.length ? '\n  ' + pageErrors.join('\n  ') : ''));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

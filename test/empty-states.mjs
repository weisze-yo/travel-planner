// Item 02 — the three-tier empty-state system.
//
// The grammar (new-feature-design.md §2, reconciled in
// p0-3-system-sign-off.md §1): every empty container sorts into one of three
// tiers by a single testable question. This harness does not render the
// helpers in isolation — it really empties each container (through the
// store, the same way the screens themselves derive state) and asserts on
// which TIER the screen actually resolves to, using the exact source tests
// from sign-off §1.2:
//
//   tier 1 — `!trip.sharedFrom`, the container is yours to write to
//   tier 3 — `trip.sharedFrom` is set AND the kind is one of SHARED_KINDS
//   tier 3, "just joined" — additionally `tookVersion === sharedFrom.version`
//            and `pendingUpdate() === null`
//
// The bug this guards against: a future change that lets a joined trip's
// empty day/place/must-see silently render the tier-1 ink CTA (or a tier-2
// grey sentence) again, which would put an "act now" primary button on a
// screen where the emptiness is someone else's doing — the exact confusion
// the tier system exists to prevent. It also guards the two hand-written
// contradictions the design's own reconciliation flagged and resolved:
// trips home never draws a second real control ("arrive by link" is copy,
// not a button), and a stopless shared day never draws the amber
// "+ Plan free time here" action (S-4).
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
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(800);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});

// A poll helper in the *main* world (HANDOFF trap #5: page.waitForFunction
// runs in an isolated world with its own module copy).
async function until(fn, { timeout = 4000, step = 50 } = {}) {
  const start = Date.now();
  for (;;) {
    if (await page.evaluate(fn)) return true;
    if (Date.now() - start > timeout) return false;
    await page.waitForTimeout(step);
  }
}

// A single repaint trigger that touches nothing but `notify()` — unlike
// `refreshTrips()`, which re-derives `state.trips` from the backend and
// would stomp a manually-emptied trips list straight back to full.
const repaint = () => page.evaluate(() => window.__store.selectDay(window.__store.state.selectedDay));

// ===================================================== 1A — trips home, tier 1
{
  await page.evaluate(() => window.__nav.go('trips'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__store.state.trips.length = 0; });
  await repaint();
  await page.waitForTimeout(150);

  const empty = await page.evaluate(() => {
    const block = document.querySelector('.empty-t1');
    return {
      hasT1: Boolean(block),
      hasOldEmpty: Boolean(document.querySelector('.empty')),
      title: block?.querySelector('.empty-t1-title')?.textContent.trim() || '',
      inkButtons: [...(block?.querySelectorAll('.btn.ink') || [])].map((b) => b.dataset.act),
      hint: block?.querySelector('.empty-t1-hint')?.textContent.trim() || '',
    };
  });
  check('trips home resolves to tier 1 when the account has no trips', empty.hasT1, JSON.stringify(empty));
  check('the old colourless tier-2 block is gone from trips home', !empty.hasOldEmpty, JSON.stringify(empty));
  check('names the missing thing ("No trips yet")', /no trips yet/i.test(empty.title), empty.title);
  check('exactly one ink action, reusing the header\'s own "+ New trip"',
    empty.inkButtons.length === 1 && empty.inkButtons[0] === 'add-toggle', JSON.stringify(empty.inkButtons));
  check('1A reconciliation: "arrive by link" is copy, not a second control (§1.3)',
    /arrives by opening their link/i.test(empty.hint), empty.hint);

  // The ink action really works — pressing it opens the New trip modal,
  // proving rule 3 ("reuses the action that already exists") end to end.
  await page.click('.empty-t1 [data-act="add-toggle"]');
  await page.waitForTimeout(200);
  const modalOpen = await page.evaluate(() => Boolean(document.querySelector('#new-trip-name')));
  check('the tier-1 block\'s ink action really opens New trip', modalOpen);
  await page.click('[data-act="add-cancel"]');
  await page.waitForTimeout(150);
}

// Build a real trip to work the rest of the checks against.
const trip = await page.evaluate(async () => {
  const id = await window.__store.createTrip({ name: 'Empty-state rig', startDate: '2026-11-10', dayCount: 6 });
  return { id, dayCount: window.__store.state.trip?.dayCount };
});
check('a fresh 6-day trip exists to test against', Boolean(trip.id) && trip.dayCount === 6, JSON.stringify(trip));
await page.waitForTimeout(300);

// =========================================================== 1B — Plan, tier 1
{
  await page.evaluate(() => { window.__store.selectDay(2); window.__nav.go('plan'); });
  await page.waitForTimeout(300);
  const t1 = await page.evaluate(() => ({
    laneStub: Boolean(document.querySelector('.lane-stub')),
    ink: document.querySelector('.btn.ink')?.dataset.act,
    shared: Boolean(document.querySelector('.empty-shared')),
  }));
  check('an ordinary empty day (not shared) resolves to tier 1 — dashed silhouette + one ink action',
    t1.laneStub && t1.ink === 'add-open' && !t1.shared, JSON.stringify(t1));
}

// ===================================================== 1F — Plan, tier 3 (shared)
{
  const me = await page.evaluate(() => window.__store.me());
  await page.evaluate((meId) => {
    const s = window.__store.state;
    s.trip.sharedFrom = { code: 'TEST-CODE', version: 3, from: 'Ana' };
    s.trip.tookVersion = 1; // not just-joined: a real gap between versions
    s.trip.people = [
      { id: 'owner-1', name: 'Ana', role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
      { id: meId, name: 'You', role: 'read', joinedAt: '2026-01-01T00:00:00.000Z' },
    ];
  }, me.id);
  await repaint();
  await page.waitForTimeout(200);

  const t3 = await page.evaluate(() => {
    const card = document.querySelector('.empty-shared');
    const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
    return {
      hasShared: Boolean(card),
      hasT1: Boolean(document.querySelector('.empty-t1, .lane-stub')),
      inkInside: card ? Boolean(card.querySelector('.btn.ink')) : null,
      title: norm(card?.querySelector('.empty-shared-t')?.textContent),
      body: norm(card?.querySelector('.empty-shared-b')?.textContent),
      hasCtx: Boolean(card?.querySelector('.empty-shared-ctx')),
      anyAction: card ? Boolean(card.querySelector('button')) : null,
    };
  });
  check('source test §1.2: sharedFrom set + kind ("days") in SHARED_KINDS → tier 3',
    t3.hasShared && !t3.hasT1, JSON.stringify(t3));
  check('tier 3 is never ink', t3.inkInside === false, JSON.stringify(t3));
  check('states what was sent, names the day', /day 2 is empty in the copy you were sent/i.test(t3.title), t3.title);
  check('not "just joined" (version gap + tookVersion mismatch) → the two body sentences, not the context line',
    !t3.hasCtx && /anything ana adds arrives with the next update/i.test(t3.body)
      && /nothing changes on your side until you have looked through it/i.test(t3.body), JSON.stringify(t3));
  check('S-4: a stopless shared day offers no action at all — dayTimeline() cannot build a lane with no stops',
    t3.anyAction === false, JSON.stringify(t3));

  // The "just joined" branch: tookVersion === sharedFrom.version and no
  // update pending → the context line replaces the body sentences.
  await page.evaluate(() => { window.__store.state.trip.tookVersion = 3; });
  await repaint();
  await page.waitForTimeout(150);
  const justJoined = await page.evaluate(() => {
    const card = document.querySelector('.empty-shared');
    const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
    return {
      hasCtx: Boolean(card?.querySelector('.empty-shared-ctx')),
      whoMarkHidden: card?.querySelector('.empty-shared-ctx .who-mark')?.getAttribute('aria-hidden'),
      ctxText: norm(card?.querySelector('.empty-shared-ctx')?.textContent),
      hasBody: Boolean(card?.querySelector('.empty-shared-b')),
    };
  });
  check('"just joined" (tookVersion === sharedFrom.version, no pending update) shows the context line instead',
    justJoined.hasCtx && !justJoined.hasBody, JSON.stringify(justJoined));
  check('the context line names no updates yet', /no updates yet/i.test(justJoined.ctxText), justJoined.ctxText);
  check('the who-mark beside it is aria-hidden (item 16): the name is not announced twice',
    justJoined.whoMarkHidden === 'true', JSON.stringify(justJoined));
}

// ================================================= lane amber action, tier 3
{
  // A day with two stops and a real gap between them, so dayTimeline()
  // actually produces a lane — this is the one case S-4 says CAN carry an
  // action, because the app can actually honour it.
  await page.evaluate(() => {
    const s = window.__store.state;
    const d = s.days.find((x) => x.dayNumber === 4);
    d.items = [
      { id: 'a1', name: 'Harbour Market', kind: 'main', time: '09:00', endTime: '10:00', archived: false },
      { id: 'a2', name: 'Old Clocktower', kind: 'main', time: '12:00', endTime: '13:00', archived: false },
    ];
    s.selectedDay = 4;
  });
  await repaint();
  await page.waitForTimeout(200);

  const lane = await page.evaluate(() => {
    const btn = document.querySelector('.lane-add.shared');
    return { present: Boolean(btn), label: btn?.textContent.trim() || '', editing: btn ? !document.querySelector('[data-act="toggle-edit"][aria-pressed="true"]') : null };
  });
  check('a shared day WITH stops and a real gap gets the amber "yours, inside theirs" action, outside edit mode',
    lane.present, JSON.stringify(lane));
  check('exact copy from frame 1F', lane.label === '+ Plan free time here', lane.label);

  // It really works: tapping it opens the same "New sub route" sheet the
  // edit-mode lane-add already uses — no new control was introduced.
  await page.click('.lane-add.shared');
  await page.waitForTimeout(200);
  const sheetOpen = await page.evaluate(() => document.querySelector('.push-title')?.textContent.trim());
  check('reuses the existing new-sub-route action (rule 3: no new control)', sheetOpen === 'New sub route', sheetOpen);
  await page.click('[data-act="lane-cancel"]');
  await page.waitForTimeout(200);
}

// clear the shared flag before the rest of the (non-shared) checks
await page.evaluate(() => { window.__store.state.trip.sharedFrom = null; });
await repaint();
await page.waitForTimeout(150);

// ===================================================== 1D — Shop, tier 1 + rule 6
{
  await page.evaluate(() => { window.__store.state.shopping.length = 0; window.__nav.go('shop'); });
  await page.waitForTimeout(300);
  const empty = await page.evaluate(() => ({
    t1: Boolean(document.querySelector('.empty-t1')),
    footer: Boolean(document.querySelector('.footer-card')),
    ink: document.querySelector('.empty-t1 .btn.ink')?.dataset.act,
    filterOpacity: getComputedStyle(document.querySelector('.chiprow').closest('.head')).opacity,
  }));
  check('an empty shopping list resolves to tier 1', empty.t1, JSON.stringify(empty));
  check('rule 6: the footer spend card is REMOVED when the list is empty, not zeroed', !empty.footer, JSON.stringify(empty));
  check('reuses the existing "+ Add" action', empty.ink === 'add-toggle', empty.ink);
  check('rule 7: filters stay visible, held at ~45%', Math.abs(Number(empty.filterOpacity) - 0.45) < 0.02, empty.filterOpacity);

  // Add one item back — the footer must reappear (proves it is conditional,
  // not just deleted from the template).
  await page.evaluate(() => window.__store.addShoppingItem({ name: 'Ginger tea', estimate: 12 }));
  await repaint();
  await page.waitForTimeout(200);
  const withItem = await page.evaluate(() => Boolean(document.querySelector('.footer-card')));
  check('the footer card reappears once the list is not empty', withItem);
}

// ========================================================== 1C — Log, tier 2
{
  // Matches the artboard's own worked example exactly: day 3 of 6, nothing
  // written anywhere yet.
  await page.evaluate(() => {
    window.__store.state.trip.currentDay = 3;
    window.__store.state.log.length = 0;
    window.__nav.go('log');
  });
  await page.waitForTimeout(300);
  const empty = await page.evaluate(() => {
    const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
    const rows = [...document.querySelectorAll('.day-card-head')];
    return {
      hasEmptySentence: Boolean(document.querySelector('.empty')),
      rowCount: rows.length,
      rowLabels: rows.map((r) => norm(r.querySelector('.log-day')?.textContent)),
      inkOnRow: rows.map((r) => r.querySelector('.btn.ink, .btn.ghost')?.className.includes('ink')),
      remaining: norm(document.querySelector('.scroll .f11.soft')?.textContent),
    };
  });
  check('tier 2: no colour, the existing .empty sentence', empty.hasEmptySentence, JSON.stringify(empty));
  check('the days-so-far scaffold shows exactly "today" many rows (currentDay 3)', empty.rowCount === 3, JSON.stringify(empty));
  check('ink only on today\'s own row', JSON.stringify(empty.inkOnRow) === JSON.stringify([false, false, true]), JSON.stringify(empty.inkOnRow));
  check('closes with the remaining days named, verbatim to the artboard',
    /days 4 to 6 have not happened yet/i.test(empty.remaining), empty.remaining);
}

// ============================================ dest tabs — tier 2/3 (Info, Must-see)
{
  // A place with nothing filled in, on a NON-shared trip first (tier 2).
  await page.evaluate(async () => {
    const r = await window.__store.captureStop(1, { input: 'Quiet Pier', time: '09:00', endTime: '10:00', kind: 'main' });
    window.__itemID = r.saved ? window.__store.day(1).items.find((i) => i.name === 'Quiet Pier').id : null;
  });
  await page.evaluate(() => window.__nav.go('dest', { itemID: window.__itemID }));
  await page.waitForTimeout(300);
  const infoT2 = await page.evaluate(() => ({
    dashed: document.querySelector('[data-act="edit-facts"]')?.className || '',
    shared: Boolean(document.querySelector('.empty-shared')),
  }));
  check('Info tab, non-shared, nothing known → tier 2 with the .btn-dashed family',
    infoT2.dashed.includes('btn-dashed') && !infoT2.shared, JSON.stringify(infoT2));

  // Now the same place, but the trip is a joined copy → tier 3.
  await page.evaluate(() => { window.__store.state.trip.sharedFrom = { code: 'X', version: 1, from: 'Ana' }; window.__store.state.trip.tookVersion = 1; });
  await repaint();
  await page.waitForTimeout(200);
  const infoT3 = await page.evaluate(() => {
    const card = document.querySelector('.empty-shared');
    return { present: Boolean(card), title: card?.querySelector('.empty-shared-t')?.textContent.trim() || '' };
  });
  check('Info tab, joined + empty ("places" is a SHARED_KIND) → tier 3', infoT3.present, JSON.stringify(infoT3));
  check('names the place', /quiet pier/i.test(infoT3.title), infoT3.title);

  await page.evaluate(() => window.__nav.go('dest', { itemID: window.__itemID })); // reload panel state, land on info again
  await page.click('[data-panel="mustsee"]');
  await page.waitForTimeout(200);
  const shotsT3 = await page.evaluate(() => Boolean(document.querySelector('.empty-shared')));
  check('Must-see tab, joined + empty ("mustSee" is a SHARED_KIND) → tier 3', shotsT3);

  await page.click('[data-panel="shop"]');
  await page.waitForTimeout(200);
  const shopStaysT1 = await page.evaluate(() => ({
    shared: Boolean(document.querySelector('.empty-shared')),
    dashed: Boolean(document.querySelector('[data-act="add-item"].btn-dashed')),
  }));
  check('Shop tab NEVER goes tier 3, even joined — shopping is a PRIVATE_KIND, never in a snapshot',
    !shopStaysT1.shared && shopStaysT1.dashed, JSON.stringify(shopStaysT1));

  await page.evaluate(() => { window.__store.state.trip.sharedFrom = null; });
  await repaint();
}

// ================================================================ Nearby screen
{
  await page.evaluate(() => window.__nav.go('nearby', { dayScope: true }));
  await page.waitForTimeout(250);
  const notShared = await page.evaluate(() => ({
    plainEmpty: Boolean(document.querySelector('.empty')),
    shared: Boolean(document.querySelector('.empty-shared')),
  }));
  check('day-wide Nearby, not shared, empty → tier 1/2 plain block', notShared.plainEmpty && !notShared.shared, JSON.stringify(notShared));

  await page.evaluate(() => { window.__store.state.trip.sharedFrom = { code: 'X', version: 1, from: 'Ana' }; window.__store.state.trip.tookVersion = 1; window.__nav.go('nearby', { dayScope: true }); });
  await page.waitForTimeout(250);
  const shared = await page.evaluate(() => Boolean(document.querySelector('.empty-shared')));
  check('day-wide Nearby, joined + empty ("places" is a SHARED_KIND) → tier 3', shared);
  await page.evaluate(() => { window.__store.state.trip.sharedFrom = null; });
}

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
console.log('page errors: ' + pageErrors.length + (pageErrors.length ? '\n  ' + pageErrors.join('\n  ') : ''));
console.log('console errors: ' + consoleErrors.length + (consoleErrors.length ? '\n  ' + consoleErrors.join('\n  ') : ''));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

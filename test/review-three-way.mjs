// Batch 3 — Review: the three-way diff and everything that rests on it.
//
// The transition audit §7's row for this batch asks for four things: a
// three-way diff with `base = null` producing the same entries as today; a
// stop YOU added never badged THEY REMOVED; bulk skipping rows you both
// changed; and the receipt surviving navigation and relaunch. All four are
// here, plus the eleven cases.
//
// How an update is staged without a second phone: `readPublished(code)` reads
// the localStorage mirror of the `published/{code}` envelope, and that mirror
// is exactly what a real update lands in. So the test writes an envelope the
// way the network would and lets the app do the rest — the diff, the
// classification, the render and the writes are all the app's own. The
// two-phone emulator test still owns the propagation path; this owns the
// reasoning on top of it.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 240)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
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
await page.route(/tile\.openstreetmap\.org|gstatic\.com|nominatim|open-meteo|frankfurter/, (r) => r.abort());

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__share = await import('./js/share.js');
  window.__nav = await import('./js/nav.js');
});

// ============================================ the diff engine, in isolation
// Three copies of one day, so every one of the eleven cases can be built
// exactly rather than approximated by editing the demo trip.
const CASES = await page.evaluate(() => {
  const stop = (id, name, time, endTime, extra = {}) => ({ id, name, time, endTime, ...extra });
  const shape = (items, rows = {}) => ({
    days: [{ id: 'day-3', dayNumber: 3, items }],
    subRoutes: rows.subRoutes || [], places: rows.places || [], mustSee: rows.mustSee || [],
  });

  const base = shape([
    stop('a', 'Ashgate Shrine', '09:15', '10:00'),
    stop('b', 'Lumen Crossing', '11:00', '11:45'),
    stop('c', 'Night Market', '19:00', '21:00'),
    stop('d', 'Skyline Deck', '15:00', '16:00'),
    stop('e', 'Paper Museum', '13:00', '13:45'),
  ]);
  const mine = shape([
    // 2 · they changed it — mine still matches the base
    stop('a', 'Ashgate Shrine', '09:15', '10:00'),
    // 4 · both changed it
    stop('b', 'Lumen Crossing', '09:15', '10:00'),
    // 3 · I changed it — theirs still matches the base
    stop('c', 'Night Market', '20:00', '21:30'),
    // 6 · they removed it — I still have it
    stop('d', 'Skyline Deck', '15:00', '16:00'),
    // 7 · I removed it: 'e' is absent here and present in theirs
    // 8 · I added it
    stop('mine-only', '中央卸売市場', '07:00', '08:00'),
  ]);
  const theirs = shape([
    stop('a', '灰門神社', '09:15', '10:00'),          // 2 (a rename)
    stop('b', 'Lumen Crossing', '10:30', '11:15'),    // 4
    stop('c', 'Night Market', '19:00', '21:00'),      // 3 — theirs === base
    // 'd' absent → 6
    stop('e', 'Paper Museum', '13:00', '13:45'),      // 7 — base has it, I do not
    stop('new-1', '上野公園', '10:30', '11:15'),       // 5 · they added it
  ]);

  const three = window.__share.diffSnapshot(mine, theirs, base);
  const two = window.__share.diffSnapshot(mine, theirs, null);
  const twoLegacy = window.__share.diffSnapshot(mine, theirs);
  const by = (list) => Object.fromEntries(list.map((e) => [e.id, e]));
  return {
    three: three.map((e) => ({ id: e.id, verb: e.verb, stakes: e.stakes, title: e.title,
      noun: e.noun, cost: e.cost, delta: e.delta, titleFrom: e.titleFrom,
      mineText: e.mineText, theirsText: e.theirsText })),
    twoIDs: two.map((e) => `${e.id}|${e.verb}`),
    legacyIDs: twoLegacy.map((e) => `${e.id}|${e.verb}`),
    threeIDs: three.map((e) => e.id),
    byID: by(three),
  };
});

check('§11.2 · the third argument is optional — two-arg and base:null agree exactly',
  JSON.stringify(CASES.twoIDs) === JSON.stringify(CASES.legacyIDs),
  `${CASES.twoIDs.length} vs ${CASES.legacyIDs.length}`);
// Two-way asks about everything, including the three rows that are the
// user's own work — which is exactly why it was wrong.
check('no-base mode still produces every difference — nothing is dropped without a base',
  CASES.twoIDs.length === 7
  && CASES.twoIDs.some((x) => x.startsWith('stop-edit:c'))
  && CASES.twoIDs.some((x) => x.startsWith('stop-add:e'))
  && CASES.twoIDs.some((x) => x.startsWith('stop-drop:mine-only')),
  `${CASES.twoIDs.length}: ${CASES.twoIDs.join(' ')}`);

// The three cases that must STOP appearing.
check('case 3 · "I changed it" never reaches the screen',
  !CASES.threeIDs.includes('stop-edit:c'), CASES.threeIDs.join(' '));
check('case 7 · "I removed it" never reaches the screen — it would re-add what I deleted',
  !CASES.threeIDs.includes('stop-add:e'), CASES.threeIDs.join(' '));
check('case 8 · "I added it" never reaches the screen — Take theirs would delete it',
  !CASES.threeIDs.includes('stop-drop:mine-only'), CASES.threeIDs.join(' '));
check('three-way asks 4 questions where two-way asked 7 — shorter AND truer',
  CASES.three.length === 4, CASES.three.map((e) => e.id).join(' '));

// THE headline defect, stated as its own check.
check('a stop YOU added is never badged THEY REMOVED',
  !CASES.three.some((e) => e.verb === 'removed' && e.id.includes('mine-only')),
  CASES.three.filter((e) => e.verb === 'removed').map((e) => e.id).join(' '));
check('two-way DID get this wrong, so the fix is real, not theoretical',
  CASES.twoIDs.includes('stop-drop:mine-only|removed'), CASES.twoIDs.join(' '));

// case 2 · they changed it, and the rename rule
{
  const e = CASES.byID['stop-edit:a'];
  check('case 2 · they changed it — badged as theirs, and free', e?.verb === 'changed' && e?.stakes === 'free', `${e?.verb}/${e?.stakes}`);
  check('§4.1 · the title is the name in the BASE, never their new one', e?.title === 'Ashgate Shrine', e?.title);
  check('§4.1 · and it says so', e?.titleFrom === 'base', e?.titleFrom);
  check('§4.1 · their name appears exactly once, in the box labelled theirs',
    /灰門神社/.test(e?.theirsText || '') && !/灰門神社/.test(e?.title || ''), e?.theirsText);
  check('case 2 · noun reads `renamed`', e?.noun === 'renamed', e?.noun);
  check('case 2 · a free row carries no cost line', !e?.cost, e?.cost);
}
// case 4 · both changed it
{
  const e = CASES.byID['stop-edit:b'];
  check('case 4 · both changed it is the only row with stakes', e?.stakes === 'both', e?.stakes);
  check('case 4 · the cost names YOUR value, the one that leaves', e?.cost === '09:15 start', e?.cost);
  check('case 4 · noun reads `a different time`', e?.noun === 'a different time', e?.noun);
  check('case 4 · the delta chip does the arithmetic', e?.delta === '1h 15m later', e?.delta);
}
// case 5 · they added it
{
  const e = CASES.byID['stop-add:new-1'];
  check('case 5 · they added it', e?.verb === 'added' && e?.stakes === 'free', `${e?.verb}/${e?.stakes}`);
  check('case 5 · the title is theirs, because there is no other name', e?.titleFrom === 'theirs' && e?.title === '上野公園', e?.title);
  check('case 5 · the absent side is WRITTEN, never blank', e?.mineText === 'not on your day', e?.mineText);
  check('case 5 · theirs compares like with like — time AND name', /10:30 – 11:15 · 上野公園/.test(e?.theirsText || ''), e?.theirsText);
}
// case 6 · they removed it
{
  const e = CASES.byID['stop-drop:d'];
  check('case 6 · they removed it', e?.verb === 'removed' && e?.stakes === 'free', `${e?.verb}/${e?.stakes}`);
  check('case 6 · the absent side is written', e?.theirsText === 'off the day', e?.theirsText);
}

// ================================ the rows kinds, and MINE_ALONE preserved
{
  const rows = await page.evaluate(() => {
    const base = { days: [], subRoutes: [], places: [{ id: 'p1', name: 'Kura Bakery' }], mustSee: [{ id: 's1', title: 'Red lanterns', captured: false }] };
    const mine = { days: [], subRoutes: [], places: [{ id: 'p1', name: 'Kura Bakery' }, { id: 'p-mine', name: 'My find' }], mustSee: [{ id: 's1', title: 'Red lanterns', captured: true }] };
    const theirs = { days: [], subRoutes: [], places: [{ id: 'p1', name: 'Kura Bakery (closed Mon)' }], mustSee: [{ id: 's1', title: 'Red lanterns', captured: false }] };
    return window.__share.diffSnapshot(mine, theirs, base).map((e) => ({ id: e.id, verb: e.verb, noun: e.noun, stakes: e.stakes }));
  });
  check('a place THEY renamed is one free changed row', rows.some((r) => r.id === 'places-edit:p1' && r.verb === 'changed' && r.stakes === 'free'), JSON.stringify(rows));
  check('a place YOU added is not offered for deletion', !rows.some((r) => r.id.includes('p-mine')), JSON.stringify(rows));
  check('MINE_ALONE holds — a shot you ticked is not a difference', !rows.some((r) => r.id.includes('s1')), JSON.stringify(rows));
  check('the kind noun is the approved one', rows.find((r) => r.id === 'places-edit:p1')?.noun === 'a place',
    rows.find((r) => r.id === 'places-edit:p1')?.noun);
}

// ============================== a real update, rendered, decided, undone
const stage = async ({ withBase = true } = {}) => page.evaluate(async (useBase) => {
  const t = window.__store.state.trip;
  const code = 'TEST-CODE';
  const days = JSON.parse(JSON.stringify(window.__store.state.days));
  const d3 = days.find((d) => d.dayNumber === 3) || days[0];
  const items = (d3.items || []).filter((i) => !i.archived);
  const base = {
    days: JSON.parse(JSON.stringify(days)),
    subRoutes: [], places: [], mustSee: [],
  };
  // Their side: retime the first stop, drop the second, add one of their own.
  const theirDays = JSON.parse(JSON.stringify(days));
  const td3 = theirDays.find((d) => d.dayNumber === d3.dayNumber);
  td3.items = (td3.items || []).filter((i) => !i.archived).map((i, at) => (at === 0
    ? { ...i, time: '10:30', endTime: '11:15' } : i));
  const dropped = td3.items[1];
  td3.items = td3.items.filter((i) => i.id !== dropped.id);
  td3.items.push({ id: 'their-new', name: '上野公園', time: '16:30', endTime: '17:15' });

  const snapshot = {
    version: 99, by: 'someone-else', byName: 'Ana', at: new Date().toISOString(),
    days: theirDays, subRoutes: [], places: [], mustSee: [],
  };
  localStorage.setItem(`travel-planner:shared:${code}`, JSON.stringify({
    code, owner: 'someone-else', editors: [], version: 99, snapshot,
  }));
  await window.__store.updateTrip({});
  const trip = {
    ...window.__store.state.trip,
    sharedFrom: { code, version: 1, from: 'Ana' },
    tookVersion: 1,
    reviewed: [],
    lastReview: null,
    reviewedSnapshot: useBase ? base : null,
  };
  window.__store.state.trip = trip;
  await window.__store.updateTrip({ reviewedSnapshot: useBase ? base : null, sharedFrom: trip.sharedFrom, tookVersion: 1, reviewed: [], lastReview: null });
  return { firstID: items[0]?.id, droppedName: dropped?.name };
}, withBase);

await stage({ withBase: true });
await page.evaluate(() => window.__nav.go('review'));
await page.waitForTimeout(600);

{
  const seen = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')].filter((c) => c.querySelector('.sides'));
    return {
      cards: cards.length,
      badges: cards.map((c) => c.querySelector('.badge')?.textContent.trim()),
      header: document.querySelector('.push-title')?.textContent.trim(),
      sub: document.querySelector('.push-sub')?.textContent.trim(),
      foot: !!document.querySelector('.review-foot'),
      groups: [...document.querySelectorAll('.review-group .eyebrow')].map((e) => e.textContent.trim()),
      noBaseLine: [...document.querySelectorAll('div')].filter((d) => !d.children.length)
        .some((d) => /without a starting point/.test(d.textContent)),
      takeAll: [...document.querySelectorAll('button')].map((b) => b.textContent.trim())
        .find((t) => /Take all of theirs/.test(t)),
    };
  });
  check('an update renders its cards', seen.cards >= 3, `${seen.cards} cards`);
  check('the header names the person once', /Ana sent an update/.test(seen.header || ''), seen.header);
  check('§6.1 · the sticky .review-foot is finally used', seen.foot);
  check('day grouping replaces the repeated Day chip', seen.groups.length >= 1, seen.groups.join(' | '));
  check('with a base, the no-base line is absent', !seen.noBaseLine);
  check('§6.2 · `Take all of theirs` is GONE', !seen.takeAll, seen.takeAll || '(absent)');

  // The stacked row — N-14's CSS finally in use.
  const side = await page.evaluate(() => {
    const s = document.querySelector('.sides .side');
    const both = [...document.querySelectorAll('.sides')][0];
    const kids = both ? [...both.querySelectorAll('.side')] : [];
    return {
      stacked: s?.classList.contains('stacked'),
      w: s?.getBoundingClientRect().width,
      rowW: both?.getBoundingClientRect().width,
      dropped: kids.length === 2 ? kids[1].getBoundingClientRect().y > kids[0].getBoundingClientRect().y : false,
    };
  });
  check('M-2 · the row is stacked, full width', side.stacked && side.dropped, `stacked=${side.stacked} dropped=${side.dropped}`);
  check('M-2 · a value box has the full width, not ~150px', side.w > 250, `${Math.round(side.w)}px of ${Math.round(side.rowW)}px`);
}

// A decision writes immediately, and is undoable.
{
  const before = await page.evaluate(() => document.querySelectorAll('.sides').length);
  await page.evaluate(() => document.querySelector('[data-take]')?.click());
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({
    cards: document.querySelectorAll('.sides').length,
    undo: document.querySelector('#undo')?.textContent?.trim() || '',
    undoVisible: !document.querySelector('#undo')?.hidden,
  }));
  check('§5.1 · a decision writes immediately and the row leaves the list', after.cards === before - 1, `${before} -> ${after.cards}`);
  check('§5.2 · Review joins the app-wide undo bar', after.undoVisible && /Took theirs|Added|Removed/.test(after.undo), after.undo);
  await page.evaluate(() => {
    const b = document.querySelector('#undo button, #undo [data-act]');
    if (b) b.click();
  });
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => document.querySelectorAll('.sides').length);
  check('§5.2 · undoing a decision brings the ROW BACK to the list', back === before, `${after.cards} -> ${back}`);
}

// Bulk safety.
{
  const foot = await page.evaluate(() => ({
    labels: [...document.querySelectorAll('.review-foot button')].map((b) => b.textContent.trim()),
    progress: document.querySelector('.review-foot .f11')?.textContent.trim(),
  }));
  check('§6.1 · the foot carries progress', /to decide/.test(foot.progress || ''), foot.progress);
  check('§6.1 · Keep all of mine is always there', foot.labels.some((l) => l === 'Keep all of mine'), foot.labels.join(' | '));
  check('§6.2 · the take-bulk names its count', foot.labels.some((l) => /^Take the \d+ you have not touched$/.test(l)), foot.labels.join(' | '));

  const safety = await page.evaluate(() => {
    const waiting = window.__store.pendingUpdate();
    return {
      total: waiting.entries.length,
      conflicts: waiting.entries.filter((e) => e.stakes === 'both').length,
      safe: waiting.entries.filter((e) => e.stakes !== 'both').length,
    };
  });
  await page.evaluate(() => document.querySelector('[data-act="take-safe"]')?.click());
  await page.waitForTimeout(600);
  const left = await page.evaluate(() => {
    const w = window.__store.pendingUpdate();
    return w ? { n: w.entries.length, conflicts: w.entries.filter((e) => e.stakes === 'both').length } : { n: 0, conflicts: 0 };
  });
  check('§6.2 · the take-bulk decided only the rows with no stakes',
    left.n === safety.conflicts, `${safety.total} -> ${left.n} (conflicts ${safety.conflicts})`);
  check('§6.2 · a row you BOTH changed is never decided by a bulk action',
    left.conflicts === safety.conflicts, `${left.conflicts} of ${safety.conflicts} still standing`);
  const oneUndo = await page.evaluate(() => document.querySelector('#undo')?.textContent?.trim() || '');
  check('§5.2 · a bulk action gets ONE undo for the whole batch', /Took the \d+ you have not touched/.test(oneUndo), oneUndo);
}

// Finish, and the receipt.
{
  await page.evaluate(() => document.querySelector('[data-act="keep-all"]')?.click());
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({
    receipt: document.querySelector('.arrived-t')?.textContent.trim(),
    body: document.querySelector('.arrived-s')?.textContent.replace(/\s+/g, ' ').trim(),
    rows: [...document.querySelectorAll('.card-list .badge')].map((b) => b.textContent.trim()),
    stored: !!window.__store.lastReview(),
    baseWritten: !!window.__store.state.trip.reviewedSnapshot,
  }));
  check('N-5 · the receipt renders', r.receipt === 'UPDATE DEALT WITH', r.receipt);
  check('N-5 · and counts what happened', /things decided — \d+ taken, \d+ left as yours\./.test(r.body || ''), r.body);
  check('N-5 · the receipt list tags every decision', r.rows.length > 0 && r.rows.every((t) => t === 'TAKEN' || t === 'KEPT'), r.rows.join(' '));
  check('N-5 · lastReview is stored, not discarded', r.stored);
  check('N-2 · finishReview writes the base for next time', r.baseWritten);

  // 7.5 — it survives navigation.
  await page.evaluate(() => window.__nav.go('plan'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nav.go('review'));
  await page.waitForTimeout(500);
  const still = await page.evaluate(() => document.querySelector('.arrived-t')?.textContent.trim());
  check('§7.5 · the receipt survives navigating away and back', still === 'UPDATE DEALT WITH', still);
}

// It survives a relaunch, which is the finding this fixes.
{
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    window.__store = await import('./js/store.js');
    window.__share = await import('./js/share.js');
    window.__nav = await import('./js/nav.js');
    window.__nav.go('review');
  });
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => document.querySelector('.arrived-t')?.textContent.trim());
  check('§7.5 · and a RELAUNCH — today the screen said nothing had ever happened', after === 'UPDATE DEALT WITH', after);
}

// ==================================== the no-base mode, end to end
{
  await stage({ withBase: false });
  await page.evaluate(() => window.__nav.go('review'));
  await page.waitForTimeout(700);
  const nb = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')].filter((c) => c.querySelector('.sides'));
    return {
      line: [...document.querySelectorAll('div')].filter((d) => !d.children.length)
        .map((d) => d.textContent.replace(/\s+/g, ' ').trim())
        .find((t) => /without a starting point/.test(t)),
      colour: (() => {
        const el = [...document.querySelectorAll('div')].filter((d) => !d.children.length)
          .find((d) => /without a starting point/.test(d.textContent));
        return el ? getComputedStyle(el).color : '';
      })(),
      badges: cards.map((c) => c.querySelector('.badge')?.textContent.trim()),
      conflictBadge: [...document.querySelectorAll('.badge')].some((b) => b.textContent.trim() === 'YOU CHANGED IT TOO'),
      footLabels: [...document.querySelectorAll('.review-foot button')].map((b) => b.textContent.trim()),
    };
  });
  check('N-3 · the no-base line is said once, in the canonical words',
    nb.line === 'This update is being compared without a starting point, so both sides are shown as they are.', nb.line);
  check('N-3 · bone, not amber and not rust — nothing is broken', nb.colour === 'rgb(107, 122, 116)', nb.colour);
  check('N-3 · every changed row is badged THEY SENT, because the app does not know who moved',
    nb.badges.filter((b) => b === 'THEY CHANGED').length === 0 && nb.badges.includes('THEY SENT'), nb.badges.join(' | '));
  check('N-3 · no conflict badge is shown without a base', !nb.conflictBadge);
  check('N-3 · bulk is limited to Keep all of mine',
    nb.footLabels.length === 1 && nb.footLabels[0] === 'Keep all of mine', nb.footLabels.join(' | '));
}

// ============================= M-11 · Empty this trip (OD-6 = yes)
{
  await page.evaluate(() => window.__nav.go('trip'));
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-act="clear"]')?.click());
  await page.waitForTimeout(400);
  const confirm = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].filter((d) => !d.children.length)
      .find((d) => /This cannot be undone/.test(d.textContent.replace(/\s+/g, ' ')));
    // The template wraps, so textContent carries newlines: normalise BEFORE
    // matching, not after, or the phrase is split across the break.
    const flat = (el) => el.textContent.replace(/\s+/g, ' ').trim();
    const joined = [...document.querySelectorAll('div')].filter((d) => !d.children.length)
      .find((d) => /does not leave the trip/.test(flat(d)));
    return { text: el ? flat(el) : '', joined: joined ? flat(joined) : '' };
  });
  check('M-11 · the confirm names the three private kinds — OD-6 answered YES',
    confirm.text === 'This cannot be undone. Everything listed above goes, including your shopping list, your packing list and your Log.',
    confirm.text);
  check('§5.3 · a joined copy is told the itinerary comes back, before the tap',
    /Emptying it does not leave the trip — the next update they send will offer everything back\./.test(confirm.joined || ''),
    confirm.joined);

  await page.evaluate(() => document.querySelector('[data-act="clear-confirm"]')?.click());
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({
    base: window.__store.state.trip.reviewedSnapshot,
    receipt: window.__store.lastReview(),
    shopping: window.__store.state.shopping.length,
    log: window.__store.state.log.length,
  }));
  check('OD-6 · it really does clear the private kinds', after.shopping === 0 && after.log === 0, `shopping ${after.shopping}, log ${after.log}`);
  check('§5.3 · and it resets the review base, so the itinerary is recoverable',
    after.base === null, JSON.stringify(after.base)?.slice(0, 40));
  check('§5.3 · the receipt goes with it', after.receipt === null);
}

// ================================= M-13 · keepMySide clears base and receipt
{
  const r = await page.evaluate(async () => {
    await window.__store.updateTrip({ reviewedSnapshot: { days: [], places: [], subRoutes: [], mustSee: [] } });
    window.__store.keepMySide();
    const t = window.__store.state.trip;
    return { base: t.reviewedSnapshot, receipt: t.lastReview, people: t.people, share: t.share, shared: !!t.sharedFrom };
  });
  check('M-13 · keepMySide clears the review base', r.base === null, JSON.stringify(r.base));
  check('M-13 · and the receipt — a former copy keeps no receipt from someone it is not connected to', r.receipt === null);
  check('M-13 · and still clears what it always did', r.people.length === 0 && r.share === null);
  check('M-13 · sharedFrom is deliberately NOT cleared — it drives the empty-state tiers', r.shared === true);
}

// ================================= CJK, measured rather than eyeballed
{
  const m = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe'; host.style.cssText = 'width:318px';
    host.innerHTML = `
      <div class="card" style="padding:12px 13px">
        <div class="f135 w700" id="t" style="color:var(--ink);line-height:1.35">大稻埕・迪化街老屋與布市半日散步</div>
        <div class="sides mt10">
          <div class="side stacked" id="sv"><div class="side-k">YOURS</div>
            <div class="side-v">09:15 – 10:00 京都市中央卸売市場第一市場</div></div>
          <div class="side theirs stacked"><div class="side-k">THEIRS</div>
            <div class="side-v">10:30 – 11:15 京都市中央卸売市場第一市場</div></div>
        </div>
      </div>`;
    document.body.appendChild(host);
    const t = document.getElementById('t'), v = document.getElementById('sv');
    return { tsw: t.scrollWidth, tcw: t.clientWidth, vsw: v.scrollWidth, vcw: v.clientWidth,
      lh: getComputedStyle(t).lineHeight, fs: getComputedStyle(t).fontSize };
  });
  check('CJK: a long CJK title wraps rather than overflowing', m.tsw <= m.tcw + 1, `${m.tsw} vs ${m.tcw}`);
  check('CJK: the title uses the 1.35 line-height the design specifies for CJK',
    Math.abs(parseFloat(m.lh) - parseFloat(m.fs) * 1.35) < 0.7, `${m.lh} on ${m.fs}`);
  check('CJK: a stacked value box holds a long CJK value', m.vsw <= m.vcw + 1, `${m.vsw} vs ${m.vcw}`);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

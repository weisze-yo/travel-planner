// Batch 5 — Destination, status visibility and absence.
//
// Per the transition audit §7: tier assertions keyed off
// `store.sharedEmptyContext()` rather than markup, and the blank-map card
// rendering with NO cause sentence (OD-7 answered no). Plus M-9, N-11, N-12,
// M-12 and M-16, each measured in a real render at 390x844.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 220)}` : ''));
};
const flat = (t) => String(t || '').replace(/\s+/g, ' ').trim();

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
let killTiles = false;
await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
await page.route(/gstatic|nominatim|open-meteo|frankfurter/, (r) => r.abort());

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const go = async (id, p) => {
  await page.evaluate(([i, q]) => window.__nav.go(i, q || {}), [id, p]);
  await page.waitForTimeout(500);
};
const until = async (fn, ms = 6000) => {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(80); }
  return false;
};

// ================================= N-10 · the blank map, and OD-7
{
  const areas = await page.evaluate(() => window.__store.mapAreas().length);
  check('N-10 · the demo phone has no kept areas, which is the gap', areas === 0, `${areas} areas`);
  await go('map');
  // Every tile is aborted, so the layer only ever fires tileerror.
  const shown = await until(() => {
    const els = [...document.querySelectorAll('.stranded')];
    return els.some((e) => /NO MAP PICTURE/.test(e.textContent));
  }, 8000);
  check('N-10 · the amber card appears when no tile draws and no area is kept', shown);

  const card = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.stranded')].find((e) => /NO MAP PICTURE/.test(e.textContent));
    if (!el) return null;
    const cs = getComputedStyle(el);
    const btn = el.querySelector('button');
    return {
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      bg: cs.backgroundColor, colour: cs.color, radius: cs.borderTopLeftRadius, pad: cs.paddingTop,
      action: btn?.textContent.trim(),
      inMapTop: !!el.closest('.map-top'),
    };
  });
  check('N-10 · the exact approved copy, and nothing else',
    card?.text === 'NO MAP PICTURE Distances, order and walking times are all worked out on the phone. Only the streets are missing. Keep an area for offline',
    card?.text);
  check('N-10 · AMBER, not rust — nothing is broken, the plan works',
    card?.bg === 'rgb(251, 241, 222)' && card?.colour === 'rgb(138, 90, 8)', `${card?.bg} / ${card?.colour}`);
  check('N-10 · the same card shape .map-top already stacks', card?.inMapTop && card?.radius === '11px' && card?.pad === '8px',
    `${card?.radius} ${card?.pad}`);
  check('N-10 · the action names the same destination the strip does', card?.action === 'Keep an area for offline', card?.action);

  // OD-7, answered NO. This is the assertion that keeps it answered.
  // The approved action is "Keep an area for offline", so the word itself is
  // fine; what OD-7 forbids is a claim about the CAUSE.
  const guesses = /(no|without|lost|poor|weak) (signal|connection|internet)|you are offline|check your|wi-?fi is|the (tile )?server|refused|too slow|try again later/i;
  check('OD-7 · the card NEVER guesses why the map is blank', !guesses.test(card?.text || ''), card?.text);

  await page.evaluate(() => document.querySelector('[data-act="keep-area"]')?.click());
  await page.waitForTimeout(600);
  const landed = await page.evaluate(() => !!document.querySelector('.screen'));
  check('N-10 · the action goes somewhere real', landed);
}

// ================================= N-12 · the stop that has gone
{
  // `subject()` falls back to the day's anchor stop when an id does not
  // resolve — approved, existing behaviour, and not this batch's to change.
  // So the gone branch is reached when there is nothing left to fall back to,
  // which is exactly the "stale id in a restored stack" case the design names.
  await page.evaluate(() => {
    const d = window.__store.day(window.__store.state.selectedDay);
    for (const i of window.__store.activeItems(d)) {
      window.__store.archivePlanItem(window.__store.state.selectedDay, i.id);
    }
  });
  await page.waitForTimeout(500);
  await go('dest', { itemID: 'no-such-stop-at-all' });
  const gone = await page.evaluate(() => {
    const backBtn = document.querySelector('[data-act="back"]');
    const ghost = document.querySelector('[data-act="gone-plan"], [data-act="gone-back"]');
    const title = document.querySelector('.push-title')?.textContent.trim();
    const body = document.querySelector('.empty')?.textContent.replace(/\s+/g, ' ').trim();
    return {
      title, body,
      hasBack: !!backBtn,
      action: ghost?.textContent.trim(),
      ghost: /btn ghost/.test(ghost?.className || ''),
      ink: /btn ink/.test(ghost?.className || ''),
      actions: document.querySelectorAll('.scroll button').length,
    };
  });
  check('N-12 · it gets the screen\'s own header', gone.title === 'That stop has gone', gone.title);
  check('N-12 · so there is a back chevron, which there was not', gone.hasBack);
  check('N-12 · with no name passed it does not invent one',
    gone.body === 'That stop is not on this trip any more. It was removed from the plan. Everything else on the trip is untouched.', gone.body);
  check('N-12 · one action', gone.actions === 1, `${gone.actions} actions`);
  check('N-12 · and it is a GHOST — a recovery, not the user\'s next intention', gone.ghost && !gone.ink, gone.action);
  check('N-12 · which names the tap', gone.action === 'Back to the day', gone.action);

  // It names the subject when the caller knew it.
  await go('dest', { itemID: 'still-gone', anchorName: '西市場' });
  const named = await page.evaluate(() => document.querySelector('.empty')?.textContent.replace(/\s+/g, ' ').trim());
  check('N-12 · it names the stop when a name was passed',
    named === '西市場 is not on this trip any more. It was removed from the plan. Everything else on the trip is untouched.', named);
  const noPerson = /you (removed|deleted)|they (removed|deleted)|somebody/i;
  check('N-12 · and no person is the subject of a negative verb (P0-1)', !noPerson.test(named || ''), named);
}

// ================================= N-11 · a place with no position
{
  const target = await page.evaluate(() => {
    const p = window.__store.state.places.find((x) => x.latitude != null);
    if (!p) return null;
    return { id: p.id, lat: p.latitude, lon: p.longitude, name: p.name };
  });
  // No exported mutator clears a position (nothing in the app does it), so
  // the fixture is set directly. What is under test is the app's RENDER of a
  // state it can genuinely be in — a place saved without a location.
  await page.evaluate((id) => {
    const p = window.__store.state.places.find((x) => x.id === id);
    p.latitude = null; p.longitude = null;
    window.__store.selectDay(window.__store.state.selectedDay);
  }, target.id);
  await page.waitForTimeout(400);
  await go('dest', { placeID: target.id });
  const warn = await page.evaluate(() => {
    const w = document.querySelector('.warn');
    if (!w) return null;
    const maps = [...document.querySelectorAll('a.btn')].find((a) => /Maps/.test(a.textContent));
    return {
      label: w.querySelector('.warn-label')?.textContent.trim(),
      fact: w.querySelector('.warn-fact')?.textContent.replace(/\s+/g, ' ').trim(),
      fix: w.querySelector('.warn-fix')?.textContent.trim(),
      bg: getComputedStyle(w).backgroundColor,
      underMaps: maps ? w.getBoundingClientRect().top > maps.getBoundingClientRect().top : false,
    };
  });
  check('N-11 · Destination says the subject has no position', warn?.label === 'NO POSITION', warn?.label);
  check('N-11 · with the approved sentence', warn?.fact === 'The map cannot place this one, so it is off the route too.', warn?.fact);
  check('N-11 · and the approved fix', warn?.fix === 'Paste a map link', warn?.fix);
  check('N-11 · it is the existing .warn recipe, amber', warn?.bg === 'rgb(251, 241, 222)', warn?.bg);
  check('N-11 · directly under the two Maps buttons it is about', warn?.underMaps);

  // The Nearby ROW, reached through Destination's Nearby panel — the Nearby
  // screen needs an anchor to have anything to list, and this is the same row
  // rendered by the same rule.
  const anchor = await page.evaluate((id) => {
    const p = window.__store.state.places.find((x) => x.id === id);
    return p?.anchorPlaceID || null;
  }, target.id);
  await go('dest', { placeID: anchor || target.id });
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.dest-tab')].find((t) => /nearby/i.test(t.textContent));
    tab?.click();
  });
  await page.waitForTimeout(500);
  const chip = await page.evaluate((name) => {
    const rows = [...document.querySelectorAll('.nearby-name')];
    const row = rows.find((r) => r.textContent.trim() === name)?.closest('.grow');
    if (!row) return { missing: [...document.querySelectorAll('.nearby-name')].map((n) => n.textContent.trim()) };
    const c = [...row.querySelectorAll('.chip')].find((x) => x.textContent.trim() === 'No position');
    return {
      chip: c?.textContent.trim(),
      amber: c ? /amber/.test(c.className) : false,
      note: row.querySelector('.nearby-note')?.textContent.replace(/\s+/g, ' ').trim(),
    };
  }, target.name);
  check('N-11 · the Nearby row carries the same chip the Plan row does', chip?.chip === 'No position', chip?.chip);
  check('N-11 · in amber', chip?.amber);
  check('N-11 · and it came OUT of the metadata line — a consequence is not a footnote',
    !/no location/.test(chip?.note || ''), chip?.note);
  // "unlocated" is an internal word; what matters is that no USER-FACING
  // string uses it, so this reads the rendered page rather than the source.
  const shown = await page.evaluate(() => document.body.textContent);
  check('N-11 · no rendered string says "unlocated" — it is an internal word', !/unlocated/i.test(shown));

  // Put the position back so nothing after this runs against a broken fixture.
  await page.evaluate(([id, lat, lon]) => {
    const p = window.__store.state.places.find((x) => x.id === id);
    p.latitude = lat; p.longitude = lon;
    window.__store.selectDay(window.__store.state.selectedDay);
  }, [target.id, target.lat, target.lon]);
  await page.waitForTimeout(300);
}

// ================================= M-9 · the Shop panel's currency rule
{
  await page.evaluate(async () => {
    await window.__store.updateTrip({ currencySymbol: '', currencyCode: '' });
  });
  await page.waitForTimeout(400);
  const anchored = await page.evaluate(() => {
    const item = window.__store.state.shopping.find((i) => i.placeID);
    return item ? item.placeID : window.__store.state.places[0]?.id;
  });
  await go('dest', { placeID: anchored });
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.dest-tab')].find((t) => /shop/i.test(t.textContent));
    tab?.click();
  });
  await page.waitForTimeout(500);
  const shop = await page.evaluate(() => {
    const body = document.body.textContent;
    const line = [...document.querySelectorAll('div')].filter((d) => !d.children.length)
      .map((d) => d.textContent.replace(/\s+/g, ' ').trim())
      .find((t) => t === 'Prices have no currency yet. Set it in Trip settings.');
    return { yen: /¥\s*[\d,]/.test(body), spentHere: /spent here/.test(body), line };
  });
  check('M-9 · no ¥ on a trip with no currency', !shop.yen);
  check('M-9 · the money clause is omitted, not zeroed', !shop.spentHere, `spent-here present: ${shop.spentHere}`);
  check('M-9 · and the panel says why the prices have no symbol', !!shop.line, shop.line);

  // The editor's parenthetical, from this screen too.
  await page.evaluate(() => document.querySelector('[data-act="add-item"]')?.click());
  await page.waitForTimeout(400);
  const lbl = await page.evaluate(() => [...document.querySelectorAll('label')]
    .map((l) => l.textContent.trim()).find((t) => t.startsWith('What you expect to pay')));
  check('M-9 · the price label drops its parenthetical here as well', lbl === 'What you expect to pay', lbl);
  await page.evaluate(() => document.querySelector('[data-act="item-cancel"]')?.click());
  await page.evaluate(async () => { await window.__store.updateTrip({ currencySymbol: '¥', currencyCode: 'JPY' }); });
  await page.waitForTimeout(300);
}

// ================================= M-12 · Trip settings MONEY row
{
  await go('trip');
  const row = await page.evaluate(() => {
    const ids = ['cur-symbol', 'cur-code', 'home-code'];
    const boxes = ids.map((id) => {
      const el = document.getElementById(id);
      return el ? { id, y: Math.round(el.getBoundingClientRect().y), h: Math.round(el.getBoundingClientRect().height) } : null;
    });
    const labels = ids.map((id) => {
      const el = document.getElementById(id)?.previousElementSibling;
      return el ? Math.round(el.getBoundingClientRect().height) : 0;
    });
    return { boxes, labels };
  });
  const ys = row.boxes.map((b) => b?.y);
  const spread = Math.max(...ys) - Math.min(...ys);
  check('M-12 · all three MONEY inputs sit on one line — the 19px offset is gone',
    spread <= 1, `y = ${ys.join(' · ')} (spread ${spread}px)`);
  check('M-12 · and it is still the wrapping label that made it hard',
    Math.max(...row.labels) > Math.min(...row.labels), `label heights ${row.labels.join(' · ')}`);
}

// ================================= M-16 · areas STORAGE row
{
  await go('areas');
  const storage = await page.evaluate(() => {
    const eyebrow = [...document.querySelectorAll('.eyebrow')].find((e) => e.textContent.trim() === 'STORAGE');
    const row = eyebrow?.nextElementSibling;
    const fig = row?.querySelector('.tnum');
    if (!row || !fig) return null;
    const before = { rowH: row.getBoundingClientRect().height, figY: Math.round(fig.getBoundingClientRect().y) };
    // The defect only shows at a wider value: it fits at "0 kB".
    fig.textContent = '1,234.5 MB';
    const after = { rowH: row.getBoundingClientRect().height, figY: Math.round(fig.getBoundingClientRect().y) };
    return {
      wrap: getComputedStyle(row).flexWrap,
      nowrap: getComputedStyle(fig).whiteSpace,
      figOverflow: fig.scrollWidth > fig.clientWidth + 1,
      before, after,
    };
  });
  check('M-16 · the figure will not break across lines', storage?.nowrap === 'nowrap', storage?.nowrap);
  check('M-16 · the row has horizontal slack rather than forcing an overlap', storage?.wrap === 'wrap', storage?.wrap);
  check('M-16 · a much wider value does not clip the figure', !storage?.figOverflow);
  check('M-16 · and it does not push the figure out of its own row',
    storage && storage.after.figY === storage.before.figY, `${storage?.before.figY} -> ${storage?.after.figY}`);
}

// ================================= tiers, keyed off the store not the markup
{
  const tiers = await page.evaluate(() => ({
    sharedShopping: window.__store.isSharedEmptyKind('shopping'),
    sharedPlaces: window.__store.isSharedEmptyKind('places'),
    context: window.__store.sharedEmptyContext(),
  }));
  check('tiers · the source test still answers from the store, not from markup',
    typeof tiers.sharedShopping === 'boolean' && typeof tiers.sharedPlaces === 'boolean',
    JSON.stringify(tiers));
  check('tiers · a private kind can never be tier 3, even here', tiers.sharedShopping === false);
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

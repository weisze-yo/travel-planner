// §3.4 — SEARCH. WHERE IT LIVES, AND THE FLASH THAT HAD TO BE BUILT.
//
// Two homes were rejected, and both rejections shape what is gated here:
//
//   not a sixth tab   five entries at 375px are 75px each; six make 62.5px
//                     and re-space every label in the app's most permanent
//                     surface, for a control used in BURSTS not dwelt in.
//                     So: the tab bar must still have five entries, on every
//                     screen, after search exists.
//   not the strip     strip.js is ONE ranked slot; a permanent box would win
//                     it forever and the warnings would lose their only
//                     home. So: no search control may appear in the strip.
//
// The panel is TOP-anchored, which is the opposite of every other sheet in
// this app — the keyboard owns the lower half of the screen the moment the
// field takes focus. Asserted by measuring, so it cannot drift back down.
//
// The search itself is NAMES ONLY, English or Japanese, and the empty state
// promises exactly that. The promise is tested from both sides: a name
// matches wherever it sits in the string, and a phrase that appears only in
// a `retiredReason` matches NOTHING. A search whose results cannot be
// explained is worse than one that finds less.
//
// The 30-cap is provoked with 45 staged records, because the demo trip holds
// ~38 and a cap that is never reached is a cap that exists in the source
// rather than in the app.
//
// THE FLASH is the half Design called the expensive one, and building it
// found a real defect that only a live check could: `nav.js` replaces the
// whole screen host on every paint, so a class added once to a row is gone
// the next time the store notifies — which on a 45-row list happens between
// the navigation and the eye. The target is held in the module and
// re-applied after every paint. The reduced-motion path is a DESIGN, not a
// disabled animation: no fade, a 3px jade rule, and it stays until the next
// tap — so it is checked for still being there 4.4s later, which is the
// property that matters and the one an "animation: none" assertion would
// miss.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 300)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, serviceWorkers: 'block',
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
await page.waitForTimeout(700);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const go = async (s, a) => {
  await page.evaluate(([x, y]) => window.__nav.go(x, y), [s, a]);
  await page.waitForTimeout(430);
};

  // ============================================ 1 · invocation, five screens
  //
  // Map's header is `.map-top` (it floats over the Leaflet canvas); the other
  // four are `.head`. Both are the screen's own header row, which is the
  // property that matters — one slot, five screens, no new chrome.
  for (const [screen, headSel] of [
    ['map', '.map-top'], ['plan', '.head'], ['shop', '.head'],
    ['prep', '.head'], ['log', '.head'],
  ]) {
    await go(screen);
    const r = await page.evaluate((sel) => {
      const btns = [...document.querySelectorAll('[data-act="search-open"]')];
      const b = btns[0];
      const box = b?.getBoundingClientRect();
      return {
        n: btns.length,
        inHeader: Boolean(b && b.closest(sel)),
        size: box && `${Math.round(box.width)}x${Math.round(box.height)}`,
        tabs: document.querySelectorAll('#tabbar [data-tab]').length,
        inStrip: Boolean(document.querySelector('#strip [data-act="search-open"], .strip [data-act="search-open"]')),
      };
    }, headSel);
    check(`§3.4 · ${screen} · exactly one magnifier, in its own header`,
          r.n === 1 && r.inHeader === true, JSON.stringify(r));
    check(`§3.4 · ${screen} · at 32px, the slot's own size`, r.size === '32x32', r.size);
    check(`§3.4 · ${screen} · the tab bar is untouched — still five`, r.tabs === 5, r.tabs);
    check(`§3.4 · ${screen} · and the strip keeps its single slot`, r.inStrip === false);
  }

  // ============================================ 2 · the panel
  await go('map');
  const open = await page.evaluate(async () => {
    document.querySelector('[data-act="search-open"]').click();
    await new Promise((r) => setTimeout(r, 500));
    const panel = document.querySelector('.search-panel');
    const app = document.querySelector('#app').getBoundingClientRect();
    const box = panel?.getBoundingClientRect();
    return {
      panel: Boolean(panel),
      scrim: document.querySelectorAll('#search .scrim').length,
      // TOP-anchored, not bottom: the keyboard owns the lower half.
      fromTop: box && Math.round(box.top - app.top),
      fromBottom: box && Math.round(app.bottom - box.bottom),
      focused: document.activeElement?.id,
      head: document.querySelector('.search-head')?.textContent.trim(),
      rows: document.querySelectorAll('.search-row').length,
      sentence: Boolean(document.querySelector('.search-empty')),
      done: document.querySelector('.search-done')?.textContent.trim(),
    };
  });
  console.log('  open:', JSON.stringify(open));
  check('§3.4 · it opens a panel over the app’s existing scrim',
        open.panel === true && open.scrim === 1, JSON.stringify(open));
  check('§3.4 · TOP-anchored — the keyboard owns the lower half',
        open.fromTop < 60 && open.fromBottom > 200, `${open.fromTop} from top, ${open.fromBottom} from bottom`);
  check('§3.4 · the field takes focus on open', open.focused === 'search-q', open.focused);
  check('§3.4 · with a Done', open.done === 'Done', open.done);

  // ---- one character: the head, and NOTHING else ------------------------
  const type = async (q) => page.evaluate(async (v) => {
    const el = document.querySelector('#search-q');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 380));
    return {
      head: document.querySelector('.search-head')?.textContent.trim(),
      rows: [...document.querySelectorAll('.search-row')].map((r) => ({
        kind: r.querySelector('.search-kind')?.textContent.trim(),
        name: r.querySelector('.search-name')?.textContent.trim(),
        jp: r.querySelector('.search-jp')?.textContent.trim() || null,
        ctx: r.querySelector('.search-ctx')?.textContent.trim() || null,
        retired: r.classList.contains('retired'),
        chip: r.querySelector('.chip')?.textContent.trim() || null,
      })),
      empty: document.querySelector('.search-empty')?.textContent.replace(/\s+/g, ' ').trim() || null,
      clear: Boolean(document.querySelector('[data-act="search-clear"]')),
    };
  }, q);

  const one = await type('m');
  console.log('  one char:', JSON.stringify(one));
  check('§3.4 · one character shows the head and no list',
        one.rows.length === 0, one.rows.length);
  check('§3.4 · and NO sentence — a request not yet made is not a result of zero',
        one.empty === null, one.empty);
  check('§3.4 · the head says what it is waiting for',
        /TYPE TWO CHARACTERS/.test(one.head || ''), one.head);

  // ---- a real query -----------------------------------------------------
  const hit = await type('mar');
  console.log('  "mar":', JSON.stringify(hit));
  check('§3.4 · two characters is enough to search',
        hit.rows.length > 0, hit.rows.length);
  check('§3.4 · the head counts BOTH ways — N of the whole record set',
        /^\d+ OF \d+ RECORDS/.test(hit.head || ''), hit.head);
  check('§3.4 · the kind is an uppercase WORD, never a colour',
        hit.rows.every((r) => /^(PLACE|MUST-SEE|BUY)$/.test(r.kind || '')),
        JSON.stringify(hit.rows.map((r) => r.kind)));
  check('§3.4 · each result says where it sits',
        hit.rows.every((r) => r.ctx), JSON.stringify(hit.rows.map((r) => r.ctx)));
  check('§3.4 · and the field offers a clear', hit.clear === true);

  // ---- names only, in both scripts, and prefix first -------------------
  const probe = await page.evaluate(() => {
    const s = window.__store;
    // Stage a set that makes the ordering and the script rules provable.
    const day = s.state.selectedDay;
    const anchor = s.state.places.find((p) => p.isStop)?.id
      || s.state.places[0]?.id;
    s.state.places.push(
      { id: 'sq-1', name: 'Zzz Prefix Test', nameJp: '銀山テスト', category: 'food',
        priceTier: '¥', anchorPlaceID: anchor, legs: [], stayMinutes: 10 },
      { id: 'sq-2', name: 'Contains Prefix Test inside', category: 'food',
        priceTier: '¥', anchorPlaceID: anchor, legs: [], stayMinutes: 10 },
      { id: 'sq-3', name: 'Old Retired Prefix Test', category: 'rest', retired: true,
        retiredReason: 'not stayed at any more', anchorPlaceID: anchor, legs: [], stayMinutes: 10 },
    );
    s.state.mustSee.push({ id: 'sq-4', title: 'Prefix Test at dusk', placeID: anchor });
    s.state.shopping.push({ id: 'sq-5', name: 'Prefix Test sesame paste', placeID: anchor, nameJp: 'ごまだれ' });
    s.touch();
    const r = s.searchRecords('prefix test');
    const jp = s.searchRecords('銀山テ');
    const notes = s.searchRecords('sesame paste');
    const byNote = s.searchRecords('not stayed at any more');
    return {
      order: r.results.map((x) => [x.label, x.name, x.retired]),
      kinds: [...new Set(r.results.map((x) => x.label))],
      jp: jp.results.map((x) => x.name),
      notes: notes.results.length,
      byNote: byNote.results.length,
      cap: s.searchRecords('e').tooShort,
      capped: (() => {
        const many = s.searchRecords('a');
        return many.tooShort;
      })(),
    };
  });
  console.log('  probe:', JSON.stringify(probe));
  check('§3.4 · PREFIX matches come first, then anything containing',
        probe.order[0][1].startsWith('Prefix Test') && probe.order.some(([, n]) => /^Contains /.test(n))
          && probe.order.findIndex(([, n]) => /^Contains /.test(n))
             > probe.order.findIndex(([, n]) => /^Prefix Test/.test(n)),
        JSON.stringify(probe.order));
  check('§3.4 · all three kinds are searched',
        probe.kinds.length === 3, JSON.stringify(probe.kinds));
  check('§3.4 · a retired place is a real answer, and it sinks rather than hides',
        probe.order.some(([, , ret]) => ret) && probe.order[probe.order.length - 1][2] === true,
        JSON.stringify(probe.order));
  check('§3.4 · Japanese names are searched too', probe.jp.length === 1, JSON.stringify(probe.jp));
  check('§3.4 · a name matches wherever it sits in the string', probe.notes === 1, probe.notes);
  check('§3.4 · NOTES ARE NOT SEARCHED — which is what the empty state promises',
        probe.byNote === 0, probe.byNote);

  // ---- the empty state says what it did NOT look at --------------------
  const miss = await type('kinzanxyz');
  console.log('  miss:', JSON.stringify(miss));
  check('§3.4 · nothing matching names the query back',
        /Nothing matches “kinzanxyz”\./.test(miss.empty || ''), miss.empty);
  check('§3.4 · and says what was not searched, so the result can be explained',
        /Names only — English or Japanese\. Notes and prices are not searched\./.test(miss.empty || ''),
        miss.empty);

  // ---- the cap, with enough records to make it bite --------------------
  //
  // The demo trip holds ~38 records, so the 30-cap has to be provoked: a
  // check that never reaches the cap proves the cap exists in the source,
  // not that it works.
  const capped = await page.evaluate(() => {
    const s = window.__store;
    const anchor = s.state.places.find((p) => p.isStop)?.id || s.state.places[0]?.id;
    for (let i = 0; i < 45; i++) {
      s.state.places.push({
        id: `cap-${i}`, name: `Capacity Row ${String(i).padStart(2, '0')}`,
        category: 'food', priceTier: '¥', anchorPlaceID: anchor, legs: [], stayMinutes: 10,
      });
    }
    s.touch();
    const many = s.searchRecords('capacity row');
    return { matched: many.matched, shown: many.shown, results: many.results.length };
  });
  console.log('  cap:', JSON.stringify(capped));
  check('§3.4 · more than thirty really match', capped.matched === 45, capped.matched);
  check('§3.4 · and thirty is what comes back',
        capped.results === 30 && capped.shown === 30, JSON.stringify(capped));
  const capHead = await type('capacity row');
  check('§3.4 · the head says it is showing the first thirty of forty-five',
        /^45 OF \d+ RECORDS · FIRST 30$/.test(capHead.head || ''), capHead.head);
  check('§3.4 · and the list really stops at thirty', capHead.rows.length === 30, capHead.rows.length);

  // ============================================ 3 · the flash
  const flashed = await page.evaluate(async () => {
    const el = document.querySelector('#search-q');
    el.value = 'prefix test';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const row = [...document.querySelectorAll('.search-row')]
      .find((r) => r.dataset.rowKey === 'place-row');
    const want = row.dataset.searchGo;
    row.click();
    await new Promise((r) => setTimeout(r, 1400));
    const target = document.querySelector(`[data-place-row="${want}"]`);
    const cs = target && getComputedStyle(target);
    return {
      want,
      panelGone: !document.querySelector('.search-panel'),
      hash: location.hash,
      found: Boolean(target),
      marked: target?.classList.contains('flashed'),
      animation: cs?.animationName,
      duration: cs?.animationDuration,
      inView: target ? (() => {
        const b = target.getBoundingClientRect();
        const s = target.closest('.scroll')?.getBoundingClientRect();
        return s ? b.top >= s.top - 4 && b.bottom <= s.bottom + 4 : null;
      })() : null,
    };
  });
  console.log('  flash:', JSON.stringify(flashed));
  check('§3.4 · picking a result closes the panel', flashed.panelGone === true);
  check('§3.4 · and navigates to the record', flashed.hash === '#dest', flashed.hash);
  check('§3.4 · the row it sent you to really exists on that screen', flashed.found === true);
  check('§3.4 · scrolled into view', flashed.inView === true, flashed.inView);
  check('§3.4 · and marked', flashed.marked === true);
  check('§3.4 · default: --jade-bg fading to white over 2.4s',
        flashed.animation === 'search-flash' && flashed.duration === '2.4s',
        `${flashed.animation} ${flashed.duration}`);

  // ============================ 4 · the flash under reduced motion
  //
  // Not "the animation, disabled". A 2.4s wash outdoors in sun is easy to
  // miss entirely, so under reduce the row takes --jade-bg PLUS a 3px jade
  // rule on its leading edge and STAYS marked until the next tap or scroll.
  // Arguably the better of the two, which is why it is a design and not a
  // fallback — and why it is checked rather than assumed.
  const reduced = await ctx.newPage();
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await reduced.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
  await reduced.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await reduced.waitForTimeout(900);
  const still = await reduced.evaluate(async () => {
    const nav = await import('./js/nav.js');
    const st = await import('./js/store.js');
    const anchor = st.state.places.find((p) => p.isStop)?.id || st.state.places[0]?.id;
    st.state.places.push({
      id: 'rm-1', name: 'Reduced Motion Row', category: 'food', priceTier: '¥',
      anchorPlaceID: anchor, legs: [], stayMinutes: 10,
    });
    st.touch();
    document.querySelector('[data-act="search-open"]')?.click();
    await new Promise((r) => setTimeout(r, 400));
    const el = document.querySelector('#search-q');
    el.value = 'reduced motion';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    document.querySelector('.search-row')?.click();
    await new Promise((r) => setTimeout(r, 1400));
    const row = document.querySelector('[data-place-row="rm-1"]');
    const cs = row && getComputedStyle(row);
    const first = {
      found: Boolean(row), marked: row?.classList.contains('flashed'),
      animation: cs?.animationName, bg: cs?.backgroundColor, shadow: cs?.boxShadow,
    };
    // It must still be there well after 2.4s — it waits for you.
    await new Promise((r) => setTimeout(r, 3000));
    const after = document.querySelector('[data-place-row="rm-1"]')?.classList.contains('flashed');
    // ...and go on the next tap.
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const cleared = !document.querySelector('[data-place-row="rm-1"]')?.classList.contains('flashed');
    return { ...first, after, cleared };
  });
  await reduced.close();
  console.log('  reduced:', JSON.stringify(still));
  check('§3.4 · reduce · the row is found and marked',
        still.found === true && still.marked === true, JSON.stringify(still));
  check('§3.4 · reduce · NO animation at all', still.animation === 'none', still.animation);
  check('§3.4 · reduce · --jade-bg plus a 3px jade rule on the leading edge',
        still.bg === 'rgb(230, 239, 235)' && /inset rgb\(31, 111, 92\) 3px 0px 0px 0px|rgb\(31, 111, 92\) 3px 0px 0px 0px inset/.test(still.shadow || ''),
        `${still.bg} | ${still.shadow}`);
  check('§3.4 · reduce · and it is STILL there after 4.4s — it waits for you',
        still.after === true, still.after);
  check('§3.4 · reduce · cleared by the next tap', still.cleared === true, still.cleared);

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

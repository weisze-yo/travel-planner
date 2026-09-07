// §3.1 — MORNING / NIGHT / DAWN ON A 31-ROW LIST.
//
// `timeWindow` has been a real field on every place since Trip 12 landed and
// nothing read it. Counted against the current snapshot, 618 places:
//
//   day     381    unmarked — the majority, and the reason the list gets
//   (none)   58    QUIETER rather than louder
//   night    76    marked, filled dot
//   dawn     29    marked, hollow dot
//   24h      74    a plain grey word, no hue: a bonus, never a constraint
//
// THE OWNER'S OPEN QUESTION IS ANSWERED HERE, AND RE-ANSWERED. §3.1 shows
// `TILL 21:00` where a record has a real closing hour and `AFTER DARK` where
// it does not, and Design flagged that the ratio decides how the list reads.
// Counted twice — before and after the airport batch — ZERO of the 105
// dawn/night records carry a structured hour, and none has an `Hours`
// essential containing a clock either. So every mark in Trip 12 reads AFTER
// DARK or BEFORE 08:00.
//
// Both paths are still built and both are checked, because a place someone
// adds by hand can gain an hour — so this file stages the hour-bearing case,
// asserts it, then strips the hours and asserts the degraded case, which is
// the one Trip 12 will actually show.
//
// The clock logic is exercised at 06:20, 09:35 and 21:00 directly, because
// the filter's honesty depends on it and the phone clock at test time is
// whatever it happens to be. And `day`, `24h` and no-window must be open at
// EVERY hour: the field says which part of the day a place belongs to, not
// when its door is locked, so inventing a closing time for them would be
// the same class of error the sourcing standard exists to prevent.
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

  // Stage one of each window on a real stop's nearby list, so all four
  // outcomes are on one screen at once.
  const stop = await page.evaluate(async () => {
    const s = window.__store;
    // The stop with the MOST nearby places, not merely the first one with a
    // placeID — several stops have none, and a probe that lands on one of
    // those proves nothing about the row.
    const byAnchor = new Map();
    for (const p of s.state.places) {
      if (!p.anchorPlaceID) continue;
      byAnchor.set(p.anchorPlaceID, (byAnchor.get(p.anchorPlaceID) || 0) + 1);
    }
    const anchor = [...byAnchor.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const near = s.state.places.filter((p) => p.anchorPlaceID === anchor);
    const set = ['night', 'dawn', '24h', 'day', ''];
    near.forEach((p, i) => { p.timeWindow = set[i % set.length]; });
    // one with a real closing hour, so the hour-bearing path is exercised
    const withHour = near.find((p) => p.timeWindow === 'night');
    if (withHour) withHour.closeAt = '21:00';
    const withOpen = near.find((p) => p.timeWindow === 'dawn');
    if (withOpen) withOpen.openAt = '05:20';
    s.touch();
    return { anchor, n: near.length, windows: near.map((p) => p.timeWindow) };
  });
  console.log('  staged:', JSON.stringify(stop));
  check('§3.1 · a stop with nearby places to mark', stop.n >= 4, stop.n);

  await go('dest', { placeID: stop.anchor });
  await page.evaluate(() => document.querySelector('[data-panel="nearby"]')?.click());
  await page.waitForTimeout(500);

  const tokens = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.nearby-card')];
    return cards.map((c) => {
      const tw = c.querySelector('.tw');
      if (!tw) return null;
      const cs = getComputedStyle(tw);
      const dot = tw.querySelector('.tw-dot');
      const dcs = dot && getComputedStyle(dot);
      const chips = [...c.querySelectorAll('.row.g5 > *')];
      return {
        label: tw.textContent.trim(),
        colour: cs.color, bg: cs.backgroundColor,
        font: `${cs.fontSize}/${cs.fontWeight}`, radius: cs.borderTopLeftRadius,
        pad: cs.paddingTop + ' ' + cs.paddingLeft,
        dot: dot ? { cls: dot.className, w: Math.round(dot.getBoundingClientRect().width),
                     bg: dcs.backgroundColor, bd: dcs.borderTopWidth + ' ' + dcs.borderTopColor } : null,
        isLast: chips.length > 0 && chips[chips.length - 1] === tw,
      };
    });
  });
  console.log('  tokens:', JSON.stringify(tokens));
  const marked = tokens.filter(Boolean);
  check('§3.1 · only the marked windows get a token — day and none get nothing',
        tokens.filter((t) => t === null).length >= 2, `${marked.length} marked of ${tokens.length}`);
  check('§3.1 · every token is LAST in its chip row',
        marked.every((t) => t.isLast), JSON.stringify(marked.map((t) => t.isLast)));
  check('§3.1 · the token box is 3px/7px, r7, on #EFF1EE',
        marked.every((t) => t.pad === '3px 7px' && t.radius === '7px'
          && t.bg === 'rgb(239, 241, 238)'),
        JSON.stringify(marked.map((t) => `${t.pad} ${t.radius} ${t.bg}`)));

  const night = marked.find((t) => /TILL|AFTER DARK/.test(t.label));
  const dawn = marked.find((t) => /DAWN|BEFORE/.test(t.label));
  const h24 = marked.find((t) => t.label === '24H');
  check('§3.1 · night reads as a TIME, not a state — TILL 21:00, never "NIGHT"',
        night?.label === 'TILL 21:00', night?.label);
  check('§3.1 · with a FILLED dot in dusk violet',
        night?.dot?.cls.includes('filled') && night.dot.bg === 'rgb(110, 58, 140)'
          && night.dot.w === 6, JSON.stringify(night?.dot));
  check('§3.1 · dawn reads DAWN 05:20 when the record has an hour',
        dawn?.label === 'DAWN 05:20', dawn?.label);
  // The ring is authored at 1.6px. Chrome floors a fractional border to a
  // whole CSS pixel in getComputedStyle AND in paint, so 1px is the correct
  // expectation ON THIS ENGINE — proved against a bare 1.6px div in the same
  // render, the same way test/select-recipe.mjs does for the PAID field.
  const floored = await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'border:1.6px solid red;width:9px;height:9px';
    document.body.appendChild(d);
    const w = getComputedStyle(d).borderTopWidth;
    d.remove();
    return w;
  });
  check('§3.1 · with a HOLLOW dot — shape carries it in greyscale',
        dawn?.dot?.cls.includes('hollow') && dawn.dot.bg === 'rgba(0, 0, 0, 0)'
          && dawn.dot.bd === `${floored} rgb(110, 58, 140)`,
        `${JSON.stringify(dawn?.dot)} vs a bare 1.6px div at ${floored}`);
  check('§3.1 · the filled and hollow dots differ in SHAPE, not only in hue',
        night?.dot?.bg === 'rgb(110, 58, 140)' && dawn?.dot?.bg === 'rgba(0, 0, 0, 0)',
        `${night?.dot?.bg} vs ${dawn?.dot?.bg}`);
  check('§3.1 · both marks are 10.5px/800 in --offhours',
        [night, dawn].every((t) => t && t.font === '10.5px/800' && t.colour === 'rgb(110, 58, 140)'),
        JSON.stringify([night?.font, night?.colour]));
  check('§3.1 · 24H is a plain grey word — no dot, no hue',
        h24 && h24.dot === null && h24.colour === 'rgb(107, 122, 116)' && h24.font === '10.5px/700',
        JSON.stringify(h24));

  // ---- and it degrades when there is no hour, which is every Trip 12 row --
  const degraded = await page.evaluate(async () => {
    const s = window.__store;
    for (const p of s.state.places) { delete p.closeAt; delete p.openAt; }
    s.touch();
    await new Promise((r) => setTimeout(r, 450));
    return [...document.querySelectorAll('.tw')].map((t) => t.textContent.trim());
  });
  console.log('  degraded:', JSON.stringify(degraded));
  check('§3.1 · with no hour, night degrades to AFTER DARK',
        degraded.includes('AFTER DARK'), JSON.stringify(degraded));
  check('§3.1 · and dawn to BEFORE 08:00 — which is every one of Trip 12’s 105',
        degraded.includes('BEFORE 08:00'), JSON.stringify(degraded));

  // ---- the count line, and the Now filter --------------------------------
  const line = await page.evaluate(() => {
    const head = document.querySelector('.tw-now')?.closest('.row');
    return {
      text: head?.querySelector('.grow')?.textContent.trim().replace(/\s+/g, ' '),
      now: document.querySelector('.tw-now')?.textContent.trim(),
      engaged: document.querySelector('.tw-now')?.classList.contains('on'),
      pressed: document.querySelector('.tw-now')?.getAttribute('aria-pressed'),
      hiddenRow: Boolean(document.querySelector('.tw-hidden')),
      cards: document.querySelectorAll('.nearby-card').length,
    };
  });
  console.log('  line:', JSON.stringify(line));
  check('§3.1 · the count line says how many open only at dawn or night',
        /\d+ places? · \d+ open only at dawn or night/.test(line.text || ''), line.text);
  check('§3.1 · the Now chip is there', line.now === 'Now', line.now);
  check('§3.1 · DEFAULT OFF — nothing is hidden on first open',
        line.engaged === false && line.pressed === 'false' && line.hiddenRow === false,
        JSON.stringify(line));

  const filtered = await page.evaluate(async () => {
    const before = document.querySelectorAll('.nearby-card').length;
    document.querySelector('.tw-now').click();
    await new Promise((r) => setTimeout(r, 500));
    const hid = document.querySelector('.tw-hidden');
    return {
      before, after: document.querySelectorAll('.nearby-card').length,
      head: document.querySelector('.tw-now')?.closest('.row')?.querySelector('.grow')?.textContent.trim().replace(/\s+/g, ' '),
      on: document.querySelector('.tw-now')?.classList.contains('on'),
      hidden: hid?.textContent.replace(/\s+/g, ' ').trim(),
      show: hid?.querySelector('.tw-show')?.textContent.trim(),
      leftTokens: [...document.querySelectorAll('.tw')].map((t) => t.textContent.trim()),
      clock: new Date().getHours() * 60 + new Date().getMinutes(),
    };
  });
  console.log('  filtered:', JSON.stringify(filtered));
  check('§3.1 · Now removes rows', filtered.after < filtered.before,
        `${filtered.before} → ${filtered.after}`);
  check('§3.1 · and the head becomes "N of M open at HH:MM"',
        /^\d+ of \d+ open at \d{2}:\d{2}$/.test(filtered.head || ''), filtered.head);
  check('§3.1 · the chip shows it is engaged', filtered.on === true);
  check('§3.1 · a dashed row says how many it hid, and that they are not gone',
        /\d+ hidden — open at dawn or after dark\./.test(filtered.hidden || '')
          && /still here tomorrow morning/.test(filtered.hidden || ''), filtered.hidden);
  check('§3.1 · with the way back in the same row', filtered.show === 'Show', filtered.show);
  check('§3.1 · no dawn or night row survives the filter mid-morning',
        !filtered.leftTokens.some((t) => /AFTER DARK|BEFORE|TILL|DAWN/.test(t))
          || filtered.clock < 8 * 60 || filtered.clock >= 18 * 60,
        `${JSON.stringify(filtered.leftTokens)} at ${filtered.clock}`);
  check('§3.1 · 24H rows are NEVER hidden — a bonus, not a constraint',
        filtered.leftTokens.includes('24H'), JSON.stringify(filtered.leftTokens));

  const back = await page.evaluate(async () => {
    document.querySelector('.tw-show').click();
    await new Promise((r) => setTimeout(r, 500));
    return { cards: document.querySelectorAll('.nearby-card').length,
             on: document.querySelector('.tw-now')?.classList.contains('on'),
             hiddenRow: Boolean(document.querySelector('.tw-hidden')) };
  });
  check('§3.1 · Show puts them all back', back.cards === filtered.before, `${back.cards} vs ${filtered.before}`);
  check('§3.1 · and the filter is off again', back.on === false && back.hiddenRow === false);

  // ---- the clock logic itself, at three times of day --------------------
  const logic = await page.evaluate(() => {
    const s = window.__store;
    const mk = (w, extra = {}) => ({ timeWindow: w, ...extra });
    const at = (m) => ({
      dawn: s.openAtClock(mk('dawn'), m),
      night: s.openAtClock(mk('night'), m),
      day: s.openAtClock(mk('day'), m),
      h24: s.openAtClock(mk('24h'), m),
      none: s.openAtClock(mk(''), m),
    });
    return { at0620: at(6 * 60 + 20), at0935: at(9 * 60 + 35), at2100: at(21 * 60) };
  });
  console.log('  logic:', JSON.stringify(logic));
  check('§3.1 · at 06:20 a dawn place is open and a night place is not',
        logic.at0620.dawn === true && logic.at0620.night === false, JSON.stringify(logic.at0620));
  check('§3.1 · at 09:35 neither is', logic.at0935.dawn === false && logic.at0935.night === false,
        JSON.stringify(logic.at0935));
  check('§3.1 · at 21:00 the night place is open and the dawn one is not',
        logic.at2100.night === true && logic.at2100.dawn === false, JSON.stringify(logic.at2100));
  check('§3.1 · day, 24h and no-window are open at every hour — never invented shut',
        [logic.at0620, logic.at0935, logic.at2100].every((h) => h.day && h.h24 && h.none));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

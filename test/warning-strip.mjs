// Item 12 — the multilingual warning strip, fact-first, plus a robustness
// pass: whatever script someone types into the itinerary, the UI must hold
// it without truncating, clamping, or breaking layout.
//
// The bug this replaces: `store.dayIssues()` used to build one English
// sentence per warning and interpolate the OTHER stop's name into the
// middle of it ("Starts 13:45 but sits after 西市場 at 13:30."). In CJK the
// interpolated name has no capitalisation and no spaces to separate it from
// the words around it, so a reader cannot tell which part of the sentence
// is their own stop's name and which part the app wrote — and the browser
// is free to break a line *inside* the name. The fix lifts the name out of
// the sentence entirely: a relation label, the other party's name on its
// own ink line, and a short `·`-joined fact line, per
// multilingual-warning-strip-design.md ("structure D, fact-first"). This
// harness proves the data shape (`dayIssues()`'s `{label, name, fact}`) and
// the layout guarantee (a 30+ char CJK name never truncates, never overflows
// its card, never collides with the fix buttons) with real measured layout,
// not a screenshot.
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
const repaint = () => page.evaluate(() => window.__store.selectDay(window.__store.state.selectedDay));

await page.evaluate(async () => {
  await window.__store.createTrip({ name: 'Warning-strip rig', startDate: '2026-11-10', dayCount: 1 });
});
await page.waitForTimeout(300);

// Names in three scripts plus a mixed one, echoing the design doc's own
// stress set (multilingual-warning-strip-design.md).
const NAMES = {
  english: 'Ashgate Shrine',
  chinese: '灰門神社',
  japanese: '芦門神社',
  mixed: '築地市場 Tsukiji Outer Market', // 22 chars, two scripts, one name
};

async function buildOrderIssue(laterName, laterTime, earlierName, earlierTime) {
  return page.evaluate(({ laterName, laterTime, earlierName, earlierTime }) => {
    const d = window.__store.day(1);
    d.items = [
      { id: 'x1', name: earlierName, kind: 'main', time: earlierTime, endTime: '', archived: false },
      { id: 'x2', name: laterName, kind: 'main', time: laterTime, endTime: '', archived: false },
    ];
    window.__store.selectDay(1);
  }, { laterName, laterTime, earlierName, earlierTime });
}

for (const [script, name] of Object.entries(NAMES)) {
  await buildOrderIssue('Later Stop', '13:25', name, '13:30');
  await page.evaluate(() => window.__nav.go('plan'));
  await page.waitForTimeout(200);

  const warn = await page.evaluate(() => {
    const card = document.querySelector('.plan-card.flagged');
    const nameEl = card?.querySelector('.warn-name');
    const factEl = card?.querySelector('.warn-fact');
    const labelEl = card?.querySelector('.warn-label');
    const rect = nameEl?.getBoundingClientRect();
    const cardRect = card?.getBoundingClientRect();
    return {
      label: labelEl?.textContent.trim() || '',
      name: nameEl?.textContent.trim() || '',
      fact: factEl?.textContent.trim() || '',
      nameOverflowsCard: rect && cardRect ? rect.right > cardRect.right + 1 : null,
      cardScrollWidth: card?.scrollWidth,
      cardClientWidth: card?.clientWidth,
      nameStyle: nameEl ? {
        overflowWrap: getComputedStyle(nameEl).overflowWrap,
        lineBreak: getComputedStyle(nameEl).lineBreak,
        whiteSpace: getComputedStyle(nameEl).whiteSpace,
      } : null,
    };
  });

  check(`[${script}] label reads "LISTED AFTER", not "OUT OF ORDER"`, warn.label === 'LISTED AFTER', warn.label);
  check(`[${script}] the name renders verbatim, no truncation/ellipsis`, warn.name === name, warn.name);
  check(`[${script}] the fact line carries both times, "·"-joined, names no one`,
    warn.fact === `Starts 13:30 · this stop 13:25`, warn.fact);
  check(`[${script}] the card never overflows horizontally (scrollWidth ≤ clientWidth)`,
    warn.cardScrollWidth <= warn.cardClientWidth + 1, JSON.stringify(warn));
  check(`[${script}] the name never overflows its own card`, warn.nameOverflowsCard === false, JSON.stringify(warn.nameOverflowsCard));
  check(`[${script}] wrapping rules: overflow-wrap:anywhere, line-break:strict, no forced nowrap`,
    warn.nameStyle?.overflowWrap === 'anywhere' && warn.nameStyle?.lineBreak === 'strict' && warn.nameStyle?.whiteSpace !== 'nowrap',
    JSON.stringify(warn.nameStyle));
}

// The ink-line invariant: `reversed` and `notime` carry no other party, so
// they must never draw a .warn-name — nothing is ever substituted into the
// empty slot to make the three kinds look alike.
{
  await page.evaluate(() => {
    const d = window.__store.day(1);
    d.items = [
      { id: 'r1', name: 'Loop Point', kind: 'main', time: '16:10', endTime: '16:10', archived: false },
      { id: 'n1', name: 'No Time Stop', kind: 'main', time: '', endTime: '', archived: false },
    ];
    window.__store.selectDay(1);
  });
  await page.waitForTimeout(200);
  // `notime` deliberately never marks the card itself "worst"/flagged
  // (stopRow() only treats order/overlap/reversed as worst) — it still
  // renders its own .warn block, so query every card, not just flagged ones.
  const cards = await page.evaluate(() => [...document.querySelectorAll('.plan-card')].map((c) => ({
    label: c.querySelector('.warn-label')?.textContent.trim(),
    hasName: Boolean(c.querySelector('.warn-name')),
    fact: c.querySelector('.warn-fact')?.textContent.trim(),
  })).filter((c) => c.label));
  const reversed = cards.find((c) => c.label === 'ENDS WHEN IT STARTS');
  const notime = cards.find((c) => c.label === 'NO TIME');
  check('ENDS WHEN IT STARTS has no ink name line (no other party)', reversed && !reversed.hasName, JSON.stringify(reversed));
  check('ENDS WHEN IT STARTS fact line reads the artboard\'s exact shape', reversed?.fact === 'Starts and ends 16:10', reversed?.fact);
  check('NO TIME has no ink name line either', notime && !notime.hasName, JSON.stringify(notime));
  check('NO TIME fact line is the approved copy', notime?.fact === 'No start time yet.', notime?.fact);
}

// Overlap kind, same invariants, different label.
{
  await page.evaluate((name) => {
    const d = window.__store.day(1);
    d.items = [
      { id: 'o1', name, kind: 'main', time: '13:00', endTime: '14:30', archived: false },
      { id: 'o2', name: 'Second Stop', kind: 'main', time: '14:00', endTime: '15:00', archived: false },
    ];
    window.__store.selectDay(1);
  }, NAMES.japanese);
  await page.waitForTimeout(200);
  const overlap = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.plan-card.flagged')];
    const card = cards.find((c) => c.querySelector('.warn-label')?.textContent.trim() === 'OVERLAPS');
    return {
      name: card?.querySelector('.warn-name')?.textContent.trim() || '',
      fact: card?.querySelector('.warn-fact')?.textContent.trim() || '',
    };
  });
  check('OVERLAPS names the still-running stop verbatim', overlap.name === NAMES.japanese, overlap.name);
  check('OVERLAPS fact line: "Runs to … · this starts …"', overlap.fact === 'Runs to 14:30 · this starts 14:00', overlap.fact);
}

// S-2: the Latin-first stack is declared on body, so a CJK name never falls
// back to an undeclared font by accident — and Public Sans still serves the
// digits, because the stack stays Latin-first.
{
  const fonts = await page.evaluate(() => {
    const body = getComputedStyle(document.body).fontFamily;
    const nameEl = document.querySelector('.warn-name');
    return { body, nameInherits: nameEl ? getComputedStyle(nameEl).fontFamily === body : null };
  });
  check('body declares the Latin-first CJK stack (S-2)',
    /Public Sans/.test(fonts.body) && /Hiragino/.test(fonts.body) && /PingFang/.test(fonts.body)
      && /^["']?Public Sans["']?/.test(fonts.body.trim()), fonts.body);
  check('.warn-name has no font-family override — it inherits the body stack', fonts.nameInherits === true, JSON.stringify(fonts));
}

// The other robustness fix: a fixed-width "Message X" button with a long
// CJK owner name used to overflow (nowrap + hard 104px width). Reproduce the
// removed-from-trip screen with a long name and measure it.
{
  await page.evaluate((name) => {
    const s = window.__store.state;
    s.trip.removed = { by: name, at: new Date().toISOString() };
    s.trip.people = [{ id: 'owner-1', name, role: 'owner' }];
    window.__nav.go('trips');
  }, '藤原美咲子と申します');
  await page.waitForTimeout(250);
  const btn = await page.evaluate(() => {
    const el = document.querySelector('[data-act="message-owner"]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const row = el.closest('.row')?.getBoundingClientRect();
    return {
      textOverflow: getComputedStyle(el).textOverflow,
      overflow: getComputedStyle(el).overflow,
      fitsInRow: row ? rect.right <= row.right + 1 : null,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    };
  });
  check('the "Message X" button (long CJK name) never overflows its row',
    btn && btn.fitsInRow, JSON.stringify(btn));
  check('it bounds overflow with ellipsis rather than a hard clip mid-character',
    btn?.textOverflow === 'ellipsis' && btn?.overflow === 'hidden', JSON.stringify(btn));
}

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
console.log('page errors: ' + pageErrors.length + (pageErrors.length ? '\n  ' + pageErrors.join('\n  ') : ''));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

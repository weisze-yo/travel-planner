// §3.6 — ADD A STOP: IN FRONT, AND THE REST GOES QUIET.
//
// The report was "make this Add a stop card in front, which disables other
// navigation behind it with a greyish transparent layer". The greyish layer
// is the half that was rejected, and the reason is the whole decision: the
// itinerary behind this form is the REFERENCE MATERIAL it is read against —
// a stop's time only means something against the times around it — so a
// scrim would dim exactly the rows you are typing for.
//
// So this file gates the rule the section introduces, which is new to the
// app and stated so it is a decision rather than a drift:
//
//   scrim           when the background is context you can ignore
//   dim-and-stick   when the background IS the reference material
//
// Add-a-stop is the only case of the second kind today, and the assertions
// are shaped around proving both halves at once: the CHROME is at 40% and
// inert (header, both footer controls, tab bar), and the CONTENT is not —
// every row at full opacity, three of them whole between the header and the
// form. That last one is the property, not the pixel count: §3.6's "~232px
// occupied, three rows instead of six" was measured on Trip 12's Day 4,
// whose rows are shorter than this demo trip's.
//
// It also drove out something the artboard could not show. Opening the form
// left exactly ONE whole row visible, because the top of the Plan scroller
// is the weather banner and the edit hint rather than the day — Design's
// board is centred on the insertion point. So opening the form scrolls the
// day to it, once per opening, and the row count is the check that proves
// it.
//
// The cancel-on-tap behaviour is driven by really clicking the dimmed
// header and the dimmed footer controls, and the dim is asserted NOT to
// survive navigating away — the tab bar is a sibling of the screen host, so
// that reset belongs to nav.js and a leak would be invisible until someone
// found a permanently grey tab bar.
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

  const openForm = async () => {
    await go('plan');
    for (let t = 0; t < 2; t++) {
      if (await page.evaluate(() => Boolean(document.querySelector('[data-act="add-open"]')))) break;
      await page.evaluate(() => document.querySelector('[data-act="toggle-edit"]')?.click());
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => document.querySelector('[data-act="add-open"]')?.click());
    await page.waitForTimeout(500);
  };

  // ---- before: the form is not in the flow at all ------------------------
  await go('plan');
  for (let t = 0; t < 2; t++) {
    if (await page.evaluate(() => Boolean(document.querySelector('[data-act="add-open"]')))) break;
    await page.evaluate(() => document.querySelector('[data-act="toggle-edit"]')?.click());
    await page.waitForTimeout(400);
  }
  const closed = await page.evaluate(() => ({
    front: Boolean(document.querySelector('.dock-form')),
    bodyClass: document.body.classList.contains('front-form'),
    tabOpacity: getComputedStyle(document.querySelector('#tabbar')).opacity,
    headOpacity: getComputedStyle(document.querySelector('.head')).opacity,
    withFront: document.querySelector('.scroll')?.classList.contains('with-front'),
  }));
  console.log('  closed:', JSON.stringify(closed));
  check('§3.6 · nothing is dimmed while the form is shut',
        closed.front === false && closed.bodyClass === false
          && closed.tabOpacity === '1' && closed.headOpacity === '1' && !closed.withFront,
        JSON.stringify(closed));

  await openForm();
  const open = await page.evaluate(() => {
    const front = document.querySelector('.dock-form');
    const scroll = document.querySelector('.scroll');
    const head = document.querySelector('.head');
    const tab = document.querySelector('#tabbar');
    const screen = document.querySelector('.screen');
    if (!front) return { missing: true };
    const fb = front.getBoundingClientRect(), sb = screen.getBoundingClientRect();
    const fcs = getComputedStyle(front);
    const rows = [...document.querySelectorAll('.plan-card')];
    const foot = document.querySelector('[data-act="add-open"]')?.closest('.chrome-quiet');
    return {
      // docked, not in the flow
      position: fcs.position,
      bottomGap: Math.round(sb.bottom - fb.bottom),
      border: fcs.borderTopWidth + ' ' + fcs.borderTopColor,
      shadow: fcs.boxShadow,
      bg: fcs.backgroundColor,
      // no scrim anywhere
      scrim: document.querySelectorAll('.scrim').length,
      // the chrome is quiet and the ROWS ARE NOT
      headOpacity: getComputedStyle(head).opacity,
      headInert: getComputedStyle(head.firstElementChild).pointerEvents,
      headCancels: head.getAttribute('data-act'),
      tabOpacity: getComputedStyle(tab).opacity,
      tabInert: getComputedStyle(tab).pointerEvents,
      footOpacity: foot && getComputedStyle(foot).opacity,
      footCancels: foot?.getAttribute('data-act'),
      rowOpacities: rows.slice(0, 4).map((r) => getComputedStyle(r).opacity),
      // Rows fully inside the band between the header and the form — the
      // "three stops around the insertion point" the decision needs.
      scrollTop: Math.round(scroll.getBoundingClientRect().top),
      rowsVisible: rows.filter((r) => {
        const b = r.getBoundingClientRect();
        return b.top >= scroll.getBoundingClientRect().top && b.bottom <= fb.top;
      }).length,
      formH: Math.round(fb.height),
      // the scroller keeps room, so nothing is stranded under the form
      pad: getComputedStyle(scroll).paddingBottom,
      scrollable: scroll.scrollHeight > scroll.clientHeight,
      head2: document.querySelector('.dock-form .form-title')?.textContent.trim(),
      after: document.querySelector('.dock-form .form-title')?.nextElementSibling?.textContent.trim(),
      hint: document.querySelector('.dock-form .form-hint')?.textContent.trim().replace(/\s+/g, ' '),
      buttons: [...document.querySelectorAll('.dock-form button')].map((b) => b.textContent.trim()),
    };
  });
  console.log('  open:', JSON.stringify(open));
  check('§3.6 · the form is DOCKED, not in the document flow',
        open.position === 'absolute' && open.bottomGap === 0,
        `${open.position} ${open.bottomGap}px from the bottom`);
  check('§3.6 · with the existing 1.5px ink border and the sheet-class shadow',
        /rgb\(20, 32, 28\)/.test(open.border) && /rgba\(20, 32, 28, 0\.3\)/.test(open.shadow),
        `${open.border} | ${open.shadow}`);
  check('§3.6 · on an opaque ground, so rows scrolling under do not show through',
        open.bg === 'rgb(255, 255, 255)', open.bg);
  check('§3.6 · and NO SCRIM — the itinerary is the reference material',
        open.scrim === 0, open.scrim);
  check('§3.6 · the header goes to 40% and inert, and a tap cancels',
        open.headOpacity === '0.4' && open.headInert === 'none' && open.headCancels === 'add-cancel',
        `${open.headOpacity} ${open.headInert} ${open.headCancels}`);
  check('§3.6 · so do the two footer controls',
        open.footOpacity === '0.4' && open.footCancels === 'add-cancel',
        `${open.footOpacity} ${open.footCancels}`);
  check('§3.6 · and the tab bar, which is chrome the screen cannot reach',
        open.tabOpacity === '0.4' && open.tabInert === 'none',
        `${open.tabOpacity} ${open.tabInert}`);
  // The whole reason this is not a sheet.
  check('§3.6 · the stops stay at FULL contrast — the chrome dims, not the content',
        open.rowOpacities.every((o) => o === '1'), JSON.stringify(open.rowOpacities));
  // §3.6's own cost note: "~232px of the scroller is occupied while typing,
  // so the day shows three rows instead of six." Three whole rows above the
  // form is the property that matters — the exact pixel figure was measured
  // on Trip 12's Day 4, whose rows are shorter than the demo trip's.
  check('§3.6 · three whole stops stay between the header and the form',
        open.rowsVisible >= 3, `${open.rowsVisible} rows, form ${open.formH}px`);
  check('§3.6 · the scroller keeps room, so the day’s foot is not stranded under it',
        parseInt(open.pad, 10) >= 240 && open.scrollable === true,
        `${open.pad} scrollable ${open.scrollable}`);
  check('§3.6 · the head says where the stop will land',
        /^after \d{2}:\d{2} /.test(open.after || ''), open.after);
  check('§3.6 · and the hint holds the times either side still',
        /The times either side stay where they are\./.test(open.hint || ''), open.hint);
  check('§3.6 · nothing else is deleted — same jade Add, same ghost Cancel',
        open.buttons.includes('Add') && open.buttons.includes('Cancel'),
        JSON.stringify(open.buttons));

  // ---- a tap on the dimmed header cancels --------------------------------
  const tapped = await page.evaluate(async () => {
    document.querySelector('.head').click();
    await new Promise((r) => setTimeout(r, 500));
    return {
      front: Boolean(document.querySelector('.dock-form')),
      body: document.body.classList.contains('front-form'),
      tabOpacity: getComputedStyle(document.querySelector('#tabbar')).opacity,
    };
  });
  console.log('  tapped head:', JSON.stringify(tapped));
  check('§3.6 · a tap on the dimmed header cancels the form',
        tapped.front === false, JSON.stringify(tapped));
  check('§3.6 · and everything comes back to full contrast',
        tapped.body === false && tapped.tabOpacity === '1', JSON.stringify(tapped));

  // ---- a tap on the dimmed footer controls cancels too -------------------
  await openForm();
  const footTap = await page.evaluate(async () => {
    const foot = document.querySelector('[data-act="add-open"]').closest('.chrome-quiet');
    foot.click();
    await new Promise((r) => setTimeout(r, 500));
    return { front: Boolean(document.querySelector('.dock-form')) };
  });
  check('§3.6 · a tap on the quiet footer controls cancels rather than re-opening',
        footTap.front === false, JSON.stringify(footTap));

  // ---- and the dim never survives leaving the screen ---------------------
  await openForm();
  const left = await page.evaluate(async () => {
    window.__nav.go('shop');
    await new Promise((r) => setTimeout(r, 600));
    return {
      body: document.body.classList.contains('front-form'),
      tabOpacity: getComputedStyle(document.querySelector('#tabbar')).opacity,
    };
  });
  console.log('  left:', JSON.stringify(left));
  check('§3.6 · navigating away clears the dim — nav.js owns the reset',
        left.body === false && left.tabOpacity === '1', JSON.stringify(left));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

// §3.5 — THE SELECT, ELEVEN OF THEM, ON FIVE SCREENS.
//
// Every assertion here is a COMPUTED style read out of a real render at
// 375px, on the screen that really carries the control — not a source grep.
// That matters twice over for this section:
//
//   1. The bug it fixes was invisible in the source. `padding-right: 28px`
//      plus a background-image chevron LOOKS like a styled select; what it
//      is, is a chevron that drifts whenever a value grows long enough to
//      reach it, and there is no way to see that from the CSS.
//
//   2. §3.5 is a DEPENDENCY. §3.7's two new controls are drawn on this
//      recipe, so if it silently regresses, the Nearby restructure inherits
//      the regression. This file is what makes that loud.
//
// The two recipes, and the rule that separates them: a select in a FORM is a
// field you fill in (`.sel`, a 30px tab welded to the field's right edge); a
// select on a SAVED ROW is a correction to a record you already have
// (`.sel-chip`, 26px, the select IS the chip). One is not a smaller version
// of the other.
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
  await page.waitForTimeout(420);
};
const click = async (sel) => { await page.evaluate((s) => document.querySelector(s)?.click(), sel); await page.waitForTimeout(400); };

// ======================================= the INLINE recipe · a shopping row
{
  await go('shop');
  const r = await page.evaluate(() => {
    const chip = document.querySelector('.sel-chip');
    if (!chip) return { missing: true };
    const sel = chip.querySelector('select');
    const c = getComputedStyle(chip), s = getComputedStyle(sel);
    const a = getComputedStyle(chip, '::after');
    const cr = chip.getBoundingClientRect(), sr = sel.getBoundingClientRect();
    return {
      chipH: Math.round(cr.height), chipR: c.borderTopLeftRadius, chipBg: c.backgroundColor,
      selH: Math.round(sr.height), font: s.fontSize + '/' + s.fontWeight,
      selBorder: s.borderTopWidth, selBg: s.backgroundColor,
      padL: s.paddingLeft, padR: s.paddingRight,
      afterW: a.width, afterImg: a.backgroundImage.startsWith('url('),
      overTop: Math.round(cr.top - sr.top), overBottom: Math.round(sr.bottom - cr.bottom),
      chips: document.querySelectorAll('.sel-chip').length,
      payChipWrappers: [...document.querySelectorAll('.pay-chip')].filter((e) => e.querySelector('select')).length,
    };
  });
  check('inline · the chip is painted 26px', r.chipH === 26, r.chipH);
  check('inline · r8, on #EFF1EE', r.chipR === '8px' && r.chipBg === 'rgb(239, 241, 238)', `${r.chipR} ${r.chipBg}`);
  check('inline · 11.5px / 700 — a value, not typed text', r.font === '11.5px/700', r.font);
  // The select is transparent and borderless BECAUSE the chip is the ground.
  // If either comes back, we are looking at a select inside a chip again,
  // which is the reported bug.
  check('inline · the select is transparent and borderless — the CHIP is the control',
        r.selBg === 'rgba(0, 0, 0, 0)' && r.selBorder === '0px', `${r.selBg} ${r.selBorder}`);
  check('inline · 9px of text inset, 22px reserved for the chevron',
        r.padL === '9px' && r.padR === '22px', `${r.padL} ${r.padR}`);
  check('inline · the chevron is a real 22px element, not a background hack',
        r.afterW === '22px' && r.afterImg, `${r.afterW} ${r.afterImg}`);
  // F2 · 26 SEEN, 44 FELT. Raising the painted box to 44px would add ~18px
  // to every shopping row and every nearby card — ~550px down a 31-row list.
  check('F2 · the touchable box is 44px', r.selH === 44, r.selH);
  check('F2 · expanding vertically only — 9px above, 9px below, chip height unmoved',
        r.overTop === 9 && r.overBottom === 9, `${r.overTop}/${r.overBottom}`);
  check('inline · .pay-chip no longer wraps a select anywhere', r.payChipWrappers === 0, r.payChipWrappers);
  check('inline · both chips on every row', r.chips >= 2 && r.chips % 2 === 0, r.chips);
}

// ========================================== the FORM recipe · Add an item
{
  await click('[data-act="add-toggle"]');
  const r = await page.evaluate(() => {
    const w = document.querySelector('.form .sel');
    if (!w) return { missing: true };
    const sel = w.querySelector('select');
    const a = getComputedStyle(w, '::after'), s = getComputedStyle(sel);
    const wr = w.getBoundingClientRect(), sr = sel.getBoundingClientRect();
    // getComputedStyle returns a LIVE declaration, so the resting values have
    // to be copied out to strings BEFORE anything is focused — reading them
    // afterwards reports the focus state and every resting check passes for
    // the wrong reason (or, as here, fails for the wrong reason).
    const rest = {
      tabW: a.width, tabBg: a.backgroundColor,
      tabBd: a.borderLeftWidth + ' ' + a.borderLeftColor,
      tabRadius: a.borderTopRightRadius + '/' + a.borderTopLeftRadius,
      weight: s.fontWeight, size: s.fontSize, padR: s.paddingRight, bgImage: s.backgroundImage,
      h: Math.round(sr.height), radius: s.borderTopLeftRadius, bd: s.borderTopColor,
      fills: Math.abs(sr.width - wr.width) < 1.5,
    };
    sel.focus();
    const f = getComputedStyle(w, '::after');
    return { ...rest, focusBg: f.backgroundColor, focusBd: f.borderLeftColor };
  });
  check('form · a real 30px tab, flush inside the field border', r.tabW === '30px', r.tabW);
  check('form · one step darker than the white field — --bone', r.tabBg === 'rgb(242, 243, 241)', r.tabBg);
  check('form · a 1px --field-bd hairline down its left', r.tabBd === '1px rgb(221, 226, 222)', r.tabBd);
  check('form · rounded on the field side only', r.tabRadius === '9px/0px', r.tabRadius);
  check('form · a chosen value sits at 650 where every input sits at 400', r.weight === '650', r.weight);
  // Design's own constraint: "Nothing about the field's box changed."
  check('form · the field box is untouched — 35px, 13px, r10, --field-bd',
        r.h === 35 && r.size === '13px' && r.radius === '10px' && r.bd === 'rgb(221, 226, 222)',
        `${r.h} ${r.size} ${r.radius} ${r.bd}`);
  check('form · the background-image chevron is gone', r.bgImage === 'none', r.bgImage);
  check('form · padding-right clears the real tab, it is not the old 28px hack',
        r.padR === '40px', r.padR);
  check('form · the select fills its wrapper', r.fills === true);
  check('form · on focus the tab follows the field into jade — one recipe, two states',
        r.focusBg === 'rgb(230, 239, 235)' && r.focusBd === 'rgb(207, 224, 217)',
        `${r.focusBg} ${r.focusBd}`);
}

// ============================== all eight form selects, on their own screens
const readAll = () => page.evaluate(() => {
  const out = { ids: [], bare: [], bgimg: [], tabs: [], weights: [] };
  for (const s of document.querySelectorAll('select')) {
    const w = s.closest('.sel'), c = s.closest('.sel-chip');
    out.ids.push(s.id || (s.getAttribute('data-pay-for') ? 'row-pay'
      : s.getAttribute('data-cat-for') ? 'row-cat' : '?'));
    if (w) { out.tabs.push(getComputedStyle(w, '::after').width); out.weights.push(getComputedStyle(s).fontWeight); }
    else if (!c) out.bare.push(s.id || '?');
    if (getComputedStyle(s).backgroundImage !== 'none') out.bgimg.push(s.id || '?');
  }
  return out;
});
const sweep = async (label, want) => {
  const r = await readAll();
  check(`${label} · ${want.join(' + ')} on screen`, want.every((i) => r.ids.includes(i)), r.ids.join(','));
  check(`${label} · no select left outside a recipe`, r.bare.length === 0, r.bare.join(','));
  check(`${label} · no background chevron survives`, r.bgimg.length === 0, r.bgimg.join(','));
  check(`${label} · every form tab 30px`, r.tabs.length > 0 && r.tabs.every((t) => t === '30px'), r.tabs.join(','));
  check(`${label} · every chosen value 650`, r.weights.every((w) => w === '650'), r.weights.join(','));
};

{ // parts.js · the shopping-item editor
  await go('shop');
  await click('[data-edit-item]');
  await sweep('parts · item editor', ['edit-place']);
}
{ // plan.js · Add a stop
  await go('plan');
  await click('[data-act="toggle-edit"]');
  await click('[data-act="add-open"]');
  await sweep('plan · add a stop', ['add-place']);
}
{ // plan.js · the sub-route sheet, which needs a day with a free lane
  //
  // plan.js keeps `editing` and the add form in MODULE state, which survives
  // go('plan'). So this cannot blindly click toggle-edit — after the block
  // above, edit mode is already on and the add form is open, and one more
  // click would turn edit OFF. Cancel the form, then toggle only until the
  // lane slots are actually on screen.
  await click('[data-act="add-cancel"]');
  await go('plan');
  const days = await page.evaluate(() => (window.__store.state.days || []).length);
  let opened = false;
  for (let d = 1; d <= days && !opened; d++) {
    await page.evaluate((n) => window.__store.setCurrentDay?.(n) ?? window.__nav.go('plan', { day: n }), d);
    await page.waitForTimeout(320);
    for (let t = 0; t < 2; t++) {
      if (await page.evaluate(() => Boolean(document.querySelector('[data-new-loop]')))) break;
      await click('[data-act="toggle-edit"]');
    }
    opened = await page.evaluate(() => {
      const el = document.querySelector('[data-new-loop]');
      if (!el) return false;
      el.click(); return true;
    });
  }
  await page.waitForTimeout(420);
  check('plan · a free lane exists to open the sub-route sheet on', opened);
  if (opened) await sweep('plan · sub-route sheet', ['lane-start', 'lane-end']);
}
{ // sub.js · the loop's own start and end
  const loopID = await page.evaluate(() => window.__store.state.subRoutes?.[0]?.id || null);
  check('sub · a sub route exists in the demo trip', Boolean(loopID), loopID);
  if (loopID) {
    await go('sub', { loopID });
    await click('[data-act="toggle-edit"]');
    await sweep('sub · loop start and end', ['loop-start', 'loop-end']);
  }
}
{ // nearby.js · Add a place
  const stop = await page.evaluate(() => {
    for (const d of (window.__store.state.days || [])) {
      for (const it of (d.items || d.plan || [])) if (it?.placeID) return it.placeID;
    }
    return null;
  });
  check('nearby · a stop with a placeID exists', Boolean(stop), stop);
  if (stop) {
    await go('nearby', { placeID: stop });
    await click('[data-act="add-open"]');
    await sweep('nearby · add a place', ['np-cat']);
  }
}

// ==================================== the PAID field · Bug Findings B7
//
// §3.5 draws PAID at 26px/12px sharing one line with the two selects; B7
// draws it at 38px/15px on a line of its own with the estimate beside it.
// The shipped layout (bug 24) is B7's, so B7's sizing is the one that
// matches it — and it is the sizing that answers what was reported: "the box
// is too small... can't visualize how much has been entered at all".
//
// The border is authored at 1.5px, matching .btn-dashed and .plan-card.sub.
// Chrome floors a fractional border to a whole CSS pixel in getComputedStyle
// AND in paint, so 1px is the correct expectation ON THIS ENGINE — verified
// by measuring a bare 1.5px div in the same render, below.
{
  await go('shop');
  const r = await page.evaluate(async () => {
    document.querySelector('[data-act="tick"]')?.click();
    await new Promise((res) => setTimeout(res, 500));
    const el = document.querySelector('.paid-input');
    if (!el) return { missing: true };
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    const probe = document.createElement('div');
    probe.style.cssText = 'border:1.5px solid red;width:9px;height:9px';
    document.body.appendChild(probe);
    const floored = getComputedStyle(probe).borderTopWidth;
    probe.remove();
    return {
      h: Math.round(box.height), w: Math.round(box.width),
      size: cs.fontSize, weight: cs.fontWeight, tnum: cs.fontVariantNumeric,
      bd: cs.borderTopWidth, bdColor: cs.borderTopColor,
      radius: cs.borderTopLeftRadius, bg: cs.backgroundColor,
      cap: document.querySelector('.paid-cap') && getComputedStyle(document.querySelector('.paid-cap')).fontSize,
      est: document.querySelector('.paid-est')?.textContent.trim() || null,
      ownLine: Math.round(document.querySelector('.paid-wrap').getBoundingClientRect().width),
      topEst: Boolean(document.querySelector('.paid-wrap').closest('.item').querySelector('.item-est')),
      floored,
    };
  });
  check('B7 · PAID is 38px tall', r.h === 38, r.h);
  check('B7 · 15px, 700, tabular figures',
        r.size === '15px' && r.weight === '700' && r.tnum === 'tabular-nums',
        `${r.size} ${r.weight} ${r.tnum}`);
  check('B7 · jade border, r10, on #F7FBF9',
        r.bdColor === 'rgb(207, 224, 217)' && r.radius === '10px' && r.bg === 'rgb(247, 251, 249)',
        `${r.bdColor} ${r.radius} ${r.bg}`);
  check('B7 · the authored 1.5px border is floored by the engine, not overridden',
        r.bd === r.floored, `paid ${r.bd} vs bare 1.5px div ${r.floored}`);
  check('B7 · the PAID cap is 11px / jade', r.cap === '11px', r.cap);
  check('B7 · the estimate sits beside the real number', /^est\./.test(r.est || ''), r.est);
  check('B7 · and is NOT also shown top-right — the same number twice', r.topEst === false);
  check('B7 · PAID has a line of its own, and the field is readable',
        r.ownLine > 250 && r.w > 150, `line ${r.ownLine}, field ${r.w}`);
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

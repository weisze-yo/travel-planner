// B2 — OPACITY BELOW 1 IS NEVER A STATE IN THIS APP.
//
// Bugs 3 and 20 were one defect reported twice: `opacity` meant two
// unrelated things — "finished" (.86) and "loading" (.45) — and every
// swipeable row has a solid red `.swipe-bin` delete track behind it, so
// anything that faded a card faded the one thing hiding the dustbin. A
// delete button appeared without anyone having swiped.
//
// The first fix moved the fade from the card to its contents. That stopped
// the bin showing but left opacity carrying a meaning, which meant "is this
// card opaque?" stayed a correctness question on four screens. This file
// gates the rule that removes the bug class instead:
//
//   the bin track is NOT PAINTED until the row is actually being dragged.
//
// Once that holds, no card anywhere has to be opaque to be correct.
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
  window.__parts = await import('./js/screens/parts.js');
});
const go = async (s, a) => {
  await page.evaluate(([x, y]) => window.__nav.go(x, y), [s, a]);
  await page.waitForTimeout(420);
};

// ============================ the bin track, on every screen that has one
//
// Four screens carry swipeable rows. The old bug only ever showed up on two
// of them, because the other two happened to have opaque faces — which is
// exactly why the rule has to be checked on all four rather than on the two
// that were reported.
for (const [label, screen] of [
  ['trips', 'trips'], ['shop', 'shop'], ['plan · edit mode', 'plan'], ['log', 'log'],
]) {
  await go(screen);
  // On Plan a stop's delete track only exists in edit mode — outside it
  // there is nothing to drag, which is correct and means nothing to check.
  if (screen === 'plan') {
    await page.evaluate(() => document.querySelector('[data-act="toggle-edit"]')?.click());
    await page.waitForTimeout(400);
  }
  const r = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.swipe-row')];
    // Not every .swipe-row carries a bin — some are rows the swipe machinery
    // manages for the drag lock alone. Only the ones with a delete track can
    // have this bug, so the count is reported rather than assumed.
    const rows = all.filter((x) => x.querySelector('.swipe-bin') && x.querySelector('.swipe-face'));
    return {
      n: rows.length, skipped: all.length - rows.length,
      bins: rows.map((x) => getComputedStyle(x.querySelector('.swipe-bin')).visibility),
      faces: rows.map((x) => getComputedStyle(x.querySelector('.swipe-face')).opacity),
      contents: rows.flatMap((x) => [...x.querySelector('.swipe-face').children]
        .map((k) => getComputedStyle(k).opacity)),
    };
  });
  if (!r.n) {
    check(`${label} · has rows with a delete track to check`, false,
          `${r.skipped} swipe-rows without a bin, 0 with one`);
    continue;
  }
  check(`${label} · no delete track painted at rest (${r.n} rows${
        r.skipped ? `, ${r.skipped} binless`  : ''})`,
        r.bins.every((v) => v === 'hidden'), r.bins.join(','));
  check(`${label} · no card FACE is translucent`, r.faces.every((o) => o === '1'), r.faces.join(','));
  check(`${label} · no card CONTENT is translucent either`,
        r.contents.every((o) => o === '1'), r.contents.join(','));
}

// ==================================== and it IS painted once the face moves
{
  await go('trips');
  const drag = await page.evaluate(async () => {
    const row = document.querySelector('.swipe-row');
    const bin = row.querySelector('.swipe-bin');
    const face = row.querySelector('.swipe-face');
    const box = row.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const at = (t, x, win) => (win ? window : row).dispatchEvent(new PointerEvent(t, {
      bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true,
    }));
    const x0 = box.right - 30;
    at('pointerdown', x0);
    const atRest = getComputedStyle(bin).visibility;
    at('pointermove', x0 - 14, true);
    at('pointermove', x0 - 40, true);
    const mid = { vis: getComputedStyle(bin).visibility, cls: row.className, tf: getComputedStyle(face).transform };
    at('pointermove', x0 - 95, true);
    at('pointerup', x0 - 95, true);
    await new Promise((r) => setTimeout(r, 280));
    return { atRest, mid, latched: getComputedStyle(bin).visibility, latchCls: row.className };
  });
  check('B2 · hidden the instant before the drag', drag.atRest === 'hidden', drag.atRest);
  check('B2 · painted the moment the drag begins',
        drag.mid.vis === 'visible', `${drag.mid.vis} (${drag.mid.cls})`);
  // The distinction the rule turns on: the bin arrives because the FACE
  // MOVED, not because anything faded.
  check('B2 · revealed by the face MOVING', /matrix|translate/.test(drag.mid.tf), drag.mid.tf);
  check('B2 · and stays painted while the row is latched open',
        drag.latched === 'visible', `${drag.latched} (${drag.latchCls})`);
}

// ============================================= a FINISHED trip is a quiet card
{
  await go('trips');
  const r = await page.evaluate(() => {
    const el = document.querySelector('.trip-plain.done');
    if (!el) return { missing: true };
    const cs = getComputedStyle(el);
    const name = el.querySelector('.trip-card-name'), meta = el.querySelector('.trip-card-meta');
    return {
      bg: cs.backgroundColor, bd: cs.borderTopWidth + ' ' + cs.borderTopColor, opacity: cs.opacity,
      name: name && getComputedStyle(name).color, meta: meta && getComputedStyle(meta).color,
    };
  });
  check('B2 · a finished trip is a BONE card, not a translucent white one',
        r.bg === 'rgb(242, 243, 241)', r.bg);
  check('B2 · with a 1px --line hairline', r.bd === '1px rgb(231, 234, 231)', r.bd);
  check('B2 · at full opacity', r.opacity === '1', r.opacity);
  // Deliberately NOT greyed: a finished trip is the one you re-read
  // afterwards for what you spent and what you wrote. Quiet, not weak.
  check('B2 · its title stays --ink', r.name === 'rgb(20, 32, 28)', r.name);
  check('B2 · its meta stays the ordinary --muted, not a second grey',
        r.meta === 'rgb(107, 122, 116)', r.meta);
}

// =========================================== LOADING is a label, not a fade
//
// The Opening label itself is only reachable when an open outlives one
// animation frame — nav.js coalesces store writes into one rAF on purpose,
// so a local trip that opens inside a single task shows nothing, which is
// the right outcome (a one-frame flash is worse than no label). What can be
// gated here is everything around it: that the fade is gone, that the old
// amber chip is gone, that inertness is pointer-events only, and that the
// ring the label is built from behaves.
{
  await go('trips');
  const gone = await page.evaluate(() => {
    document.querySelector('[data-open-trip]').click();
    return {
      cardBusy: document.querySelectorAll('.card-busy').length,
      amberChip: [...document.querySelectorAll('.chip')].some((c) => /Opening/.test(c.textContent)),
    };
  });
  check('B2 · .card-busy — the contents fade — is gone from the app', gone.cardBusy === 0, gone.cardBusy);
  check('B2 · and so is the amber "Opening…" chip it sat beside', gone.amberChip === false);

  const css = await page.evaluate(async () => {
    const text = await (await fetch('./css/app.css')).text();
    return {
      hasCardBusy: /\.card-busy\s*>\s*\*/.test(text),
      hasDoneTint: /\.trip-plain\.done\s*\{[^}]*#FCFCFB/.test(text),
      binHidden: /\.swipe-bin\s*\{[^}]*visibility:\s*hidden/.test(text),
    };
  });
  check('B2 · the .card-busy opacity rule is deleted, not merely unused', css.hasCardBusy === false);
  check('B2 · and the #FCFCFB near-white finished tint with it', css.hasDoneTint === false);
  check('B2 · .swipe-bin is authored hidden', css.binHidden === true);

  // The ring the label is built from, at its one other call site.
  // Measured in BOTH contexts on purpose. `.sync-ring` is a <span>, and
  // width/height do not apply to a non-replaced inline box — so it used to
  // be 10px only by luck, inside whichever flex row happened to hold it.
  const ring = await page.evaluate(() => {
    const read = (parent) => {
      const el = document.createElement('span');
      el.className = 'sync-ring';
      parent.appendChild(el);
      const cs = getComputedStyle(el), box = el.getBoundingClientRect();
      const out = {
        w: Math.round(box.width), h: Math.round(box.height),
        radius: cs.borderTopLeftRadius, anim: cs.animationName, top: cs.borderTopColor,
      };
      el.remove();
      return out;
    };
    const flex = document.createElement('div');
    flex.className = 'row g7';
    flex.style.alignItems = 'center';
    document.body.appendChild(flex);
    const inFlex = read(flex);
    flex.remove();
    return { bare: read(document.body), inFlex };
  });
  check('B2 · the label reuses the app’s own 10px .sync-ring, in a flex row',
        ring.inFlex.w === 10 && ring.inFlex.h === 10 && ring.inFlex.radius === '50%',
        JSON.stringify(ring.inFlex));
  check('B2 · and it holds that size standalone too, not only inside a flex parent',
        ring.bare.w === 10 && ring.bare.h === 10, JSON.stringify(ring.bare));
  check('B2 · which is the existing spinner, jade at the top',
        ring.inFlex.anim === 'sync-spin' && ring.inFlex.top === 'rgb(31, 111, 92)',
        `${ring.inFlex.anim} ${ring.inFlex.top}`);

  // ...and it honours reduced motion, so the still ring plus the WORD is
  // what carries the state — which is why the word is there at all.
  const reduced = await ctx.newPage();
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await reduced.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
  await reduced.waitForTimeout(900);
  const still = await reduced.evaluate(() => {
    const el = document.createElement('span');
    el.className = 'sync-ring';
    document.body.appendChild(el);
    const a = getComputedStyle(el).animationName;
    el.remove();
    return a;
  });
  await reduced.close();
  check('B2 · under prefers-reduced-motion the ring does not spin — the word must read alone',
        still === 'none', still);

  const src = await page.evaluate(async () => (await fetch('./js/screens/trips.js')).text());
  check('B2 · both cards render the label from one helper',
        (src.match(/openingLabel\(\)/g) || []).length === 2,
        (src.match(/openingLabel\(\)/g) || []).length);
  check('B2 · the label is a ring plus the word Opening',
        /sync-ring[\s\S]{0,200}>Opening</.test(src));
  check('B2 · inertness is pointer-events only, with aria-busy on the one card',
        /aria-busy="true" style="pointer-events:none"/.test(src));
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

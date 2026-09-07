// B5 and B10 — where deleting a sub route lives, and the two ways out of a
// removal notice.
//
//   B5  "Delete this sub route" came out of the loop EDITOR (bug 11),
//       because the editor is a place you go to arrange. Its job lands on
//       Plan's edit mode instead: the same rust ✕ a stop already has, in the
//       same place on the card, with the same 6-second undo — and an undo
//       line that says the PLACES SURVIVE, which is the one question a
//       traveller would otherwise have to guess at.
//   B10 the removal notice had one way out, and it was "claim this trip".
//       The reported bug was that it came back on every launch; the deeper
//       half was that there was no way to say "I have dealt with this"
//       without claiming. Now there are two, and both write the answer down.
//
// The card is a role="button" div rather than a <button> because in edit
// mode it CONTAINS one, so this file also asserts no button ends up nested
// inside another — which is what would happen if the ✕ were added without
// that change.
//
// B10's removal is staged the way the envelope watch stages it, and the
// destructive path is walked twice: once to cancel, once to finish.
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

  // ================================ B5 · the sub route's rust ✕, on the grid
  await go('plan');
  const loopDay = await page.evaluate(async () => {
    const s = window.__store;
    const r = (s.state.subRoutes || [])[0];
    if (r) { s.selectDay(r.dayNumber); await new Promise((x) => setTimeout(x, 500)); return r.dayNumber; }
    return null;
  });
  check('B5 · a sub route exists to check', Boolean(loopDay), loopDay);

  const rest = await page.evaluate(() => {
    const card = document.querySelector('.loop-lane');
    if (!card) return { missing: true };
    return {
      tag: card.tagName, role: card.getAttribute('role'), tab: card.getAttribute('tabindex'),
      hasRemove: Boolean(card.querySelector('[data-act="loop-remove"]')),
      align: getComputedStyle(card).textAlign, cursor: getComputedStyle(card).cursor,
      nestedButtonInButton: Boolean(document.querySelector('button button')),
    };
  });
  console.log('  loop card at rest:', JSON.stringify(rest));
  check('B5 · the card is a role="button" div, so it can hold a button',
        rest.tag === 'DIV' && rest.role === 'button' && rest.tab === '0', JSON.stringify(rest));
  check('B5 · and keeps the left alignment and pointer a <button> gave it free',
        rest.align === 'left' && rest.cursor === 'pointer', `${rest.align} ${rest.cursor}`);
  check('B5 · no ✕ at rest — deletion is edit mode’s', rest.hasRemove === false);
  check('B5 · and no button is nested inside another anywhere on the screen',
        rest.nestedButtonInButton === false);

  const edit = await page.evaluate(async () => {
    document.querySelector('[data-act="toggle-edit"]').click();
    await new Promise((r) => setTimeout(r, 450));
    const card = document.querySelector('.loop-lane');
    const x = card?.querySelector('[data-act="loop-remove"]');
    const stopX = document.querySelector('.plan-card [data-act="remove"]');
    if (!x) return { noX: true, html: card?.outerHTML.slice(0, 200) };
    const xb = x.getBoundingClientRect(), cb = card.getBoundingClientRect();
    const sb = stopX?.getBoundingClientRect();
    const sc = stopX?.closest('.plan-card')?.getBoundingClientRect();
    return {
      cls: x.className, text: x.textContent.trim(),
      colour: getComputedStyle(x).color,
      // "same position" = the same offset from its own card's top-right
      fromRight: Math.round(cb.right - xb.right), fromTop: Math.round(xb.top - cb.top),
      stopFromRight: sb && sc ? Math.round(sc.right - sb.right) : null,
      stopFromTop: sb && sc ? Math.round(sb.top - sc.top) : null,
      nested: Boolean(document.querySelector('button button')),
      label: x.getAttribute('aria-label'),
    };
  });
  console.log('  in edit mode:', JSON.stringify(edit));
  check('B5 · in edit mode the card carries the same rust ✕ class a stop has',
        edit.cls === 'plan-remove' && edit.text === '✕', `${edit.cls} ${edit.text}`);
  // "Same position" means the top-right of the card's own header row, which
  // both are. The 1px difference is the two cards' own padding — .plan-card
  // is 12/14 and the dashed .loop-lane is 11/12 — and changing the amber
  // card's geometry is not what B5 asked for.
  check('B5 · in the same position — the header row’s top-right on both cards',
        Math.abs(edit.fromRight - edit.stopFromRight) <= 3
          && Math.abs(edit.fromTop - edit.stopFromTop) <= 3,
        `loop ${edit.fromRight}/${edit.fromTop} vs stop ${edit.stopFromRight}/${edit.stopFromTop}`);
  check('B5 · still no nested buttons with the ✕ present', edit.nested === false);
  check('B5 · and it names what it removes', /Remove .+ from this day/.test(edit.label || ''), edit.label);

  // ---- the undo line says the places survive ----------------------------
  const undo = await page.evaluate(async () => {
    const s = window.__store;
    const before = (s.state.subRoutes || []).length;
    const placesBefore = (s.state.places || []).length;
    document.querySelector('[data-act="loop-remove"]').click();
    await new Promise((r) => setTimeout(r, 450));
    const bar = document.querySelector('.undo-bar');
    const out = {
      routes: (s.state.subRoutes || []).length, before,
      places: (s.state.places || []).length, placesBefore,
      line: bar?.textContent.replace(/\s+/g, ' ').trim(),
      canUndo: Boolean(bar?.querySelector('[data-act="undo"]')),
    };
    bar?.querySelector('[data-act="undo"]')?.click();
    await new Promise((r) => setTimeout(r, 400));
    out.restored = (s.state.subRoutes || []).length;
    return out;
  });
  console.log('  undo:', JSON.stringify(undo));
  check('B5 · the ✕ really removes the sub route', undo.routes === undo.before - 1,
        `${undo.before} → ${undo.routes}`);
  check('B5 · and takes none of its places with it',
        undo.places === undo.placesBefore, `${undo.placesBefore} → ${undo.places}`);
  check('B5 · the undo line says the places go back to just being saved',
        /go back to just being saved/.test(undo.line || ''), undo.line);
  check('B5 · and names the day, so it cannot be the wrong one',
        /Gone from Day \d/.test(undo.line || ''), undo.line);
  check('B5 · the 6-second undo really brings it back',
        undo.restored === undo.before, `${undo.routes} → ${undo.restored}`);

  // ---- and "Delete this sub route" is still gone from the editor --------
  const editor = await page.evaluate(async () => {
    const id = (window.__store.state.subRoutes || [])[0]?.id;
    window.__nav.go('sub', { loopID: id });
    await new Promise((r) => setTimeout(r, 500));
    document.querySelector('[data-act="toggle-edit"]')?.click();
    await new Promise((r) => setTimeout(r, 450));
    return { txt: /Delete this sub route/i.test(document.querySelector('#app').textContent) };
  });
  check('B5 · "Delete this sub route" is not in the loop editor', editor.txt === false);

  // ============================== B10 · two ways out of the removal notice
  //
  // Staged the way the envelope watch stages it: a joined copy whose owner
  // has dropped this phone from the joiners map.
  await page.evaluate(async () => {
    const s = window.__store;
    s.state.trip.sharedFrom = { from: 'weisze.ai' };
    s.state.trip.listedInShare = true;
    s.state.trip.removed = { by: 'weisze.ai', on: '2026-09-06', at: '2026-09-06T09:00:00Z' };
    s.touch();
    await new Promise((r) => setTimeout(r, 500));
  });
  await go('trips');
  const notice = await page.evaluate(() => {
    const eyebrow = [...document.querySelectorAll('.eyebrow')]
      .find((e) => /No longer shared with you/i.test(e.textContent));
    const btns = [...document.querySelectorAll('button')].map((b) => b.textContent.trim());
    return {
      shown: Boolean(eyebrow),
      keep: btns.find((b) => /^Keep my side as its own trip$/.test(b)),
      letGo: btns.find((b) => /^Let it go$/.test(b)),
      message: btns.some((b) => /^Message /.test(b)),
      copy: document.querySelector('#app').textContent.replace(/\s+/g, ' ').match(/Keeping it makes[^.]*\.[^.]*\./)?.[0],
    };
  });
  console.log('  notice:', JSON.stringify(notice));
  check('B10 · the removal notice is on screen', notice.shown === true);
  check('B10 · TWO ways out, not one',
        Boolean(notice.keep) && Boolean(notice.letGo), `${notice.keep} / ${notice.letGo}`);
  check('B10 · and "Message <owner>" is still gone', notice.message === false);
  check('B10 · the copy explains both', /Letting it go/.test(notice.copy || ''), notice.copy);

  // ---- Let it go names the loss before it takes it ----------------------
  const gate = await page.evaluate(async () => {
    document.querySelector('[data-act="let-go"]').click();
    await new Promise((r) => setTimeout(r, 450));
    const btns = [...document.querySelectorAll('button')].map((b) => b.textContent.trim());
    const warn = document.querySelector('#app').textContent.replace(/\s+/g, ' ');
    const final = document.querySelector('[data-act="let-final"]');
    const cs = final && getComputedStyle(final);
    const out = {
      asked: /This removes .* from this phone/.test(warn),
      namesTheThree: /shopping\s*list, the packing list and the Log/.test(warn),
      noUndo: /There is no undo/.test(warn),
      hasCancel: btns.includes('Keep it for now'),
      hasFinal: Boolean(final),
      bg: cs?.backgroundColor, fg: cs?.color,
      stillThere: Boolean(window.__store.removal()),
    };
    // cancelling must put it back with the notice intact
    document.querySelector('[data-act="let-cancel"]').click();
    await new Promise((r) => setTimeout(r, 400));
    out.afterCancel = {
      notice: Boolean(window.__store.removal()),
      letGo: [...document.querySelectorAll('button')].some((b) => /^Let it go$/.test(b.textContent.trim())),
      asked: /This removes .* from this phone/.test(document.querySelector('#app').textContent.replace(/\s+/g, ' ')),
    };
    return out;
  });
  console.log('  let-go gate:', JSON.stringify(gate));
  check('B10 · one tap ASKS rather than deletes', gate.asked === true && gate.stillThere === true);
  check('B10 · and names the three things the card just called untouched',
        gate.namesTheThree === true);
  check('B10 · says there is no undo', gate.noUndo === true);
  check('B10 · with a way back out', gate.hasCancel === true);
  check('B10 · rust on tint, never a filled rust button',
        gate.bg === 'rgb(248, 233, 233)' && gate.fg === 'rgb(155, 75, 75)', `${gate.bg} ${gate.fg}`);
  check('B10 · cancelling leaves the notice and the button exactly as they were',
        gate.afterCancel.notice === true && gate.afterCancel.letGo === true
          && gate.afterCancel.asked === false, JSON.stringify(gate.afterCancel));

  // ---- and the second tap really takes the trip off the phone ----------
  const gone = await page.evaluate(async () => {
    const s = window.__store;
    const id = s.state.tripID;
    const before = (s.state.trips || []).length;
    document.querySelector('[data-act="let-go"]').click();
    await new Promise((r) => setTimeout(r, 400));
    document.querySelector('[data-act="let-final"]').click();
    await new Promise((r) => setTimeout(r, 900));
    return {
      before, after: (s.state.trips || []).length,
      stillListed: (s.state.trips || []).some((t) => t.id === id),
      noticeGone: !document.querySelector('#app').textContent.includes('No longer shared with you'),
    };
  });
  console.log('  gone:', JSON.stringify(gone));
  check('B10 · the second tap removes the trip from this phone',
        gone.stillListed === false && gone.after === gone.before - 1,
        `${gone.before} → ${gone.after}`);
  check('B10 · and the notice ends with it — a relaunch cannot ask again',
        gone.noticeGone === true);

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

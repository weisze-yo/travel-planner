// B3 — PROVENANCE STOPS BEING A QUESTION. WHERE YOU ADD IT IS THE ANSWER.
//
// The Add-a-stop form asked "The agent's route" or "My own plan" as two
// radios. The owner's own words: the pair is unanswerable — nobody adding a
// stop is thinking "is this the agent's route or mine?", they are thinking
// "12:30, the snow museum". The radios did not even render as checked (bug
// 5), so the form was asking an unanswerable question with a broken control.
//
// The rule replaces the question, not the display:
//
//   added on Plan   → main route
//   added in Nearby → sub route
//   arrived from a paste → keeps its own kind AND its own label
//
// That last one is why the derivation has three inputs rather than two, and
// it is checked here through `importItinerary` itself.
//
// Provenance is still SHOWN everywhere it was, and this file gates that too —
// including one thing the change exposed: `plan.js` hardcoded MAIN for every
// stop whatever its kind. Survivable while the form asked out loud; a false
// statement once the badge is the only answer on the screen.
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

  await go('plan');
  await page.evaluate(() => document.querySelector('[data-act="toggle-edit"]')?.click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-act="add-open"]')?.click());
  await page.waitForTimeout(450);

  const f = await page.evaluate(() => {
    const form = document.querySelector('.form');
    if (!form) return { missing: true };
    const btns = [...form.querySelectorAll('button')].map((b) => ({
      text: b.textContent.trim(), cls: b.className,
      w: Math.round(b.getBoundingClientRect().width),
    }));
    return {
      radios: form.querySelectorAll('input[type="radio"]').length,
      anyRadioAnywhere: document.querySelectorAll('input[type="radio"]').length,
      agentText: /agent.s route|My own plan/i.test(form.textContent),
      fields: [...form.querySelectorAll('input, select')].map((e) => e.id || e.type),
      hint: form.querySelector('.form-hint')?.textContent.trim().replace(/\s+/g, ' '),
      // §3.6 moved "leave the end blank" out of the hint and onto the field
      // it is about, because a third sentence of prose in a DOCKED form cost
      // the day a row. The fact has to still be stated — this reads the
      // whole form, so it passes wherever the fact lives.
      endOptional: /Ends\s*·\s*optional|Leave the end blank/i
        .test(form.textContent.replace(/\s+/g, ' ')),
      btns,
      cross: btns.some((b) => b.text === '✕' || b.text === '✕'),
    };
  });
  console.log('  form:', JSON.stringify(f));
  check('B3 · the two provenance radios are gone from the form', f.radios === 0, f.radios);
  check('B3 · and their labels with them', f.agentText === false);
  check('B3 · four fields, not six',
        f.fields.length === 4 && f.fields.includes('add-name') && f.fields.includes('add-place')
          && f.fields.includes('add-start') && f.fields.includes('add-end'),
        JSON.stringify(f.fields));
  check('B3 · the hint states the rule instead of asking it',
        /^Lands on the main route/.test(f.hint || ''), f.hint);
  check('B3 · and names the neighbours it lands between',
        /between .+ and .+\.|before .+\.|after .+\.|first stop/.test(f.hint || ''), f.hint);
  check('B3 · it still says what an empty end means, wherever that is said',
        f.endOptional === true, f.hint);
  check('B3 · the 38px ✕ is gone', f.cross === false, JSON.stringify(f.btns));
  const cancel = f.btns.find((b) => b.text === 'Cancel');
  check('B3 · replaced by the app’s standard 96px ghost Cancel',
        cancel && /btn ghost/.test(cancel.cls) && cancel.w === 96, JSON.stringify(cancel));
  const add = f.btns.find((b) => b.text === 'Add');
  check('B3 · Add is the jade primary beside it', add && /btn jade/.test(add.cls), JSON.stringify(add));

  // ---- the landing line really follows the typed time --------------------
  const line = await page.evaluate(async () => {
    const read = () => document.querySelector('.form-hint')?.textContent.trim().replace(/\s+/g, ' ');
    const set = async (v) => {
      const el = document.querySelector('#add-start');
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      // the hint is derived at render, so poke the screen the way a save does
      document.querySelector('[data-act="add-save"]').click();
      await new Promise((r) => setTimeout(r, 450));
      return read();
    };
    const stops = [];
    for (const d of (window.__store.state.days || [])) {
      if (d.dayNumber !== window.__store.state.selectedDay) continue;
      for (const it of (d.items || [])) stops.push([it.time, it.name]);
    }
    return { stops, early: await set('00:05'), late: await set('23:55') };
  });
  console.log('  stops:', JSON.stringify(line.stops));
  console.log('  early:', line.early);
  console.log('  late: ', line.late);
  check('B3 · a time before every stop says BEFORE the first one',
        /before /.test(line.early || '') && !/between/.test(line.early || ''), line.early);
  check('B3 · a time after every stop says AFTER the last one',
        /after /.test(line.late || '') && !/between/.test(line.late || ''), line.late);

  // ---- provenance is still SHOWN, just derived ---------------------------
  //
  // OUT of edit mode: in edit mode the badge slot is the rust ✕ that removes
  // the stop, so looking for MAIN while editing finds nothing and says
  // nothing about whether provenance is still displayed.
  const badges = await page.evaluate(async () => {
    document.querySelector('[data-act="add-cancel"]')?.click();
    await new Promise((r) => setTimeout(r, 350));
    if (document.querySelector('[data-act="remove"]')) {
      document.querySelector('[data-act="toggle-edit"]').click();
      await new Promise((r) => setTimeout(r, 400));
    }
    const s = window.__store;
    const withStops = (s.state.days || []).find((d) => (d.items || []).filter((i) => !i.archived).length);
    if (withStops) { s.selectDay(withStops.dayNumber); await new Promise((r) => setTimeout(r, 450)); }
    const txt = document.querySelector('#app').textContent;
    return {
      day: withStops?.dayNumber,
      main: /MAIN/.test(txt),
      added: /Added by you|Added from a pasted itinerary|Added from a map link/.test(txt),
      editing: Boolean(document.querySelector('[data-act="remove"]')),
    };
  });
  console.log('  badges:', JSON.stringify(badges));
  check('B3 · out of edit mode, the MAIN badge still shows provenance',
        badges.main === true, JSON.stringify(badges));

  // ---- the paste importer is the third input, and keeps its own ----------
  const paste = await page.evaluate(async () => {
    const s = window.__store;
    // `include` is the confirmation flag — importItinerary lands only rows
    // the review screen ticked, which is the whole point of that screen.
    const res = await s.importItinerary([
      { include: true, dayNumber: 2, time: '10:00', name: 'Pasted Museum', endTime: '11:00' },
      { include: true, dayNumber: 2, time: '12:00', name: 'Pasted Loop Stop', kind: 'sub' },
    ]);
    const items = s.state.days.find((d) => d.dayNumber === 2)?.items || [];
    const made = items.filter((i) => /^Pasted /.test(i.name));
    return { res, made: made.map((i) => ({ name: i.name, kind: i.kind })),
             notes: made.map((i) => s.place(i.placeID)?.note) };
  });
  console.log('  paste:', JSON.stringify(paste));
  check('B3 · a pasted row keeps its OWN kind — the third input, not derived',
        paste.made.some((m) => m.kind === 'main') && paste.made.some((m) => m.kind === 'sub'),
        JSON.stringify(paste.made));
  check('B3 · and its own label, which neither Plan nor Nearby would give it',
        paste.notes.length === 2 && paste.notes.every((n) => n === 'Added from a pasted itinerary'),
        JSON.stringify(paste.notes));

  // ...and that label REACHES the screen, on the day the pasted rows landed.
  const shown = await page.evaluate(async () => {
    window.__store.selectDay(2);
    await new Promise((r) => setTimeout(r, 500));
    const txt = document.querySelector('#app').textContent.replace(/\s+/g, ' ');
    return { added: /Added from a pasted itinerary/.test(txt), main: /MAIN/.test(txt), sub: /SUB/.test(txt) };
  });
  console.log('  shown:', JSON.stringify(shown));
  check('B3 · the "Added from a pasted itinerary" line is on the day itself',
        shown.added === true, JSON.stringify(shown));
  check('B3 · with both badges — provenance derived, still displayed',
        shown.main === true && shown.sub === true, JSON.stringify(shown));

  // ---- B3-B · the empty day, zero buttons -------------------------------
  //
  // Also out of edit mode. "+ Add a stop" and "Paste an itinerary" are edit
  // mode's OWN controls and belong there — B3-B's point is that the resting
  // empty day must not duplicate them, which is what made the reported
  // screen show four buttons at once.
  const empty = await page.evaluate(async () => {
    const s = window.__store;
    if (document.querySelector('[data-act="remove"]')) {
      document.querySelector('[data-act="toggle-edit"]').click();
      await new Promise((r) => setTimeout(r, 400));
    }
    const day = (s.state.days || []).find((d) => !(d.items || []).filter((i) => !i.archived).length);
    if (!day) return { noEmptyDay: true, days: (s.state.days || []).map((d) => (d.items || []).length) };
    s.selectDay(day.dayNumber);
    await new Promise((r) => setTimeout(r, 550));
    const scroll = document.querySelector('.scroll');
    return {
      day: day.dayNumber,
      editing: Boolean(document.querySelector('[data-act="remove"]')),
      buttons: [...scroll.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean),
      text: (scroll.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  console.log('  empty day:', JSON.stringify(empty).slice(0, 500));
  if (empty.noEmptyDay) {
    check('B3-B · an empty day exists to check', false, JSON.stringify(empty.days));
  } else {
    check('B3-B · it is the RESTING empty day, not edit mode', empty.editing === false);
    check('B3-B · "Add the first stop" is gone',
          !empty.buttons.some((b) => /Add the first stop/i.test(b)), JSON.stringify(empty.buttons));
    check('B3-B · "Paste an itinerary" is gone from the resting empty day',
          !empty.buttons.some((b) => /Paste an itinerary/i.test(b)), JSON.stringify(empty.buttons));
    check('B3-B · the empty state points at the pencil instead',
          /pencil/i.test(empty.text), empty.text.slice(0, 200));
  }

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

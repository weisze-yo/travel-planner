// §3.2 — THE OUTFIT PROSE THAT NOTHING RENDERED.
//
// Every one of the eight outfit records has carried `x.suggestionPhoto` and
// `x.suggestionPractical` since Trip 12 landed — 272 to 679 characters each,
// researched against the day's actual backdrop and its actual walking — and
// NOTHING read either. Prep's WHAT TO WEAR card showed a sentence derived
// from the forecast instead, and on a day with no forecast it showed "No
// forecast for this day yet": the emptiest possible answer on a card with
// two paragraphs of real advice sitting behind it. The same shape of miss as
// `stopSummary` before the Must tab.
//
// Three states, all three checked, because the absent case is the one a
// design like this normally gets wrong:
//
//   both blocks     two labelled paragraphs, both open, a hairline between
//   one block       the missing one is ABSENT — no label with nothing under
//                   it, and the divider goes with it
//   neither         the app's own .empty sentence inside the card, plus the
//                   ghost action F1 makes possible
//
// F1 (the owner answered YES: these records are writable) is exercised by
// really typing into the sheet, saving, and reading the record back —
// including that a whitespace-only box CLEARS its block rather than storing
// a blank one, and that Cancel throws the edit away.
//
// The prose is staged onto the demo trip at real lengths rather than being
// read out of Trip 12, so the test does not depend on which trip is loaded.
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

  // Stage real researched prose on the demo trip's day 1, the way the
  // importer puts it there — both blocks, at the real lengths.
  const PHOTO = 'The Matsushima palette is blue-grey sea, near-black pine islets and VERMILION bridges. '
    + 'That makes two colours risky: dark green disappears into the pines, and orange or red fights '
    + 'the vermilion of the Fukuura and Godaido bridges, which is the one colour every photo here is '
    + 'built around. Mid-tone blue, navy or a soft neutral reads cleanly against both sea and pine.';
  const PRACTICAL = 'Matsushima is 29 degrees and coastal, so a sea breeze makes it feel kinder than '
    + 'inland — until 16:00, when the open 2F cruise deck is genuinely windy and carries spray. The '
    + 'three afternoon stops are 450 m, 500 m and 280 m apart on flat paving, so this is an easy day.';

  const stage = async (x) => page.evaluate((patch) => {
    const s = window.__store;
    const rec = s.state.outfits.find((o) => o.dayNumber === s.state.selectedDay);
    if (rec) rec.x = patch;
    else s.state.outfits.push({ id: `day-${s.state.selectedDay}`, dayNumber: s.state.selectedDay, pieces: [], x: patch });
    s.touch();
  }, x);

  // ============================================ A · both paragraphs present
  await go('prep');
  await stage({ suggestionPhoto: PHOTO, suggestionPractical: PRACTICAL });
  await page.waitForTimeout(500);
  const both = await page.evaluate(() => {
    const card = document.querySelector('.card.pad');
    const blocks = [...card.querySelectorAll('.outfit-block')];
    const cs = blocks[0] && getComputedStyle(blocks[0].querySelector('.outfit-prose'));
    return {
      n: blocks.length,
      labels: blocks.map((b) => b.querySelector('.eyebrow')?.textContent.trim()),
      lens: blocks.map((b) => b.querySelector('.outfit-prose')?.textContent.trim().length),
      type: cs && `${cs.fontSize}/${cs.lineHeight}`,
      colour: cs && cs.color,
      hairlinesInside: card.querySelectorAll('.hairline').length,
      generic: /light layer|mid layer|No forecast for this day yet|rain is unlikely/.test(card.textContent),
      refTag: Boolean(card.querySelector('.outfit-ref')),
      subject: card.querySelector('.eyebrow')?.parentElement?.querySelector('.f115.muted')?.textContent.trim(),
      ghost: card.querySelector('[data-act="outfit-write"]')?.textContent.trim(),
      bringing: (() => {
        const head = [...card.querySelectorAll('.eyebrow')]
          .find((e) => /WHAT I AM ACTUALLY BRINGING/.test(e.textContent));
        return head?.nextElementSibling?.textContent.trim();
      })(),
      cardTop: Math.round(card.getBoundingClientRect().top),
      cardBottom: Math.round(card.getBoundingClientRect().bottom),
    };
  });
  console.log('  both:', JSON.stringify(both));
  check('§3.2 · two blocks, both open, neither collapsed', both.n === 2, both.n);
  check('§3.2 · labelled AGAINST THE BACKDROP and HOW THE DAY WILL FEEL',
        both.labels[0] === 'AGAINST THE BACKDROP' && both.labels[1] === 'HOW THE DAY WILL FEEL',
        JSON.stringify(both.labels));
  check('§3.2 · both paragraphs render in full — no truncation',
        both.lens[0] > 300 && both.lens[1] > 250, JSON.stringify(both.lens));
  check('§3.2 · at the app’s own reading size for prose, 12.5px / 1.55',
        both.type === '12.5px/19.375px', both.type);
  check('§3.2 · in --charcoal, the colour .must-text already uses',
        both.colour === 'rgb(61, 76, 70)', both.colour);
  check('§3.2 · one hairline between them, one before the packing half',
        both.hairlinesInside === 2, both.hairlinesInside);
  check('§3.2 · the generic weather sentence is gone', both.generic === false);
  check('§3.2 · and its "reference" tag with it', both.refTag === false);
  check('§3.2 · the card names the day’s own subject', Boolean(both.subject), both.subject);
  check('§3.2 · a written card carries a ghost "Edit these notes"',
        both.ghost === 'Edit these notes', both.ghost);
  check('§3.2 · the packing head states the relationship in one line',
        /against the (two paragraphs|note|day) above|kept separate from the advice/.test(both.bringing || ''),
        both.bringing);

  // ============================================ B · one present, one missing
  await stage({ suggestionPractical: PRACTICAL });
  await page.waitForTimeout(450);
  const one = await page.evaluate(() => {
    const card = document.querySelector('.card.pad');
    const blocks = [...card.querySelectorAll('.outfit-block')];
    return {
      n: blocks.length,
      label: blocks[0]?.querySelector('.eyebrow')?.textContent.trim(),
      emptyLabelPresent: /AGAINST THE BACKDROP/.test(card.textContent),
      hairlines: card.querySelectorAll('.hairline').length,
    };
  });
  console.log('  one:', JSON.stringify(one));
  check('§3.2-B · a missing block is simply ABSENT', one.n === 1, one.n);
  check('§3.2-B · no label with nothing under it', one.emptyLabelPresent === false);
  check('§3.2-B · and the divider between the two goes with it', one.hairlines === 1, one.hairlines);

  // ============================================ C · neither, and the ghost
  await stage({});
  await page.waitForTimeout(450);
  const none = await page.evaluate(() => {
    const card = document.querySelector('.card.pad');
    return {
      blocks: card.querySelectorAll('.outfit-block').length,
      empty: card.querySelector('.empty')?.textContent.trim(),
      ghost: card.querySelector('[data-act="outfit-write"]')?.textContent.trim(),
      noForecastSentence: /No forecast for this day yet/.test(card.textContent),
    };
  });
  console.log('  none:', JSON.stringify(none));
  check('§3.2-B · neither paragraph leaves no blocks', none.blocks === 0, none.blocks);
  check('§3.2-B · the app’s own .empty sentence, inside the card',
        /Nothing written about this day’s clothing yet\./.test(none.empty || ''), none.empty);
  check('§3.2-B · with the ghost action F1 makes possible',
        none.ghost === 'Write what to wear', none.ghost);
  check('§3.2-B · and NOT the old "No forecast for this day yet"',
        none.noForecastSentence === false);

  // ============================================ F1 · writing your own
  const sheet = await page.evaluate(async () => {
    document.querySelector('[data-act="outfit-write"]').click();
    await new Promise((r) => setTimeout(r, 450));
    const modal = document.querySelector('.modal .form');
    if (!modal) return { missing: true };
    return {
      scrim: Boolean(document.querySelector('.scrim')),
      title: modal.querySelector('.form-title')?.textContent.trim(),
      areas: [...modal.querySelectorAll('textarea')].map((t) => t.id),
      labels: [...modal.querySelectorAll('.eyebrow')].map((e) => e.textContent.trim()),
      save: modal.querySelector('[data-act="outfit-save"]')?.className,
      cancel: modal.querySelector('[data-act="outfit-cancel"]')?.getBoundingClientRect().width,
      hint: modal.querySelector('.form-hint')?.textContent.trim(),
    };
  });
  console.log('  sheet:', JSON.stringify(sheet));
  check('F1 · the app’s one sheet pattern — scrim plus a bottom modal form',
        sheet.scrim === true && Boolean(sheet.title), JSON.stringify(sheet).slice(0, 120));
  check('F1 · two textareas, because the content is two KINDS',
        sheet.areas.length === 2, JSON.stringify(sheet.areas));
  check('F1 · labelled with the same words the card shows',
        sheet.labels[0] === 'AGAINST THE BACKDROP' && sheet.labels[1] === 'HOW THE DAY WILL FEEL',
        JSON.stringify(sheet.labels));
  check('F1 · jade Save and a 96px ghost Cancel',
        /btn jade/.test(sheet.save || '') && Math.round(sheet.cancel) === 96,
        `${sheet.save} / ${sheet.cancel}`);
  check('F1 · and the empty-box rule is said, not discovered',
        /Leave a box empty and that half is not kept/.test(sheet.hint || ''), sheet.hint);

  // ---- writing, then clearing, both really work -------------------------
  const wrote = await page.evaluate(async () => {
    document.querySelector('#outfit-suggestionPhoto').value = 'Mine: pale blue, nothing printed.';
    document.querySelector('#outfit-suggestionPractical').value = '  ';
    document.querySelector('[data-act="outfit-save"]').click();
    await new Promise((r) => setTimeout(r, 550));
    const s = window.__store;
    const x = s.outfitFor()?.x || {};
    const card = document.querySelector('.card.pad');
    return {
      saved: x.suggestionPhoto, cleared: !('suggestionPractical' in x),
      blocks: card.querySelectorAll('.outfit-block').length,
      onScreen: /pale blue, nothing printed/.test(card.textContent),
      marked: /yours|Added by you|YOURS/i.test(card.textContent),
      sheetGone: !document.querySelector('#outfit-suggestionPhoto'),
    };
  });
  console.log('  wrote:', JSON.stringify(wrote));
  check('F1 · what you write is saved', wrote.saved === 'Mine: pale blue, nothing printed.', wrote.saved);
  check('F1 · a whitespace-only box is NOT kept — the factsEditor rule',
        wrote.cleared === true);
  check('F1 · so one block is left on the card', wrote.blocks === 1, wrote.blocks);
  check('F1 · and it appears where you read it', wrote.onScreen === true);
  check('F1 · an edited paragraph is NOT marked as yours', wrote.marked === false);
  check('F1 · the sheet closes on save', wrote.sheetGone === true);

  // ---- Cancel means cancel ---------------------------------------------
  const cancelled = await page.evaluate(async () => {
    document.querySelector('[data-act="outfit-write"]').click();
    await new Promise((r) => setTimeout(r, 400));
    document.querySelector('#outfit-suggestionPhoto').value = 'THROWN AWAY';
    document.querySelector('[data-act="outfit-cancel"]').click();
    await new Promise((r) => setTimeout(r, 450));
    return {
      x: window.__store.outfitFor()?.x?.suggestionPhoto,
      onScreen: /THROWN AWAY/.test(document.querySelector('#app').textContent),
    };
  });
  console.log('  cancelled:', JSON.stringify(cancelled));
  check('F1 · Cancel throws the edit away',
        cancelled.x === 'Mine: pale blue, nothing printed.' && cancelled.onScreen === false,
        JSON.stringify(cancelled));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

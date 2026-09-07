// B1, B6, B9 — the New-trip modal, Trip settings, and the share screen.
//
//   B1  the modal asks ONE question, so it keeps Create and Cancel only.
//       The skip moves to the screen that actually asks for the itinerary,
//       where declining is a real choice rather than a second Create.
//   B6  two buttons that looked alike get names that cannot be confused —
//       a QUEUE with a count, and an EXPORT — and emptying a trip takes a
//       typed word rather than a second tap.
//   B9  the app stops composing a sentence on the traveller's behalf. The
//       link is copied, or handed to the phone's own share sheet.
//
// Two things here are provoked rather than read cold, and both would pass
// for the wrong reason otherwise: the currency line is DERIVED from the city
// field and says nothing until that field commits, and the share screen's
// link block does not exist until a link does.
//
// The empty-trip gate is also attacked, not just observed: a near-miss word,
// then the right word, then a stale wrong word with `disabled` forcibly
// cleared and the button clicked. A trip must survive the last one.
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

  // ================================================ B1 · the New-trip modal
  await go('trips');
  const modal = await page.evaluate(async () => {
    document.querySelector('[data-act="add-toggle"]')?.click();
    await new Promise((r) => setTimeout(r, 450));
    const form = document.querySelector('.modal .form');
    if (!form) return { missing: true };
    return {
      buttons: [...form.querySelectorAll('button')].map((b) => b.textContent.trim()),
      fields: [...form.querySelectorAll('input, select, textarea')].map((e) => e.id || e.type),
      hint: form.querySelector('.form-hint')?.textContent.trim().replace(/\s+/g, ' '),
      later: /do this later/i.test(form.textContent),
      currencyIsAField: [...form.querySelectorAll('input')].some((i) => /currenc|price/i.test(i.placeholder || '')),
    };
  });
  // The currency line is DERIVED from the city field and only says anything
  // once that field commits, so it has to be provoked rather than read cold.
  const money = await page.evaluate(async () => {
    const el = document.querySelector('#new-trip-place');
    el.value = 'Osaka';
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1200));
    const form = document.querySelector('.modal .form');
    return {
      fields: [...form.querySelectorAll('input, select, textarea')].length,
      line: [...form.querySelectorAll('div')].map((d) => d.textContent.trim())
        .filter((t) => t && t.length < 140 && !/^New trip$/.test(t)).pop(),
      texts: [...form.querySelectorAll('div')].map((d) => d.textContent.trim())
        .filter((t) => t && t.length < 140),
    };
  });
  console.log('  money:', JSON.stringify(money));
  console.log('  modal:', JSON.stringify(modal));
  check('B1 · Create and Cancel are the only ways out of the modal',
        modal.buttons.length === 2 && modal.buttons.includes('Create') && modal.buttons.includes('Cancel'),
        JSON.stringify(modal.buttons));
  check('B1 · "I\'ll do this later" is not on the create card', modal.later === false);
  check('B1 · the currency is a sentence, not a fourth field',
        modal.currencyIsAField === false && money.fields === 4,
        `${modal.currencyIsAField} / ${money.fields} fields`);
  check('B1 · and the sentence really appears once the city commits',
        money.texts.some((t) => /Prices in|currenc|MYR|JPY|¥|RM/i.test(t)),
        JSON.stringify(money.texts).slice(0, 260));
  check('B1 · the hint names what actually follows',
        /^Next comes pasting the itinerary in\./.test(modal.hint || ''), modal.hint);

  // ---- B1-B · and the skip is at the foot of the screen that asks --------
  await page.evaluate(() => document.querySelector('[data-act="add-cancel"]')?.click());
  await go('paste');
  const skip = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /do this later/i.test(b.textContent));
    if (!btn) return { missing: true };
    const prev = btn.previousElementSibling;
    const next = btn.nextElementSibling;
    const primary = [...document.querySelectorAll('button')].find((b) => /^Read it$/.test(b.textContent.trim()));
    return {
      cls: btn.className,
      belowHairline: Boolean(prev && prev.classList.contains('hairline')),
      underPrimary: Boolean(primary) && primary.getBoundingClientRect().top < btn.getBoundingClientRect().top,
      says: next?.textContent.trim().replace(/\s+/g, ' '),
    };
  });
  console.log('  skip:', JSON.stringify(skip));
  check('B1-B · the skip is a ghost', /btn ghost/.test(skip.cls || ''), skip.cls);
  check('B1-B · below a hairline', skip.belowHairline === true);
  check('B1-B · under the primary path', skip.underPrimary === true);
  check('B1-B · and says what skipping leaves you with, and the way back',
        /opens empty/.test(skip.says || '') && /Trip settings/.test(skip.says || ''), skip.says);

  // ================================================ B6 · the two relabels
  await go('trip');
  const settings = await page.evaluate(() => {
    const txt = document.querySelector('#app').textContent.replace(/\s+/g, ' ');
    const btns = [...document.querySelectorAll('button')].map((b) => b.textContent.trim().replace(/\s+/g, ' '));
    return {
      queue: btns.find((b) => /Waiting to reach the cloud/.test(b)),
      exportBtn: btns.find((b) => /Export the whole trip/.test(b)),
      oldQueue: /Changes on this phone/.test(txt),
      oldExport: /Save this trip as a file/.test(txt),
      emptyBtn: btns.find((b) => /Empty this trip/.test(b)),
    };
  });
  console.log('  settings:', JSON.stringify(settings));
  check('B6 · the sync queue is "Waiting to reach the cloud"', Boolean(settings.queue), settings.queue);
  check('B6 · the export is "Export the whole trip as a file…"', Boolean(settings.exportBtn), settings.exportBtn);
  check('B6 · neither old label survives',
        settings.oldQueue === false && settings.oldExport === false,
        `${settings.oldQueue} / ${settings.oldExport}`);

  // ---- B6 · the typed second gate ---------------------------------------
  const gate = await page.evaluate(async () => {
    const click = async (sel) => { document.querySelector(sel)?.click(); await new Promise((r) => setTimeout(r, 400)); };
    await click('[data-act="clear"]');
    const first = [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean);
    await click('[data-act="clear-confirm"]');
    const input = document.querySelector('#empty-word');
    const btn = document.querySelector('[data-act="clear-final"]');
    const cs = btn && getComputedStyle(btn);
    const out = {
      first: first.some((b) => /Yes, empty the trip/.test(b)),
      hasInput: Boolean(input),
      inertAtFirst: Boolean(btn?.disabled),
      copy: (document.querySelector('#empty-word')?.closest('.card')
        || document.querySelector('#empty-word')?.parentElement)?.textContent.replace(/\s+/g, ' ') || '',
      bg: cs?.backgroundColor, fg: cs?.color,
    };
    // a wrong word must not open it
    input.value = 'empt';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 420));
    out.inertOnWrongWord = Boolean(document.querySelector('[data-act="clear-final"]')?.disabled);
    // the right word, lower case, must
    const el2 = document.querySelector('#empty-word');
    el2.value = 'empty';
    el2.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 420));
    out.liveOnRightWord = document.querySelector('[data-act="clear-final"]')?.disabled === false;
    // and a synthetic click on a stale wrong word must not destroy anything
    const el3 = document.querySelector('#empty-word');
    el3.value = 'no';
    el3.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 420));
    const stopsBefore = (window.__store.state.days || []).reduce((n, d) => n + (d.items || []).length, 0);
    const stale = document.querySelector('[data-act="clear-final"]');
    if (stale) { stale.disabled = false; stale.click(); }
    await new Promise((r) => setTimeout(r, 450));
    out.survivedForcedClick =
      (window.__store.state.days || []).reduce((n, d) => n + (d.items || []).length, 0) === stopsBefore;
    document.querySelector('[data-act="clear-cancel"]')?.click();
    return out;
  });
  console.log('  gate:', JSON.stringify({ ...gate, copy: gate.copy.slice(-300) }));
  check('B6 · the first gate still names what goes', gate.first === true);
  check('B6 · the second gate is a typed word', gate.hasInput === true);
  check('B6 · inert before anything is typed', gate.inertAtFirst === true);
  check('B6 · still inert on a near-miss', gate.inertOnWrongWord === true);
  check('B6 · live on EMPTY, case-insensitively', gate.liveOnRightWord === true);
  check('B6 · a forced click on a stale wrong word destroys nothing',
        gate.survivedForcedClick === true);
  check('B6 · rust on tint, never a filled rust button',
        gate.bg === 'rgb(248, 233, 233)' && gate.fg === 'rgb(155, 75, 75)', `${gate.bg} ${gate.fg}`);
  check('B6 · it says there is no undo, and to export first',
        /no undo for this one/.test(gate.copy) && /Export the trip first/.test(gate.copy), gate.copy.slice(-200));
  check('B6 · and names the counts it is about to remove',
        /removes \d+ stop/.test(gate.copy) && /note/.test(gate.copy), gate.copy.slice(-260));

  // ================================================ B9 · the share screen
  //
  // The link block only renders once a link EXISTS, so one is made first —
  // reading the screen cold finds neither button and proves nothing.
  await go('share');
  const made = await page.evaluate(async () => {
    if (!store_hasLink()) {
      const btn = [...document.querySelectorAll('button')]
        .find((b) => /make .*link|create .*link|share this trip/i.test(b.textContent));
      if (btn) { btn.click(); await new Promise((r) => setTimeout(r, 900)); }
    }
    function store_hasLink() { return Boolean(window.__store.state.trip?.link); }
    return { link: window.__store.state.trip?.link?.code || null,
             buttons: [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).slice(0, 12) };
  });
  console.log('  made:', JSON.stringify(made));
  const share = await page.evaluate(() => {
    const txt = document.querySelector('#app').textContent.replace(/\s+/g, ' ');
    const btns = [...document.querySelectorAll('button')].map((b) => b.textContent.trim());
    return {
      copyLink: btns.find((b) => /^Copy the link$/.test(b)),
      shareSheet: btns.find((b) => /^Share…$/.test(b)),
      oldSend: btns.some((b) => /^Send it$/.test(b)),
      oldMessage: /Copy the message|is sharing a trip with you/.test(txt),
    };
  });
  console.log('  share:', JSON.stringify(share));
  check('B9 · "Copy the link" is the primary', Boolean(share.copyLink), share.copyLink);
  check('B9 · and the phone’s own share sheet is beside it', Boolean(share.shareSheet), share.shareSheet);
  check('B9 · "Send it" and the composed sentence are gone',
        share.oldSend === false && share.oldMessage === false,
        `${share.oldSend} / ${share.oldMessage}`);
  const src = await page.evaluate(async () => (await fetch('./js/screens/share.js')).text());
  check('B9 · navigator.share carries the URL and no app-written text',
        /navigator\.share\(\{\s*title:[^}]*url\s*\}\)/.test(src) && !/is sharing a trip with you: \$/.test(src));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

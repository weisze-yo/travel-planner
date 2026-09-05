// Batch 2 — currency identity (P0-2) and the OD-9 ghost.
//
// The transition audit §7's row for this batch asks for three things: a trip
// with no currency renders bare tabular numbers EVERYWHERE; a probe that
// fails if any `|| '¥'` or `= '¥'` reappears; and the ghost lands on the trip
// just created with Paste still the default path.
//
// The ninth site matters most. The map counted eight; util.js's
// `money(amount, symbol = '¥')` is a ninth that NOTHING exercises today, so
// removing the seven fallbacks without it would have left a default that
// silently reintroduces the yen the first time a caller omits the argument.
// The source probe below covers it whether or not a caller ever hits it.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 240)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block',
});
await ctx.addInitScript(() => {
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
let slowNet = 0;
let geoAnswer = null;
await page.route(/nominatim\.openstreetmap\.org/, async (r) => {
  if (slowNet) await new Promise((d) => setTimeout(d, slowNet));
  if (geoAnswer === null) return r.abort();
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(geoAnswer) });
});
await page.route(/api\.open-meteo\.com|frankfurter|ecb\.europa\.eu/, (r) => r.abort());

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
  window.__util = await import('./js/util.js');
});
const go = async (id, p) => {
  await page.evaluate(([i, q]) => window.__nav.go(i, q || {}), [id, p]);
  await page.waitForTimeout(450);
};
const until = async (fn, ms = 5000) => {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(60); }
  return false;
};

// ================= the nine sites, in the source that actually ships
{
  const files = ['js/util.js', 'js/store.js', 'js/screens/dest.js', 'js/screens/trips.js',
    'js/screens/shop.js', 'js/screens/spend.js', 'js/screens/parts.js'];
  let fallbacks = 0, defaults = 0;
  const where = [];
  for (const f of files) {
    const src = await (await fetch(`${APP}/${f}`)).text();
    // Strip comments so this document's own prose about the old code does not
    // count as the old code.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const fb = (code.match(/\|\|\s*'¥'/g) || []).length;
    const df = (code.match(/=\s*'¥'/g) || []).length;
    fallbacks += fb; defaults += df;
    if (fb || df) where.push(`${f}: ${fb} fallback, ${df} default`);
  }
  check('the seven `|| \'¥\'` fallbacks are gone', fallbacks === 0, where.join(' · '));
  check('BOTH default parameters are gone — including util.js money(), the ninth site the map never named',
    defaults === 0, where.join(' · '));
  const util = await (await fetch(`${APP}/js/util.js`)).text();
  check('money()\'s default is empty, so a caller that omits the symbol prices nothing in yen',
    /export function money\(amount, symbol = ''\)/.test(util));
  // And prove the default behaves, not just that it reads right.
  const bare = await page.evaluate(() => window.__util.money(1234));
  check('money(1234) with no symbol renders a bare number', bare === '1,234', bare);
  const withSym = await page.evaluate(() => window.__util.money(1234, '¥'));
  check('money(1234, "¥") still renders the symbol', withSym === '¥1,234', withSym);
}

// ============ a trip with NO currency renders bare numbers everywhere
{
  await page.evaluate(async () => {
    // Strip the currency in place, which is exactly the state §7.3 says a
    // real trip lands in: no migration, no recompute, the rule simply applies
    // the first time the trip is opened. My trips renders EVERY trip, so
    // every trip is stripped — otherwise a sibling that legitimately has a
    // currency would be read as a failure of the trip under test.
    const ids = window.__store.state.trips.map((t) => t.id);
    const first = window.__store.state.tripID;
    for (const id of ids) {
      await window.__store.switchTrip(id);
      await window.__store.updateTrip({ currencySymbol: '', currencyCode: '', homeCurrencyRate: null });
    }
    await window.__store.switchTrip(first);
  });
  await page.waitForTimeout(400);
  const gone = await page.evaluate(() => ({
    active: !window.__store.state.trip.currencySymbol,
    all: window.__store.state.trips.map((t) => `${t.name}=${t.currencySymbol || '(none)'}`),
  }));
  check('the trip under test really has no currency', gone.active, gone.all.join(' | '));
  check('and neither does any other trip My trips will render',
    gone.all.every((t) => t.endsWith('(none)')), gone.all.join(' | '));

  for (const [screen, label] of [['shop', 'Shop'], ['spend', 'Spend'], ['trips', 'My trips']]) {
    await go(screen);
    const yen = await page.evaluate(() => {
      // priceTier is a cheapness label ("¥", "¥¥"), not a currency, and is
      // not what this rule is about — exclude the nearby/plan tier chips.
      const bad = [];
      document.querySelectorAll('.spend-v, .spend-big, .item-est, .chip, .hero-chip, .spend-rm, .trip-foot').forEach((el) => {
        if (el.classList.contains('price-tier')) return;
        const t = el.textContent || '';
        if (/¥\s*[\d,]/.test(t)) bad.push(t.trim().slice(0, 40));
      });
      return bad;
    });
    check(`${label}: no money value carries a ¥ it was never priced in`, yen.length === 0, yen.join(' | '));
  }

  await go('shop');
  const shopLine = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')]
      .find((d) => d.textContent.trim() === 'Prices have no currency yet. Set it in Trip settings.');
    return el ? { text: el.textContent.trim(), colour: getComputedStyle(el).color } : null;
  });
  check('Shop\'s footer card explains the bare number, in the canonical sentence', !!shopLine, shopLine?.text);
  check('Shop\'s line is amber', shopLine?.colour === 'rgb(138, 90, 8)', shopLine?.colour);
  const noRm = await page.evaluate(() => !document.querySelector('.spend-rm'));
  check('§7.2: with no rate there is no ≈ conversion row on Shop (removed, not zeroed)', noRm);

  await go('spend');
  const spendLine = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')]
      .find((d) => d.textContent.trim() === 'Prices have no currency yet. Set it in Trip settings.');
    if (!el) return null;
    const hero = document.querySelector('.spend-hero');
    return {
      text: el.textContent.trim(), colour: getComputedStyle(el).color,
      underHero: hero ? el.getBoundingClientRect().top >= hero.getBoundingClientRect().bottom - 1 : false,
      insideHero: hero ? hero.contains(el) : false,
    };
  });
  check('Spend carries the same sentence', !!spendLine, spendLine?.text);
  check('Spend\'s line sits UNDER the ink hero, not inside it', spendLine?.underHero && !spendLine?.insideHero,
    `under=${spendLine?.underHero} inside=${spendLine?.insideHero}`);
  check('Spend\'s line is amber on the page ground, so it is readable',
    spendLine?.colour === 'rgb(138, 90, 8)', spendLine?.colour);
  const noConv = await page.evaluate(() => !document.body.textContent.includes('at 1'));
  check('§7.2: Spend no longer converts at parity and prints the same figure twice', noConv);

  // My trips: the money chip is OMITTED, not zeroed and not yen-labelled.
  await go('trips');
  const chips = await page.evaluate(() => [...document.querySelectorAll('.chip')].map((c) => c.textContent.trim()));
  check('My trips: no "planned" or "spent" money chip when the currency is unset',
    !chips.some((c) => /planned|spent/.test(c)), chips.join(' | '));
  check('My trips: and it is omitted, not shown as 0', !chips.some((c) => /^0\b|\b0 (planned|spent)/.test(c)), chips.join(' | '));

  // The item editor's price label drops its parenthetical (RC-19).
  await go('shop');
  const opened = await page.evaluate(() => {
    const b = document.querySelector('[data-edit-item]'); if (!b) return false; b.click(); return true;
  });
  await page.waitForTimeout(400);
  const lbl = await page.evaluate(() => [...document.querySelectorAll('label')]
    .map((l) => l.textContent.trim()).find((t) => t.startsWith('What you expect to pay')));
  check('itemEditor: the price label drops its parenthetical rather than showing "()"',
    opened && lbl === 'What you expect to pay', lbl);
  await page.evaluate(() => document.querySelector('[data-act="item-cancel"]')?.click());
  await page.waitForTimeout(250);

  // Put it back so nothing after this runs against a stripped trip.
  await page.evaluate(async () => {
    await window.__store.updateTrip({ currencySymbol: '¥', currencyCode: 'JPY' });
  });
  await page.waitForTimeout(300);
}

// ================== the derived line's six states, on the real modal
{
  await go('trips');
  const openModal = async () => {
    await page.evaluate(() => {
      if (!document.querySelector('.modal')) document.querySelector('[data-act="add-toggle"]').click();
    });
    await page.waitForTimeout(300);
  };
  const lineNow = () => page.evaluate(() => {
    const input = document.querySelector('#new-trip-place');
    if (!input) return null;
    const el = input.nextElementSibling;
    return el ? { text: el.textContent.trim(), colour: getComputedStyle(el).color } : null;
  });
  const commit = async (value) => {
    await page.evaluate((v) => {
      const i = document.querySelector('#new-trip-place');
      i.value = v;
      i.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  };

  await openModal();
  const idle = await lineNow();
  check('state 0 · idle keeps the existing hint, in soft', idle?.text === 'Used to centre the map and to look up places you add'
    && idle?.colour === 'rgb(152, 165, 160)', `${idle?.text} / ${idle?.colour}`);

  // state 1 · pending
  geoAnswer = [{ lat: '35.01', lon: '135.76', display_name: 'Kyoto, Kyoto Prefecture, Japan',
    address: { city: 'Kyoto', country: 'Japan', country_code: 'jp' } }];
  slowNet = 2000;
  await commit('Kyoto');
  const sawLooking = await until(() => {
    const i = document.querySelector('#new-trip-place');
    return i?.nextElementSibling?.textContent.trim() === 'Looking up Kyoto…';
  }, 3000);
  check('state 1 · the lookup announces itself while in flight', sawLooking);
  const pendingColour = await lineNow();
  check('state 1 · in amber', pendingColour?.colour === 'rgb(138, 90, 8)', pendingColour?.colour);
  // Create is never gated (§2.3) — check it in the pending state, the one
  // most likely to have been made to wait.
  const gated = await page.evaluate(() => document.querySelector('[data-act="add-save"]').disabled);
  check('§2.3 · Create is NOT gated on the currency, even mid-lookup', gated === false, `disabled=${gated}`);

  // state 2 · resolved
  slowNet = 0;
  const resolved = await until(() => {
    const i = document.querySelector('#new-trip-place');
    return /^Prices in/.test(i?.nextElementSibling?.textContent.trim() || '');
  }, 6000);
  const r2 = await lineNow();
  check('state 2 · resolved names symbol, ISO code AND the place', resolved
    && r2.text === 'Prices in ¥ JPY — from Kyoto, Japan', r2?.text);
  check('state 2 · amber, because it is a GUESS rather than a settled fact',
    r2?.colour === 'rgb(138, 90, 8)', r2?.colour);

  // state 3 · located, no currency known
  geoAnswer = [{ lat: '12.5', lon: '-70.0', display_name: 'Oranjestad, Aruba',
    address: { city: 'Oranjestad', country: 'Aruba', country_code: 'zz' } }];
  await commit('Oranjestad');
  const got3 = await until(() => /no currency known/.test(document.querySelector('#new-trip-place')?.nextElementSibling?.textContent || ''), 6000);
  const r3 = await lineNow();
  check('state 3 · located but unpriced says so — the state that used to say nothing at all',
    got3 && r3.text === 'Oranjestad, Aruba — no currency known for it, so prices stay unset. Set one in Trip settings.', r3?.text);
  check('state 3 · amber, not rust — nothing broke', r3?.colour === 'rgb(138, 90, 8)', r3?.colour);

  // state 4 · not found
  geoAnswer = [];
  await commit('Kyotoo');
  const got4 = await until(() => /Nothing found for/.test(document.querySelector('#new-trip-place')?.nextElementSibling?.textContent || ''), 6000);
  const r4 = await lineNow();
  check('state 4 · not found, with the exact canonical sentence', got4
    && r4.text === 'Nothing found for "Kyotoo" — the map centre and the currency stay unset. Try another spelling, or set both in Trip settings.', r4?.text);
  check('state 4 · RUST, not amber — something the user asked for did not happen',
    r4?.colour === 'rgb(155, 75, 75)', r4?.colour);

  // state 5 · offline
  await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { value: false, configurable: true }); });
  await commit('Kyoto');
  const got5 = await until(() => /No signal, so/.test(document.querySelector('#new-trip-place')?.nextElementSibling?.textContent || ''), 4000);
  const r5 = await lineNow();
  check('state 5 · offline, and it promises the trip is made anyway', got5
    && r5.text === 'No signal, so "Kyoto" was not looked up. The trip is made anyway — set the currency in Trip settings, or fix the city there once you have a signal.', r5?.text);
  check('state 5 · rust', r5?.colour === 'rgb(155, 75, 75)', r5?.colour);
  const gatedOffline = await page.evaluate(() => document.querySelector('[data-act="add-save"]').disabled);
  check('§2.3 · Create is not gated offline either', gatedOffline === false, `disabled=${gatedOffline}`);
  await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });
}

// ============================== OD-9 · the ghost, in its approved shape
{
  const shape = await page.evaluate(() => {
    const modal = document.querySelector('.modal');
    const ghost = modal?.querySelector('[data-act="add-save-later"]');
    const create = modal?.querySelector('[data-act="add-save"]');
    const buttons = [...(modal?.querySelectorAll('button') || [])].map((b) => b.textContent.trim());
    return ghost ? {
      label: ghost.textContent.trim(),
      classes: ghost.className,
      buttons,
      createLabel: create?.textContent.trim(),
      createClasses: create?.className,
      belowCreate: ghost.getBoundingClientRect().top > create.getBoundingClientRect().top,
    } : null;
  });
  check('OD-9 · exactly one ghost exists on the modal', !!shape);
  check('OD-9 · its label is the approved phrase, verbatim', shape?.label === "I'll do this later", shape?.label);
  check('OD-9 · it is a ghost, not a second primary', /btn ghost/.test(shape?.classes || ''), shape?.classes);
  check('OD-9 · Create is still the jade primary and still says Create',
    /jade/.test(shape?.createClasses || '') && shape?.createLabel === 'Create', `${shape?.createLabel} ${shape?.createClasses}`);
  check('OD-9 · it is BELOW Create, so Paste stays the default path', shape?.belowCreate);
  check('OD-9 · no third button was invented', (shape?.buttons || []).length === 3,
    (shape?.buttons || []).join(' | '));

  // And it lands on the trip just created (PR-2), not on Paste.
  const before = await page.evaluate(() => window.__store.state.trips.length);
  geoAnswer = null;
  await page.evaluate(() => {
    document.querySelector('#new-trip-name').value = '大阪 · 冬';
    document.querySelector('#new-trip-place').value = '';
  });
  await page.evaluate(() => document.querySelector('[data-act="add-save-later"]').click());
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    trips: window.__store.state.trips.length,
    name: window.__store.state.trip?.name,
    screen: location.hash || document.querySelector('.screen-title, .push-title, .tabbar')?.textContent?.trim() || '',
    onPaste: !!document.querySelector('#paste-text'),
    modalUp: !!document.querySelector('.modal'),
  }));
  check('OD-9 · the trip really is created', after.trips === before + 1, `${before} -> ${after.trips}`);
  check('OD-9 · and it is the trip now open', after.name === '大阪 · 冬', after.name);
  check('OD-9 · it lands on the trip just created, NOT on Paste (PR-2)', after.onPaste === false, `onPaste=${after.onPaste}`);
  check('OD-9 · the modal is gone once it resolves', after.modalUp === false);
}

// ===================== Create still lands on Paste — the default is unchanged
{
  await go('trips');
  await page.evaluate(() => document.querySelector('[data-act="add-toggle"]').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.querySelector('#new-trip-name').value = 'Paste is still default'; });
  await page.evaluate(() => document.querySelector('[data-act="add-save"]').click());
  await page.waitForTimeout(2500);
  const onPaste = await page.evaluate(() => !!document.querySelector('#paste-text'));
  check('§13.1 · Create still goes straight to Paste — the default path did not change', onPaste);
}

// ============================ Trip settings · provenance and the offer
{
  await go('trip');
  const prov = await page.evaluate(() => [...document.querySelectorAll('div')]
    .filter((d) => d.children.length === 0)
    .map((d) => d.textContent.trim())
    .find((x) => x === 'You set this.' || x.startsWith('From ') || x.startsWith('Not set —')));
  check('§6.1 · the MONEY card carries a provenance line', !!prov, prov);

  // A trip with no currency says so, in the canonical sentence.
  await page.evaluate(async () => {
    await window.__store.updateTrip({ currencySymbol: '', currencyCode: '', currencyFrom: '' });
  });
  await page.waitForTimeout(500);
  const unset = await page.evaluate(() => [...document.querySelectorAll('div')]
    .filter((d) => d.children.length === 0)
    .map((d) => d.textContent.trim())
    .find((x) => x.startsWith('Not set —')));
  check('§6.1 · unset reads exactly as designed', unset === 'Not set — prices show without a symbol until this is filled in.', unset);

  // The re-derive OFFER: currency already set, new city disagrees.
  await page.evaluate(async () => {
    await window.__store.updateTrip({ currencySymbol: '€', currencyCode: 'EUR' });
  });
  await page.waitForTimeout(400);
  geoAnswer = [{ lat: '35.01', lon: '135.76', display_name: 'Kyoto, Kyoto Prefecture, Japan',
    address: { city: 'Kyoto', country: 'Japan', country_code: 'jp' } }];
  await page.evaluate(async () => {
    await window.__store.updateTrip({ locationName: 'Kyoto' });
  });
  await page.waitForTimeout(1200);
  const offered = await page.evaluate(() => {
    const btn = document.querySelector('[data-act="use-currency"]');
    // The sentence's own element is the button's sibling, not any ancestor
    // whose textContent happens to contain it.
    const line = btn?.parentElement?.querySelector('div')?.textContent.trim();
    return {
      line, btn: btn?.textContent.trim(), code: window.__store.state.trip.currencyCode,
      colour: btn ? getComputedStyle(btn.parentElement.querySelector('div')).color : '',
    };
  });
  check('§6.2 · a disagreeing city OFFERS rather than overwrites', offered.line === 'Kyoto is in Japan. Price this trip in ¥ JPY?', offered.line);
  check('§6.2 · the offer is amber — uncertain, not broken', offered.colour === 'rgb(138, 90, 8)', offered.colour);
  check('§6.2 · with the approved button label', offered.btn === 'Use ¥ JPY', offered.btn);
  check('§6.2 · and the currency the user set is UNTOUCHED until they act', offered.code === 'EUR', offered.code);
  await page.evaluate(() => document.querySelector('[data-act="use-currency"]').click());
  await page.waitForTimeout(1200);
  const taken = await page.evaluate(() => ({
    code: window.__store.state.trip.currencyCode,
    prov: [...document.querySelectorAll('div')].filter((d) => d.children.length === 0)
      .map((d) => d.textContent.trim()).find((x) => x.startsWith('From ')),
    offerGone: !document.querySelector('[data-act="use-currency"]'),
  }));
  check('§6.2 · taking the offer adopts it', taken.code === 'JPY', taken.code);
  check('§6.2 · the offer disappears once acted on', taken.offerGone);
  check('§6.1 · and it stays credited to the city, not relabelled "You set this."',
    /^From Kyoto/.test(taken.prov || ''), taken.prov);
  const rateFetched = await page.evaluate(() => window.__store.state.trip.homeCurrencyRate);
  check('§6.2 · adopting a currency fetches NO rate — no automatic network on a settings edit',
    rateFetched == null, String(rateFetched));
}

// ================================= CJK, measured rather than eyeballed
{
  const m = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe'; host.style.cssText = 'width:318px';
    host.innerHTML = `<div class="f11 lh145" id="c1" style="color:var(--amber-fg)">Prices in ¥ JPY — from 京都府京都市中京区、日本</div>`;
    document.body.appendChild(host);
    const el = document.getElementById('c1');
    return { sw: el.scrollWidth, cw: el.clientWidth, h: el.getBoundingClientRect().height };
  });
  check('CJK: a long CJK place in the derived line wraps rather than overflowing', m.sw <= m.cw + 1, `${m.sw} vs ${m.cw}`);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

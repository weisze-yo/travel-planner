// QA-0 — `Paste a map link` completes its fix.
//
// The strip and its button shipped in batch 5 and were correct; the button
// opened a facts editor that had no map-link field, so the fix it named could
// not be carried out. Four approved or shipped strings promise this
// capability, so the behaviour was settled and only the plumbing was missing:
//
//   1 · Paste's row editor — "no pin until you add one from the stop itself"
//   2 · Paste's done receipt — "open one and paste its map link"
//   3 · Destination's Info empty — "Pasting a map link fills in whatever
//       OpenStreetMap has"
//   4 · store.js importItinerary's own header comment
//
// Nothing new was designed: `sourceLink` is a field every place has carried
// since places existed, `resolvePlaceInput()` is the lookup `capturePlace`
// already runs, and `factsEditor` is the sheet §4.2 names.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 200)}` : ''));
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
await page.route(/tile\.openstreetmap\.org|gstatic|open-meteo|frankfurter/, (r) => r.abort());

// The lookup the app runs on a link. Slowed on demand so the pending frame
// exists; nothing in web/ is padded to make it observable.
let slowNet = 0;
let detail = null;
await page.route(/nominatim\.openstreetmap\.org/, async (r) => {
  if (slowNet) await new Promise((d) => setTimeout(d, slowNet));
  if (!detail) return r.abort();
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
});

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const go = async (id, p) => {
  await page.evaluate(([i, q]) => window.__nav.go(i, q || {}), [id, p]);
  await page.waitForTimeout(500);
};
const until = async (fn, ms = 6000) => {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(70); }
  return false;
};

// A place with no position — the state the whole strip is about.
const target = await page.evaluate(() => {
  const p = window.__store.state.places.find((x) => x.latitude != null);
  const held = { id: p.id, name: p.name, lat: p.latitude, lon: p.longitude };
  p.latitude = null; p.longitude = null; p.sourceLink = '';
  window.__store.selectDay(window.__store.state.selectedDay);
  return held;
});
check('a place with no position exists to fix', !!target, target?.name);

// ================================= the field exists at all
{
  await go('dest', { placeID: target.id });
  await page.evaluate(() => document.querySelector('[data-act="fix-position"]')?.click());
  await page.waitForTimeout(500);
  const sheet = await page.evaluate(() => {
    const input = document.querySelector('#facts-link');
    if (!input) return null;
    const form = input.closest('.form');
    const eyebrow = [...form.querySelectorAll('.eyebrow')].find((e) => e.textContent.trim() === 'MAP LINK');
    const hint = [...form.querySelectorAll('div')].filter((d) => !d.children.length)
      .map((d) => d.textContent.replace(/\s+/g, ' ').trim())
      .find((t) => /no position yet/.test(t));
    return {
      placeholder: input.placeholder,
      eyebrow: !!eyebrow,
      hint,
      firstFactAfter: form.querySelector('[data-fact]')
        ? input.getBoundingClientRect().top < form.querySelector('[data-fact]').getBoundingClientRect().top
        : false,
    };
  });
  check('QA-0 · the NO POSITION button opens a facts editor that HAS a map-link field', !!sheet);
  check('QA-0 · with the same MAP LINK eyebrow Paste\'s row editor uses', sheet?.eyebrow);
  check('QA-0 · and the same placeholder', sheet?.placeholder === 'Paste a Google or Apple Maps link', sheet?.placeholder);
  check('QA-0 · it says what the link is for when there is no position',
    /This one has no position yet, so it is off the map and out of the walking route\./.test(sheet?.hint || ''), sheet?.hint);
  check('QA-0 · the link sits above the typed facts — it is what the button was for', sheet?.firstFactAfter);
}

// ================================= a link that cannot be read refuses
{
  await page.evaluate(() => {
    const i = document.querySelector('#facts-link');
    i.value = 'https://maps.app.goo.gl/abcdef';
  });
  await page.evaluate(() => document.querySelector('[data-act="facts-save"]').click());
  await page.waitForTimeout(700);
  const refused = await page.evaluate(() => {
    const input = document.querySelector('#facts-link');
    if (!input) return { gone: true };
    const form = input.closest('.form');
    const hint = [...form.querySelectorAll('div')].filter((d) => !d.children.length)
      .find((d) => /Short links/.test(d.textContent));
    return {
      gone: false,
      text: hint?.textContent.replace(/\s+/g, ' ').trim(),
      colour: hint ? getComputedStyle(hint).color : '',
      below: hint ? hint.getBoundingClientRect().top >= input.getBoundingClientRect().bottom - 1 : false,
      saveLive: document.querySelector('[data-act="facts-save"]')?.disabled === false,
    };
  });
  check('QA-0 · a short link refuses out loud rather than closing in silence',
    !refused.gone && /Short links like maps\.app\.goo\.gl cannot be read in a browser/.test(refused.text || ''), refused.text);
  check('QA-0 · in rust', refused.colour === 'rgb(155, 75, 75)', refused.colour);
  check('QA-0 · in the field it is about', refused.below);
  check('QA-0 · the sheet stays up and Save is live again — a failure is retryable in one tap', refused.saveLive);
}

// ================================= a real link gives it a position
{
  detail = [{
    lat: '35.0116', lon: '135.7681', display_name: 'Nishiki Market, Kyoto, Japan',
    address: { city: 'Kyoto', country: 'Japan', country_code: 'jp' },
    extratags: { opening_hours: '09:00-18:00', phone: '+81 75 000 0000', website: 'example.com' },
  }];
  slowNet = 1500;
  await page.evaluate(() => {
    const i = document.querySelector('#facts-link');
    i.value = 'https://www.google.com/maps/@35.0116,135.7681,17z';
  });
  await page.evaluate(() => document.querySelector('[data-act="facts-save"]').click());

  // P0-5 R1 and R8, on a control that is now genuinely async.
  const sawPending = await until(() => {
    const b = document.querySelector('[data-act="facts-save"]');
    return !!b && b.textContent.trim() === 'Looking it up…' && b.disabled === true;
  }, 4000);
  check('P0-5 R1 · pending is on the Save button that started the work', sawPending);
  const during = await page.evaluate(() => {
    const b = document.querySelector('[data-act="facts-save"]');
    // BOTH cancel affordances: the button and the scrim behind the sheet.
    // Querying only the first found the scrim and hid a real bug.
    const all = [...document.querySelectorAll('[data-act="facts-cancel"]')];
    return {
      sheetUp: !!document.querySelector('#facts-link'),
      busy: b?.getAttribute('aria-busy'),
      cancels: all.length,
      cancelPE: all.map((e) => getComputedStyle(e).pointerEvents),
      noSpinner: !document.querySelector('.spinner, .skeleton'),
    };
  });
  check('P0-5 R8 · the sheet stays up until it resolves', during.sheetUp || sawPending);
  check('P0-5 · aria-busy on the pending control', during.busy === 'true' || !sawPending, String(during.busy));
  check('P0-5 R11/R8 · EVERY way out goes non-interactive while it runs — the button AND the scrim',
    !sawPending || (during.cancels >= 2 && during.cancelPE.every((v) => v === 'none')),
    `${during.cancels} affordances: ${during.cancelPE.join(', ')}`);
  check('P0-5 R3 · no spinner was introduced', during.noSpinner);

  slowNet = 0;
  await page.waitForTimeout(2500);
  const after = await page.evaluate((id) => {
    const p = window.__store.state.places.find((x) => x.id === id);
    return {
      lat: p.latitude, lon: p.longitude, link: p.sourceLink, name: p.name,
      facts: (p.essentials || []).map((e) => e.key),
      sheetGone: !document.querySelector('#facts-link'),
    };
  }, target.id);
  check('QA-0 · THE FIX · the place now has a position', after.lat != null && after.lon != null,
    `${after.lat}, ${after.lon}`);
  check('QA-0 · the link is remembered on the place', /google\.com\/maps/.test(after.link || ''), after.link);
  check('QA-0 · and OpenStreetMap\'s facts arrived, as the Info empty state promises',
    after.facts.length > 0, after.facts.join(', '));
  check('QA-0 · the place KEEPS ITS OWN NAME — a link\'s label never overwrites it',
    after.name === target.name, `${after.name} vs ${target.name}`);
  check('QA-0 · the sheet closes on success', after.sheetGone);
}

// ================================= and the strip is gone, because it is fixed
{
  await go('dest', { placeID: target.id });
  const strip = await page.evaluate(() => {
    const w = document.querySelector('.warn');
    return { label: w?.querySelector('.warn-label')?.textContent.trim() || null };
  });
  check('QA-0 · the NO POSITION strip is gone once there is a position', strip.label !== 'NO POSITION', strip.label);
}

// ================================= typed facts are never lost
{
  await page.evaluate(() => document.querySelector('[data-act="edit-facts"]')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-fact]')];
    const own = rows.find((r) => r.dataset.factKey === 'Worth knowing') || rows[rows.length - 1];
    own.value = 'Cash only — mine, typed by hand';
    document.querySelector('#facts-link').value = 'https://maps.app.goo.gl/nope';
  });
  await page.evaluate(() => document.querySelector('[data-act="facts-save"]').click());
  await page.waitForTimeout(800);
  const kept = await page.evaluate((id) => {
    const p = window.__store.state.places.find((x) => x.id === id);
    return (p.essentials || []).some((e) => e.value === 'Cash only — mine, typed by hand');
  }, target.id);
  check('QA-0 · a link that fails never costs the user the rest of the edit', kept);
  await page.evaluate(() => document.querySelector('[data-act="facts-cancel"]')?.click());
  await page.waitForTimeout(300);
}

// ================================= clearing the field forgets the link only
{
  const cleared = await page.evaluate(async (id) => {
    const before = window.__store.state.places.find((x) => x.id === id).latitude;
    const r = await window.__store.setPlaceLink(id, '');
    const p = window.__store.state.places.find((x) => x.id === id);
    return { ok: r.ok, before, after: p.latitude, link: p.sourceLink };
  }, target.id);
  check('QA-0 · clearing the link forgets the link', cleared.ok && cleared.link === '', JSON.stringify(cleared));
  check('QA-0 · and keeps the position, which may have been right all along',
    cleared.after === cleared.before, `${cleared.before} -> ${cleared.after}`);
}

// ================================= the field is on every place, not just broken ones
{
  const other = await page.evaluate(() => {
    const p = window.__store.state.places.find((x) => x.latitude != null);
    return p ? { id: p.id } : null;
  });
  await go('dest', { placeID: other.id });
  await page.evaluate(() => document.querySelector('[data-act="edit-facts"]')?.click());
  await page.waitForTimeout(500);
  const onGood = await page.evaluate(() => {
    const i = document.querySelector('#facts-link');
    const form = i?.closest('.form');
    const hint = form ? [...form.querySelectorAll('div')].filter((d) => !d.children.length)
      .map((d) => d.textContent.replace(/\s+/g, ' ').trim())
      .find((t) => /The link this place came from/.test(t)) : null;
    const optional = form ? [...form.querySelectorAll('.f11')].some((e) => e.textContent.trim() === 'optional') : false;
    return { present: !!i, hint, optional };
  });
  check('QA-0 · a place that already has a position still has the field', onGood.present);
  check('QA-0 · and it reads as optional there, not as a problem',
    onGood.optional && /Paste a new one to correct its position/.test(onGood.hint || ''), onGood.hint);
  await page.evaluate(() => document.querySelector('[data-act="facts-cancel"]')?.click());
}

// ================================= CJK, measured
{
  const m = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe'; host.style.cssText = 'width:318px';
    host.innerHTML = `<div class="f11 soft lh145" id="h">このスポットにはまだ位置情報がありません。地図にも徒歩ルートにも出てきません。</div>`;
    document.body.appendChild(host);
    const el = document.getElementById('h');
    return { sw: el.scrollWidth, cw: el.clientWidth };
  });
  check('CJK: the hint wraps rather than overflowing', m.sw <= m.cw + 1, `${m.sw} vs ${m.cw}`);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

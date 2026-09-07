// §3.3 — NO PHOTO MEANS NO SLOT, AND THE CREDIT IS A BAR NOT A WHISPER.
//
// Destination opened on a 230px `.hero.placeholder-hatch` — diagonal grey
// stripes reading "Photo placeholder" — on EVERY record. Measured against
// the current snapshot: 618 places, 616 with no image, and of the 43
// stop-places exactly ZERO have one. So that was 228px of promised picture
// on every stop of the trip, and the promise was never going to be kept.
//
// Both halves are gated here, and their reach is very unequal:
//
//   B · no image, no hero    the common case. 228px returned, a real 52px
//                            white bar for the back button instead of it
//                            floating on a hatch, badges into the name
//                            block. Nothing is missing because nothing was
//                            promised.
//   A · with an image        200px photo + a 28px SOLID ink credit bar.
//                            228 together, within a pixel of the 230 the
//                            hatch took, so a record with a photo costs
//                            what every record used to cost.
//
// The credit rule is checked on every licence the data actually holds (CC
// BY-SA 33, CC BY 14, CC0 3, public domain 2) AND on three kinds of sloppy
// record, because the bar is deliberately NOT conditional on the licence:
// no future change can make attribution disappear by shipping bad data. It
// also asserts the licence is never abbreviated to "CC" and never given a
// version the record does not carry — Design's format shows "CC BY-SA 4.0"
// and this data has no version, so the version is not invented.
//
// The last block is the one the live check earned. A photo that fails to
// load must not leave a hole, and the FIRST implementation of that removed
// the hero from the DOM — taking the back button, which lives inside the
// hero, with it. A screen you cannot leave is worse than a hole. It records
// the dead url and repaints into the no-photo branch instead, and the back
// button is asserted explicitly.
//
// The photo is served from this machine, not Wikimedia, which is unreachable
// from this environment — a hero that never loads would exercise the error
// path and prove nothing about the design.
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

  // Resolved by ITEM id, not place id: `subject()` only fills `number` and
  // `window` for a plan row, so navigating by placeID gives a record with no
  // badges at all and the badge checks would pass vacuously.
  //
  // And it has to be the main stop with the MOST nearby places, so the
  // .nearby-thumb check at the end has a row to look at.
  const target = await page.evaluate(() => {
    const s = window.__store;
    const byAnchor = new Map();
    for (const p of s.state.places) {
      if (p.anchorPlaceID) byAnchor.set(p.anchorPlaceID, (byAnchor.get(p.anchorPlaceID) || 0) + 1);
    }
    let best = null;
    for (const d of (s.state.days || [])) {
      for (const it of (d.items || [])) {
        if (!it?.placeID || it.kind === 'sub') continue;
        const n = byAnchor.get(it.placeID) || 0;
        if (!best || n > best.n) best = { itemID: it.id, placeID: it.placeID, n };
      }
    }
    return best;
  });
  console.log('  target:', JSON.stringify(target));
  check('§3.3 · a main stop with nearby places to check',
        Boolean(target) && target.n > 0, JSON.stringify(target));
  const anchor = target.placeID;

  // =============================== B · the common case: no image, no slot
  await go('dest', { itemID: target.itemID });
  const bare = await page.evaluate(() => {
    const scroll = document.querySelector('.scroll');
    const bar = document.querySelector('.dest-bar');
    const name = document.querySelector('.dest-name');
    const badges = [...document.querySelectorAll('.dest-body .hero-badge')];
    return {
      hero: Boolean(document.querySelector('.hero')),
      hatch: Boolean(document.querySelector('.hero.placeholder-hatch')),
      placeholderWords: /Photo placeholder/.test(scroll.textContent),
      credit: Boolean(document.querySelector('.hero-credit')),
      bar: bar ? Math.round(bar.getBoundingClientRect().height) : null,
      barBg: bar && getComputedStyle(bar).backgroundColor,
      back: Boolean(bar?.querySelector('[data-act="back"]')),
      nameTop: name ? Math.round(name.getBoundingClientRect().top) : null,
      nameSize: name && getComputedStyle(name).fontSize,
      badges: badges.map((b) => b.textContent.trim()),
      badgeGrounds: badges.map((b) => getComputedStyle(b).backgroundColor),
    };
  });
  console.log('  bare:', JSON.stringify(bare));
  check('§3.3-B · no photo means NO HERO at all', bare.hero === false);
  check('§3.3-B · the hatched placeholder is gone', bare.hatch === false);
  check('§3.3-B · and the words "Photo placeholder" with it', bare.placeholderWords === false);
  check('§3.3-B · no credit bar with nothing to credit', bare.credit === false);
  check('§3.3-B · the back button gets a real 52px white bar',
        bare.bar === 52 && bare.barBg === 'rgb(255, 255, 255)' && bare.back === true,
        `${bare.bar} ${bare.barBg} ${bare.back}`);
  check('§3.3-B · the badges move into the block that owns the subject',
        bare.badges.length > 0 && bare.badges.some((b) => /MAIN ROUTE/.test(b)),
        JSON.stringify(bare.badges));
  check('§3.3-B · and each keeps a ground of its own over white',
        bare.badgeGrounds.length > 0
          && bare.badgeGrounds.every((g) => g !== 'rgba(0, 0, 0, 0)'),
        JSON.stringify(bare.badgeGrounds));
  check('§3.3-B · the name is near the top of the screen now',
        bare.nameTop !== null && bare.nameTop < 130, bare.nameTop);

  // =============================== A · a record that DOES have a photo
  //
  // Served from this machine, because Wikimedia is unreachable from here and
  // a hero that never loads would test the error path, not the design.
  const withShot = await page.evaluate(async (id) => {
    const s = window.__store;
    const rec = s.place(id);
    rec.images = [{
      url: './icons/icon-192.png',
      license: 'CC BY-SA',
      credit: 'Kanko Kikaku',
      caption: 'Ginzan Onsen Street in the snow',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:Ginzan.jpg',
    }];
    s.touch();
    await new Promise((r) => setTimeout(r, 600));
    const hero = document.querySelector('.hero.photo');
    const img = document.querySelector('.hero-img');
    const credit = document.querySelector('.hero-credit');
    if (!hero || !credit) return { missing: true, hero: Boolean(hero), credit: Boolean(credit) };
    const hb = hero.getBoundingClientRect(), cb = credit.getBoundingClientRect();
    const ccs = getComputedStyle(credit);
    const grow = credit.querySelector('.grow');
    return {
      heroH: Math.round(hb.height), creditH: Math.round(cb.height),
      total: Math.round(cb.bottom - hb.top),
      imgFit: img && getComputedStyle(img).objectFit,
      imgAlt: img?.getAttribute('alt'),
      wash: Boolean(document.querySelector('.hero-wash')),
      badgesOverPhoto: document.querySelectorAll('.hero.photo .hero-badge').length,
      badgesInBody: document.querySelectorAll('.dest-body .hero-badge').length,
      creditText: credit.textContent.replace(/\s+/g, ' ').trim(),
      creditBg: ccs.backgroundColor, creditFg: ccs.color,
      href: credit.getAttribute('href'),
      target: credit.getAttribute('target'),
      arrow: credit.querySelector('.hero-credit-go')?.textContent.trim(),
      clipped: getComputedStyle(grow).textOverflow + ' ' + getComputedStyle(grow).whiteSpace,
      dest: Boolean(document.querySelector('.dest-bar')),
    };
  }, anchor);
  console.log('  withShot:', JSON.stringify(withShot));
  check('§3.3-A · the photo is 200px and the credit bar 28px',
        withShot.heroH === 200 && withShot.creditH === 28,
        `${withShot.heroH} + ${withShot.creditH}`);
  check('§3.3-A · 228 together, within a pixel of the 230 the hatch took',
        withShot.total === 228, withShot.total);
  check('§3.3-A · the image covers rather than stretches', withShot.imgFit === 'cover', withShot.imgFit);
  check('§3.3-A · and carries the caption as its alt text',
        /Ginzan Onsen Street in the snow/.test(withShot.imgAlt || ''), withShot.imgAlt);
  check('§3.3-A · a bottom-up ink wash keeps the badges readable', withShot.wash === true);
  check('§3.3-A · the badges sit over the photo, not in the body',
        withShot.badgesOverPhoto > 0 && withShot.badgesInBody === 0,
        `${withShot.badgesOverPhoto} / ${withShot.badgesInBody}`);
  check('§3.3-A · and the white back-button bar is not also there',
        withShot.dest === false);
  check('§3.3-A · the credit reads credit · licence · Commons',
        /^Kanko Kikaku · CC BY-SA · Commons/.test(withShot.creditText || ''), withShot.creditText);
  check('§3.3-A · white on SOLID ink — never alpha over an unpredictable photo',
        withShot.creditBg === 'rgb(20, 32, 28)' && withShot.creditFg === 'rgb(255, 255, 255)',
        `${withShot.creditBg} ${withShot.creditFg}`);
  check('§3.3-A · the whole bar links to the source page, and the ↗ says so',
        withShot.href === 'https://commons.wikimedia.org/wiki/File:Ginzan.jpg'
          && withShot.target === '_blank' && withShot.arrow === '↗',
        `${withShot.href} ${withShot.arrow}`);
  check('§3.3-A · the line clips rather than wrapping, credit first',
        withShot.clipped === 'ellipsis nowrap', withShot.clipped);

  // ---- the three-line rule, on every licence in the data ---------------
  const rules = await page.evaluate(() => {
    const s = window.__store;
    return {
      ccbysa: s.imageCredit({ license: 'CC BY-SA', credit: 'A Name' }),
      ccby: s.imageCredit({ license: 'CC BY', credit: 'A Name' }),
      cc0: s.imageCredit({ license: 'CC0', credit: 'A Name' }),
      pd: s.imageCredit({ license: 'public domain' }),
      sloppyNoCredit: s.imageCredit({ license: 'CC BY' }),
      sloppyNoLicence: s.imageCredit({ credit: 'A Name' }),
      nothing: s.imageCredit({}),
    };
  });
  console.log('  rules:', JSON.stringify(rules));
  check('§3.3 · CC BY-SA → Name · CC BY-SA · Commons',
        rules.ccbysa === 'A Name · CC BY-SA · Commons', rules.ccbysa);
  check('§3.3 · CC BY → Name · CC BY · Commons',
        rules.ccby === 'A Name · CC BY · Commons', rules.ccby);
  check('§3.3 · CC0 and public domain → Public domain · Commons, source still shown',
        rules.cc0 === 'Public domain · Commons' && rules.pd === 'Public domain · Commons',
        `${rules.cc0} / ${rules.pd}`);
  check('§3.3 · the licence is never abbreviated to "CC"',
        !/·\s*CC\s*·/.test(Object.values(rules).join('|')));
  check('§3.3 · and never given a version the data does not carry',
        !/4\.0|3\.0/.test(Object.values(rules).join('|')), JSON.stringify(rules));
  // The bar is not conditional on the licence, so sloppy data cannot make
  // attribution disappear — it makes the gap visible instead.
  check('§3.3 · sloppy data cannot silently drop attribution',
        /Unknown author/.test(rules.sloppyNoCredit)
          && /Licence not recorded/.test(rules.sloppyNoLicence)
          && rules.nothing.includes('Commons'),
        JSON.stringify([rules.sloppyNoCredit, rules.sloppyNoLicence, rules.nothing]));

  // ---- a photo that does not arrive must leave no hole -----------------
  const broken = await page.evaluate(async (id) => {
    const s = window.__store;
    s.place(id).images = [{ url: './no-such-file-anywhere.jpg', license: 'CC BY', credit: 'X' }];
    s.touch();
    await new Promise((r) => setTimeout(r, 1400));
    const bar = document.querySelector('.dest-bar');
    return {
      hero: Boolean(document.querySelector('.hero')),
      credit: Boolean(document.querySelector('.hero-credit')),
      name: Boolean(document.querySelector('.dest-name')),
      nameTop: Math.round(document.querySelector('.dest-name').getBoundingClientRect().top),
      // The defect the first version of the error handler had: the back
      // button lives INSIDE the hero when there is a photo, so removing the
      // hero left a screen with no way off it.
      backBar: bar ? Math.round(bar.getBoundingClientRect().height) : null,
      back: Boolean(bar?.querySelector('[data-act="back"]')),
      badges: document.querySelectorAll('.dest-body .hero-badge').length,
    };
  }, anchor);
  console.log('  broken:', JSON.stringify(broken));
  check('§3.3 · an image that fails takes its hero out entirely',
        broken.hero === false && broken.credit === false, JSON.stringify(broken));
  check('§3.3 · leaving the complete no-photo design, not a 228px void',
        broken.name === true && broken.nameTop < 160, broken.nameTop);
  // This is the check the first implementation failed. It removed the hero
  // from the DOM, and the back button with it.
  check('§3.3 · and the back button survives — a dead photo must not trap you',
        broken.backBar === 52 && broken.back === true,
        `${broken.backBar} / ${broken.back}`);
  check('§3.3 · with the badges moved into the name block, as in the real no-photo case',
        broken.badges > 0, broken.badges);

  // ---- and the hatch survives where it is still right -----------------
  await page.evaluate((iid) => { window.__test_itemID = iid; }, target.itemID);
  const hatch = await page.evaluate(async (id) => {
    const s = window.__store;
    delete s.place(id).images;
    window.__nav.go('dest', { itemID: window.__test_itemID });
    await new Promise((r) => setTimeout(r, 600));
    document.querySelector('[data-panel="nearby"]')?.click();
    await new Promise((r) => setTimeout(r, 700));
    const thumb = document.querySelector('.nearby-thumb');
    return {
      thumb: Boolean(thumb),
      hasHatch: thumb ? getComputedStyle(thumb).backgroundImage.includes('repeating-linear-gradient') : null,
      classStillDefined: [...document.styleSheets].some((ss) => {
        try { return [...ss.cssRules].some((r) => r.selectorText === '.placeholder-hatch'); }
        catch { return false; }
      }),
    };
  }, anchor);
  console.log('  hatch:', JSON.stringify(hatch));
  check('§3.3 · .placeholder-hatch stays in the stylesheet',
        hatch.classStillDefined === true);
  check('§3.3 · and a 56px nearby thumbnail still wears it — a slot in a row is not a promise',
        hatch.thumb === true && hatch.hasHatch === true, JSON.stringify(hatch));

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

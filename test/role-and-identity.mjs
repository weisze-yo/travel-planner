// Batch 7 — P0-1, role and copy identity. The oldest confirmed gap in the
// readiness map, and the one the map does not schedule: `myRole()` was
// exported from store.js and called by NO screen module, so a `read` user was
// shown an enabled send control that silently did nothing.
//
// That is the exact interaction failure the whole silent-refusal rule exists
// to stop, sitting on the most consequential control in the sharing model.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 220)}` : ''));
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
await page.route(/tile\.openstreetmap\.org|gstatic|nominatim|open-meteo|frankfurter/, (r) => r.abort());

await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const go = async (id) => { await page.evaluate((i) => window.__nav.go(i), id); await page.waitForTimeout(500); };

/** Put this phone on a shared trip in a given role, the way a join would. */
const asRole = async (role) => page.evaluate(async (r) => {
  const store = window.__store;
  const mine = store.me().id;
  const people = r === 'owner'
    ? [{ id: mine, name: 'You', role: 'owner', joinedAt: new Date().toISOString() }]
    : [
      { id: 'owner-ana', name: 'Ana', role: 'owner', joinedAt: new Date().toISOString() },
      { id: mine, name: 'You', role: r, joinedAt: new Date().toISOString() },
      { id: 'other-bo', name: 'Bo', role: 'read', joinedAt: new Date().toISOString() },
    ];
  // An `edit` joiner can only send through a share of their OWN — a joined
  // copy has `sharedFrom`, not `link`, and `publishUpdate()` requires
  // `shareState()?.on`. So the fixture gives edit and owner a live share and
  // read none, which is what the app can actually be in.
  const link = { code: 'ROLE-CODE', live: true, opens: 0, role: 'read', expiresAt: null };
  await store.updateTrip({
    people,
    sharedFrom: r === 'owner' ? null : { code: 'ROLE-CODE', version: 1, from: 'Ana' },
    share: r === 'read' ? null : { on: true, version: 1, snapshot: null },
    link: r === 'read' ? null : link,
  });
  return store.myRole();
}, role);

// ============================== myRole() finally reaches a screen
{
  const src = await (await fetch(`${APP}/js/screens/share.js`)).text();
  check('P0-1 · a screen module calls the role at last', /store\.canPublish\(\)/.test(src) && /store\.isOwner\(\)/.test(src));
}

// ============================== the `read` send block
{
  const role = await asRole('read');
  check('a read role really is read', role === 'read', role);
  await go('share');
  const read = await page.evaluate(() => {
    const send = document.querySelector('[data-act="send-update"]');
    const jade = [...document.querySelectorAll('.hint-jade')]
      .find((h) => /YOUR CHANGES/.test(h.textContent));
    return {
      sendExists: !!send,
      sendDisabled: send?.disabled,
      eyebrow: jade?.querySelector('.eyebrow')?.textContent.trim(),
      body: jade ? jade.textContent.replace(/\s+/g, ' ').replace('YOUR CHANGES', '').trim() : null,
      bg: jade ? getComputedStyle(jade).backgroundColor : '',
    };
  });
  check('THE GAP · a read user is no longer shown a send control at all', !read.sendExists,
    `send button present: ${read.sendExists}, disabled: ${read.sendDisabled}`);
  check('§4.4 · the button is REMOVED, not disabled — a disabled primary would be a standing accusation',
    read.sendDisabled === undefined);
  check('§4.4 · a jade block stands in its place', read.eyebrow === 'YOUR CHANGES', read.eyebrow);
  check('§4.4 · with the approved sentence, naming who does send',
    read.body === 'Everything you change stays on your copy. Ana sends the updates for this trip.', read.body);
  check('§4.4 · and nothing names the absent button — that would be the refusal in words',
    !/cannot|can’t|can\'t|not allowed|no permission|only the owner can send/i.test(read.body || ''), read.body);
  check('§8 · it is the .hint-jade batch 0 defined', read.bg === 'rgb(230, 239, 235)', read.bg);
}

// ============================== §4.3 · the manage phase, non-owner
{
  const nonOwner = await page.evaluate(() => ({
    chips: [...document.querySelectorAll('[data-person]')].length,
    badges: [...document.querySelectorAll('.badge')].map((b) => b.textContent.trim()),
    add: !!document.querySelector('[data-act="resend"]'),
    swipe: [...document.querySelectorAll('[data-remove]')].length,
    linkSection: [...document.querySelectorAll('.eyebrow')].map((e) => e.textContent.trim()),
    mine: !!document.querySelector('.mine-chip'),
    explainer: [...document.querySelectorAll('.hint-jade')]
      .map((h) => h.textContent.replace(/\s+/g, ' ').trim())
      .find((t) => /looks after who is on this trip/.test(t)),
  }));
  check('§4.3 · a non-owner gets role BADGES, not tappable chips', nonOwner.chips === 0, `${nonOwner.chips} chips`);
  check('§4.3 · flat and uppercase, the provenance family',
    nonOwner.badges.some((b) => b === b.toUpperCase() && b.length > 2), nonOwner.badges.join(' | '));
  check('§4.3 · no resend control', !nonOwner.add);
  check('§4.3 · no row is swipeable to remove', nonOwner.swipe === 0, `${nonOwner.swipe} swipeable`);
  check('§4.3 · the link section is hidden, not shown dead',
    !nonOwner.linkSection.some((e) => /^(The link|Make a link)$/.test(e)), nonOwner.linkSection.join(' | '));
  check('§4.3 · your own row says YOU', nonOwner.mine);
  check('§4.3 · and the jade explainer names who looks after the trip',
    nonOwner.explainer === 'Ana looks after who is on this trip and sends its updates.', nonOwner.explainer);
  // §12.1 — removePerson() has no owner guard; the UI-level mitigation is
  // simply not binding the gesture. This asserts the mitigation is in place.
  check('§12.1 · the remove gesture is not bound for a non-owner (the data-layer gap is mitigated, not fixed)',
    nonOwner.swipe === 0);
}

// ============================== an `edit` role keeps the button
{
  await asRole('edit');
  await go('share');
  const edit = await page.evaluate(() => {
    const send = document.querySelector('[data-act="send-update"]');
    return {
      sendExists: !!send,
      label: send?.textContent.trim(),
      readBlock: [...document.querySelectorAll('.hint-jade')].some((h) => /YOUR CHANGES/.test(h.textContent)),
      chips: [...document.querySelectorAll('[data-person]')].length,
    };
  });
  check('an edit role KEEPS the send control — the block is for read alone', edit.sendExists, edit.label);
  check('and does not get the read block', !edit.readBlock);
  check('but still cannot change anyone else\'s role', edit.chips === 0, `${edit.chips} chips`);
}

// ============================== the owner keeps everything
{
  await asRole('owner');
  await go('share');
  const owner = await page.evaluate(() => ({
    chips: [...document.querySelectorAll('[data-person]')].length,
    linkSection: [...document.querySelectorAll('.eyebrow')].map((e) => e.textContent.trim())
      .some((e) => /^(The link|Make a link)$/.test(e)),
    readBlock: [...document.querySelectorAll('.hint-jade')].some((h) => /YOUR CHANGES/.test(h.textContent)),
    caret: !!document.querySelector('[data-person] svg'),
  }));
  check('the owner still sees the link section', owner.linkSection);
  check('the owner never sees the read block', !owner.readBlock);
  check('§4.2 · the role chip gains a caret, so a control looks like a control',
    owner.chips === 0 || owner.caret, `chips ${owner.chips}, caret ${owner.caret}`);
}

// ============================== §5 · the "from Ana" marker
{
  await asRole('read');
  await go('trips');
  const onTrips = await page.evaluate(() => {
    const meta = [...document.querySelectorAll('.trip-card-meta, .trip-cover-meta')]
      .map((m) => m.textContent.replace(/\s+/g, ' ').trim());
    const mark = document.querySelector('.trip-card-meta .who-mark');
    return { meta, markGlyph: mark?.textContent.trim(), hidden: mark?.getAttribute('aria-hidden') };
  });
  check('§5 · My trips names whose copy it is', onTrips.meta.some((m) => /from Ana/.test(m)), onTrips.meta.join(' | '));
  check('§5 · with a .who-mark showing the initial', onTrips.markGlyph === 'A', onTrips.markGlyph);
  check('§11.4 · the mark is aria-hidden, so the name is announced once', onTrips.hidden === 'true', onTrips.hidden);

  await go('trip');
  const onSettings = await page.evaluate(() => document.querySelector('.push-sub')?.textContent.replace(/\s+/g, ' ').trim());
  check('§5 · Trip settings names it too', /from Ana/.test(onSettings || ''), onSettings);

  await go('map');
  const onChip = await page.evaluate(() => {
    const meta = document.querySelector('.trip-meta');
    return { text: meta?.textContent.replace(/\s+/g, ' ').trim(), warn: meta?.classList.contains('warn') };
  });
  check('§5 · the Map trip chip names it', /from Ana/.test(onChip.text || ''), onChip.text);
  check('§5 · and it is not a sync warning', !onChip.warn);

  // An owner's own trip never carries one.
  await asRole('owner');
  await go('trips');
  const ownTrip = await page.evaluate(() => [...document.querySelectorAll('.trip-card-meta, .trip-cover-meta')]
    .map((m) => m.textContent).join(' '));
  check('§5 · an owner\'s own trip never carries a who-mark', !/from /.test(ownTrip), ownTrip.slice(0, 80));
}

// ============================== CJK and long names, measured
{
  const m = await page.evaluate(async () => {
    const share = await import('./js/share.js');
    return {
      han: share.initialFor('陳美玲'),
      one: share.initialFor('李'),
      empty: share.initialFor(''),
      latin: share.initialFor('Alexandra Fitzgerald-Moreau'),
    };
  });
  check('§10 · a Han name gives its surname character, not a transliteration', m.han === '陳', m.han);
  check('§10 · a one-character name works', m.one === '李', m.one);
  check('§10 · an empty name falls back rather than throwing', typeof m.empty === 'string', JSON.stringify(m.empty));
  check('§10 · a Latin name gives its initial', m.latin === 'A', m.latin);

  const fit = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe'; host.style.cssText = 'width:230px';
    host.innerHTML = `<div class="trip-meta" id="tm"><span class="who-mark sm">陳</span> from 陳美玲 · Day 3 of 6 · Sat 14 Mar</div>`;
    document.body.appendChild(host);
    const el = document.getElementById('tm');
    return { sw: el.scrollWidth, cw: el.clientWidth, h: el.getBoundingClientRect().height };
  });
  check('§10 · a long CJK owner name does not overflow the chip meta line',
    fit.sw <= fit.cw + 1 || fit.h > 14, `${fit.sw} vs ${fit.cw}, h ${Math.round(fit.h)}`);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

// ============================== the arrival banner
{
  const shown = await page.evaluate(async () => {
    await window.__store.updateTrip({
      sharedFrom: { code: 'ROLE-CODE', version: 1, from: 'Ana' },
      justArrived: 'read',
    });
    window.__nav.go('plan');
    await new Promise((r) => setTimeout(r, 600));
    const el = document.querySelector('.arrived');
    return {
      title: el?.querySelector('.arrived-t')?.textContent.trim(),
      body: el?.querySelector('.arrived-s')?.textContent.replace(/\s+/g, ' ').trim(),
      dismiss: !!el?.querySelector('[data-act="arrived-close"]'),
      bg: el ? getComputedStyle(el).backgroundColor : '',
    };
  });
  check('the arrival banner uses the .arrived class app.css carried unused', shown.title === 'YOUR COPY', shown.title);
  check('with the read copy', shown.body === 'This copy is yours. Change anything you like — it stays on this phone.', shown.body);
  check('jade, and dismissible', shown.bg === 'rgb(230, 239, 235)' && shown.dismiss, `${shown.bg} dismiss=${shown.dismiss}`);

  const editCopy = await page.evaluate(async () => {
    await window.__store.updateTrip({ justArrived: 'edit' });
    await new Promise((r) => setTimeout(r, 400));
    return document.querySelector('.arrived-s')?.textContent.replace(/\s+/g, ' ').trim();
  });
  check('and the edit copy branches, because "yours" means something different',
    editCopy === 'This copy is yours. When you want everyone else to have your changes, send an update from Share.', editCopy);

  const gone = await page.evaluate(async () => {
    document.querySelector('[data-act="arrived-close"]')?.click();
    await new Promise((r) => setTimeout(r, 500));
    return { visible: !!document.querySelector('.arrived'), stored: window.__store.arrival() };
  });
  check('dismissing it removes it', !gone.visible);
  check('and it does not return', gone.stored === null, JSON.stringify(gone.stored));
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

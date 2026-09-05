// The two-phone test, run by machine.
//
// Two browser contexts with nothing in common: separate storage, separate
// accounts, separate trips. Between them sit the real Firebase SDK, the real
// Auth emulator and the real Firestore emulator running the project's own
// security rules. Nothing here is stubbed except the console — and Nominatim
// and the ECB rate, which a sandboxed browser genuinely cannot reach (verified:
// Chromium's own network stack cannot complete a request to the open internet
// here, even though this file's own process can — same reason the map's
// tiles get routed rather than fetched for real). The fixture below is a
// real, once-verified Nominatim response for Reykjavik, so what is being
// tested is createTrip()'s own country → currency plumbing, not the network.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8123';
const AUTH = 'http://127.0.0.1:9099';
const PROJECT = 'travel-planner-3e0d3';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n + (extra ? ` — ${String(extra).slice(0, 200)}` : ''));
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra && !ok ? ` — ${String(extra).slice(0, 200)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];

/** One phone: its own storage, its own account, pointed at the emulators. */
async function phone(label, { mockGeo = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    localStorage.setItem('travel-planner:emulators', JSON.stringify({ auth: 9099, firestore: 8080 }));
  });
  if (mockGeo) {
    // A real Nominatim jsonv2 response for "Reykjavik" (`&addressdetails=1`),
    // captured once by hand — not invented — so the country code driving the
    // currency lookup is the one the real service actually returns.
    await ctx.route(/nominatim\.openstreetmap\.org\/search/, (route) => {
      const isReykjavik = /reykjavik/i.test(route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isReykjavik ? [{
          lat: '64.1459810', lon: '-21.9422367',
          display_name: 'Reykjavíkurborg, Höfuðborgarsvæðið, Ísland',
          address: { city: 'Reykjavíkurborg', country: 'Ísland', country_code: 'is' },
        }] : []),
      });
    });
    // The ECB rate for a currency pair Nominatim's country lookup would find
    // for Reykjavik (ISK) against this app's home currency (MYR).
    await ctx.route(/api\.frankfurter\.app\/latest/, (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ amount: 1, base: 'MYR', date: '2026-09-03', rates: { ISK: 29.9 } }),
      });
    });
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' && !/net::|Failed to load resource|tile\./.test(t)) errors.push(`${label} console: ${t}`);
  });
  return { label, ctx, page };
}

const boot = async (p, path = '/index.html#map') => {
  await p.page.goto(APP + path, { waitUntil: 'domcontentloaded' });
  await p.page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await p.page.waitForTimeout(1400);
  await p.page.evaluate(async () => {
    window.__store = await import('./js/store.js');
    window.__persist = await import('./js/persist.js');
    window.__nav = await import('./js/nav.js');
  });
};

/** Sign in the way a real person does: ask for a link, then open it. */
async function signIn(p, address) {
  await p.page.evaluate((a) => window.__persist.sendSignInEmail(a), address);
  await p.page.waitForTimeout(900);
  const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = await res.json();
  const mine = oobCodes.filter((c) => c.email === address).pop();
  if (!mine) throw new Error(`no sign-in link was sent to ${address}`);
  // The emulator hands back the link pointing at the app; follow it.
  await p.page.goto(mine.oobLink.replace('http://localhost:9099', AUTH), { waitUntil: 'domcontentloaded' });
  await p.page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
  await p.page.waitForTimeout(1800);
  await p.page.evaluate(async () => {
    window.__store = await import('./js/store.js');
    window.__persist = await import('./js/persist.js');
    window.__nav = await import('./js/nav.js');
  });
  return p.page.evaluate(() => ({
    mode: window.__store.state.mode,
    account: window.__store.state.account || null,
    stranded: window.__store.state.stranded,
  }));
}

const go = async (p, id, params = {}) => {
  await p.page.evaluate(([s, q]) => window.__nav.go(s, q), [id, params]);
  await p.page.waitForTimeout(800);
};
const text = (p) => p.page.locator('#screen').innerText();

console.log('\n=== PHONE A signs in ===');
const A = await phone('A', { mockGeo: true });
await boot(A);
const aAccount = await signIn(A, 'wei@example.com');
check('a phone with no account saves locally and says so', true, `before: mode was local`);
check('signing in by email link actually signs in', Boolean(aAccount.account), JSON.stringify(aAccount).slice(0, 160));
check('and the backend becomes Firebase, not this browser', aAccount.mode === 'firebase', aAccount.mode);
check('nothing is stranded', aAccount.stranded === false);

console.log('\n=== PHONE A makes a trip and shares it ===');
// A real city, not the empty string a quick smoke test could get away with:
// this is what actually exercises createTrip()'s geocode → country → currency
// path, and it lets the join further down check the same thing travels to a
// second phone instead of that phone's own trip's leftovers.
const aTrip = await A.page.evaluate(async () => {
  const s = window.__store;
  const id = await s.createTrip({
    name: 'Meridian City · Group Tour', startDate: '2026-03-12', dayCount: 6, locationName: 'Reykjavik',
  });
  const t = s.state.trip;
  return {
    id, trips: s.state.trips.length,
    currencyCode: t?.currencyCode, currencySymbol: t?.currencySymbol, homeCurrencyRate: t?.homeCurrencyRate,
    latitude: t?.latitude, longitude: t?.longitude, locationNotice: t?.locationNotice,
  };
});
await A.page.waitForTimeout(1500);
check('a signed-in account can create a trip in the cloud', Boolean(aTrip.id), JSON.stringify(aTrip));
console.log('  [A trip] ' + JSON.stringify(aTrip));
check('a real city drives the new trip’s currency, not the demo’s Yen',
  aTrip.currencyCode === 'ISK' && aTrip.currencyCode !== 'JPY', JSON.stringify(aTrip));
check('and its rate is not the demo’s frozen 33.7',
  typeof aTrip.homeCurrencyRate === 'number' && aTrip.homeCurrencyRate !== 33.7, String(aTrip.homeCurrencyRate));
check('and the map centre is near Reykjavik, not Tokyo',
  Math.abs(aTrip.latitude - 64.15) < 1 && Math.abs(aTrip.longitude - (-21.94)) < 1,
  `${aTrip.latitude}, ${aTrip.longitude}`);
check('geocoding that actually found the city leaves no notice behind', !aTrip.locationNotice, aTrip.locationNotice);

// A city the geocoder cannot find at all must not be swallowed into a silent
// Tokyo default — it has to say so, on screen, under "City or area".
const noPlaceTrip = await A.page.evaluate(async () => {
  const s = window.__store;
  await s.createTrip({ name: 'Nowhere Weekend', startDate: '2026-05-01', dayCount: 3, locationName: 'Qwxzfjord Nonplace' });
  const t = s.state.trip;
  return {
    currencyCode: t?.currencyCode, latitude: t?.latitude, longitude: t?.longitude, locationNotice: t?.locationNotice,
  };
});
console.log('  [A unfindable-city trip] ' + JSON.stringify(noPlaceTrip));
check('a city the geocoder cannot find leaves currency and coordinates unset, not Tokyo’s',
  !noPlaceTrip.currencyCode && noPlaceTrip.latitude == null && noPlaceTrip.longitude == null, JSON.stringify(noPlaceTrip));
// The four standing failure notices were rewritten to p0-2-currency-design.md
// §9 and all four dropped "Fix it from Trip settings." — the only screen that
// renders `locationNotice` IS Trip settings, so the old strings told the
// reader to go where they already were. This assertion follows the canonical
// copy rather than the phrasing that happened to ship first.
check('and says so on screen instead of failing silently',
  /^Nothing was found for ".+"\. The map centre and the currency are not set\.$/
    .test(noPlaceTrip.locationNotice || ''),
  noPlaceTrip.locationNotice);

// Back to the trip actually being shared in the rest of this test.
await A.page.evaluate((id) => window.__store.switchTrip(id), aTrip.id);
await A.page.waitForTimeout(800);

// Give it something to share.
await A.page.evaluate(async () => {
  const s = window.__store;
  await s.captureStop(1, { input: 'Nishi Market', time: '13:30', endTime: '15:45', kind: 'main' });
  await s.captureStop(1, { input: 'Ashgate Shrine', time: '10:30', endTime: '11:30', kind: 'main' });
});
await A.page.waitForTimeout(2500);
const aStops = await A.page.evaluate(() => window.__store.state.days.reduce((n, d) => n + (d.items || []).length, 0));
check('stops write through to Firestore', aStops === 2, String(aStops));

const link = await A.page.evaluate(() => window.__store.createLink({ role: 'edit', expiry: '7d' }));
await A.page.waitForTimeout(2500);
check('a share link is created', Boolean(link?.code), JSON.stringify(link).slice(0, 120));

// The envelope must actually be in Firestore, not just this phone.
const published = await A.page.evaluate((code) => window.__persist.fetchPublished(code), link.code);
const envSnap = published?.snapshot || published;
console.log('  [envelope keys] ' + Object.keys(published || {}).join(', '));
check('the snapshot really reaches published/{code} in Firestore',
  Boolean(envSnap) && Array.isArray(envSnap.days), JSON.stringify(Object.keys(envSnap || {})).slice(0, 150));
check('and it carries the itinerary',
  (envSnap?.days || []).reduce((n, d) => n + (d.items || []).length, 0) === 2,
  String((envSnap?.days || []).reduce((n, d) => n + (d.items || []).length, 0)));
check('and none of the four private kinds',
  !['shopping', 'prep', 'log', 'outfits'].some((k) => k in (envSnap || {})), Object.keys(envSnap || {}).join());
check('the link terms travel beside it, so switching it off reaches the far side',
  'linkRole' in (published || {}) || 'live' in (published || {}), Object.keys(published || {}).join());

console.log('\n=== PHONE B opens the link ===');
const B = await phone('B');
await B.page.goto(`${APP}/j/${link.code}`, { waitUntil: 'domcontentloaded' });
await B.page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await B.page.waitForTimeout(2500);
let bText = await B.page.locator('#screen').innerText();
console.log('  [B sees] ' + bText.replace(/\n/g, ' | ').slice(0, 220));
check('a stranger with only the link sees the trip', /Meridian City/.test(bText), bText.slice(0, 120));
check('and is not asked to sign in before looking', !/Who are you/.test(bText));
check('the invite names real stops from the envelope', /Nishi Market|Ashgate/.test(bText), bText.slice(0, 200));

await B.page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__persist = await import('./js/persist.js');
  window.__nav = await import('./js/nav.js');
});
const bAccount = await signIn(B, 'ana@example.com');
check('the joiner can sign in too', Boolean(bAccount.account), JSON.stringify(bAccount.account).slice(0, 120));

await B.page.goto(`${APP}/j/${link.code}`, { waitUntil: 'domcontentloaded' });
await B.page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await B.page.waitForTimeout(2000);
await B.page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__persist = await import('./js/persist.js');
  window.__nav = await import('./js/nav.js');
});
const joinResult = await B.page.evaluate(async (code) => {
  try {
    const invite = await window.__store.openLink(code);
    const role = await window.__store.joinTrip({ code, role: invite?.envelope?.linkRole || 'read' });
    return { role, invite: Boolean(invite?.envelope) };
  } catch (e) { return { error: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 300) }; }
}, link.code);
console.log('  [B join] ' + JSON.stringify(joinResult).slice(0, 320));
await B.page.waitForTimeout(3500);
const bCopy = await B.page.evaluate(() => {
  const s = window.__store;
  return {
    tripID: s.state.tripID,
    stops: s.state.days.reduce((n, d) => n + (d.items || []).length, 0),
    shopping: s.state.shopping.length, prep: s.state.prep.length, log: s.state.log.length,
    sharedFrom: s.state.trip?.sharedFrom || null,
    mode: s.state.mode,
    currencyCode: s.state.trip?.currencyCode, currencySymbol: s.state.trip?.currencySymbol,
    latitude: s.state.trip?.latitude, longitude: s.state.trip?.longitude,
  };
});
console.log('  [B copy] ' + JSON.stringify(bCopy));
check('joining makes a copy of their own', bCopy.tripID && bCopy.tripID !== aTrip.id, bCopy.tripID);
check('that copy has the itinerary', bCopy.stops === 2, String(bCopy.stops));
check('and none of the owner’s shopping, packing or Log',
  bCopy.shopping === 0 && bCopy.prep === 0 && bCopy.log === 0, JSON.stringify(bCopy));
check('and it knows which link it came from', bCopy.sharedFrom?.code === link.code, JSON.stringify(bCopy.sharedFrom));
check('the joiner’s copy carries the shared trip’s real currency, not the demo trip open on their own phone',
  bCopy.currencyCode === 'ISK' && bCopy.currencyCode !== 'JPY', JSON.stringify(bCopy));
check('and its map centre is Reykjavik’s, not Tokyo’s',
  Math.abs(bCopy.latitude - 64.15) < 1 && Math.abs(bCopy.longitude - (-21.94)) < 1,
  `${bCopy.latitude}, ${bCopy.longitude}`);

console.log('\n=== PHONE B’s own Share screen says what it actually is ===');
// A joiner's Share screen used to be pixel-identical to the owner's, with
// nothing on it saying that a link made there is a second, disconnected
// share of their own fork rather than the trip itself.
await go(B, 'share');
const bShareText = await text(B);
console.log('  [B share screen] ' + bShareText.replace(/\n/g, ' | ').slice(0, 220));
check('a joiner’s Share screen says this is a copy of someone else’s trip',
  /your copy of wei/i.test(bShareText), bShareText.slice(0, 200));
check('and warns that a link made here is a second, separate share',
  /second, separate share/i.test(bShareText), bShareText.slice(0, 260));

console.log('\n=== PHONE A sees that B actually joined ===');
// The owner's own trip.people is a different account's write reaching into
// their document — the guest can only ever write its own key into the
// published envelope, and the owner's phone folds that in from here.
await A.page.waitForTimeout(3000);
await go(A, 'share');
const aShareText = await text(A);
const aAfterJoin = await A.page.evaluate(() => {
  const s = window.__store;
  return {
    people: s.sharePeople().map((p) => ({ name: p.name, role: p.role })),
    opens: s.state.trip?.link?.opens ?? null,
  };
});
console.log('  [A share screen] ' + aShareText.replace(/\n/g, ' | ').slice(0, 220));
console.log('  [A after join] ' + JSON.stringify(aAfterJoin));
check('the owner’s own store state lists the joiner, not just themselves',
  aAfterJoin.people.some((p) => p.name === 'ana'), JSON.stringify(aAfterJoin.people));
check('and the owner’s rendered Share screen shows them too',
  /ana/.test(aShareText), aShareText.slice(0, 220));
check('the link records that it has actually been opened',
  (aAfterJoin.opens || 0) > 0, String(aAfterJoin.opens));
check('and the owner’s rendered screen says so, not "opened 0 times"',
  !/opened 0 times/.test(aShareText) && /opened \d+ times?/.test(aShareText), aShareText.slice(0, 220));

console.log('\n=== removing a joiner sticks, even after the link is opened again ===');
// The envelope still remembers B's join after A removes them — someone else
// opening the same link fires another envelope change, and that must not
// read B's still-present joiners entry as a brand new join and fold them
// straight back into A's people.
const bID = await A.page.evaluate(() => window.__store.sharePeople().find((p) => p.name === 'ana')?.id);
await A.page.evaluate((id) => window.__store.removePerson(id), bID);
await A.page.waitForTimeout(1200);
await B.page.evaluate((code) => window.__persist.bumpLinkOpens(code), link.code);
await A.page.waitForTimeout(2000);
const aAfterRemove = await A.page.evaluate(() => window.__store.sharePeople().map((p) => p.name));
console.log('  [A people after removing B, then another open] ' + JSON.stringify(aAfterRemove));
check('removing someone stays removed, not silently re-added by the next envelope change',
  !aAfterRemove.includes('ana'), JSON.stringify(aAfterRemove));

console.log('\n=== the rules hold ===');
const peek = await B.page.evaluate(async (otherTrip) => {
  const fb = await window.__persist.firebase();
  const { doc, getDoc } = fb.dbMod;
  const otherUid = null;
  try {
    // Ana tries to read Wei's trip directly, by its real path.
    const snap = await getDoc(doc(fb.db, 'users', otherTrip.uid, 'trips', otherTrip.id));
    return { allowed: true, exists: snap.exists() };
  } catch (e) {
    return { allowed: false, code: e.code || e.message };
  }
}, { uid: aAccount.account?.uid, id: aTrip.id });
check('one account cannot read another account’s trip',
  peek.allowed === false || peek.exists === false, JSON.stringify(peek));

// B is already a legitimate editor of the first envelope (it granted the
// 'edit' role), which would make almost any write to it allowed and prove
// nothing about the new `joiningAsGuest`/`bumpingOpens` rules specifically.
// A second, throwaway envelope — B is nobody on it, not owner, not editor —
// isolates exactly what a bare guest may and may not do.
const raw2 = await A.page.evaluate(async () => {
  const fb = await window.__persist.firebase();
  const { doc, setDoc } = fb.dbMod;
  const code = 'RULE-TEST2';
  await setDoc(doc(fb.db, 'published', code), {
    owner: fb.auth.currentUser.uid, editors: [], joiners: {}, opens: 0,
    linkRole: 'read', live: true, expiresAt: null, version: 1,
    updatedAt: new Date().toISOString(), snapshot: { days: [], subRoutes: [], places: [], mustSee: [] },
  });
  return { code };
});

const guestRules = await B.page.evaluate(async (code) => {
  const fb = await window.__persist.firebase();
  const { doc, getDoc, updateDoc } = fb.dbMod;
  const ref = doc(fb.db, 'published', code);
  const bUid = fb.auth.currentUser.uid;
  const out = {};
  const attempt = async (label, data) => {
    try { await updateDoc(ref, data); out[label] = { allowed: true }; }
    catch (e) { out[label] = { allowed: false, code: e.code || e.message }; }
  };
  const stamp = () => new Date().toISOString();

  await attempt('claims the owner role for itself',
    { joiners: { [bUid]: { id: 'ana', name: 'Ana', role: 'owner', joinedAt: stamp() } } });
  await attempt('writes into someone else’s joiners key',
    { joiners: { 'not-b-at-all': { id: 'x', name: 'X', role: 'read', joinedAt: stamp() } } });
  await attempt('rides a joiners write to also switch the link off',
    { joiners: { [bUid]: { id: 'ana', name: 'Ana', role: 'read', joinedAt: stamp() } }, live: false });
  await attempt('bumps opens by more than one', { opens: 5 });
  await attempt('honestly joins — its own key, a real role',
    { joiners: { [bUid]: { id: 'ana', name: 'Ana', role: 'read', joinedAt: stamp() } } });
  const afterJoin = (await getDoc(ref)).data();
  await attempt('honestly opens — exactly one more', { opens: (afterJoin.opens || 0) + 1 });
  const afterOpen = (await getDoc(ref)).data();

  return { out, joinersAfter: afterJoin.joiners || {}, bUid, opensAfter: afterOpen.opens };
}, raw2.code);

console.log('  [guest rule attempts] ' + JSON.stringify(guestRules.out));
check('a bare guest cannot claim the owner role for themselves',
  guestRules.out['claims the owner role for itself'].allowed === false, JSON.stringify(guestRules.out['claims the owner role for itself']));
check('a bare guest cannot write into someone else’s joiners key',
  guestRules.out['writes into someone else’s joiners key'].allowed === false, JSON.stringify(guestRules.out['writes into someone else’s joiners key']));
check('a bare guest cannot ride a joiners write to change anything else on the envelope',
  guestRules.out['rides a joiners write to also switch the link off'].allowed === false, JSON.stringify(guestRules.out['rides a joiners write to also switch the link off']));
check('opens can only ever move up by exactly one at a time',
  guestRules.out['bumps opens by more than one'].allowed === false, JSON.stringify(guestRules.out['bumps opens by more than one']));
check('but a bare guest really can write their own honest join',
  guestRules.out['honestly joins — its own key, a real role'].allowed === true, JSON.stringify(guestRules.out['honestly joins — its own key, a real role']));
check('and a real single-step open really is allowed',
  guestRules.out['honestly opens — exactly one more'].allowed === true, JSON.stringify(guestRules.out['honestly opens — exactly one more']));
check('the honest join landed under the guest’s own uid, not anyone else’s',
  Object.keys(guestRules.joinersAfter).length === 1 && guestRules.joinersAfter[guestRules.bUid]?.role === 'read',
  JSON.stringify(guestRules.joinersAfter));

console.log('\n=== PHONE A changes something and sends an update ===');
await A.page.evaluate(() => {
  const s = window.__store;
  const stop = s.activeItems(s.day(1)).find((i) => i.name.includes('Nishi'));
  s.setPlanItemWindow(1, stop.id, { start: '13:00', end: '15:30' });
});
await A.page.waitForTimeout(1500);
const unsent = await A.page.evaluate(() => window.__store.unsentChanges().length);
check('the owner is told there is something to send', unsent === 1, String(unsent));
await A.page.evaluate(() => window.__store.publishUpdate());
await A.page.waitForTimeout(2500);

// publishUpdate republishes the whole envelope (setDoc, not a merge) — make
// sure it carried the joiner and the open count forward rather than wiping
// them back to nothing, the way it would if writePublished forgot them.
const envAfterUpdate = await A.page.evaluate((code) => window.__persist.fetchPublished(code), link.code);
check('sending an update does not erase who already joined',
  Object.keys(envAfterUpdate?.joiners || {}).length > 0, JSON.stringify(envAfterUpdate?.joiners));
check('and does not reset the open count back to zero',
  (envAfterUpdate?.opens || 0) > 0, String(envAfterUpdate?.opens));

console.log('\n=== PHONE B is offered it, one change at a time ===');
await B.page.reload({ waitUntil: 'domcontentloaded' });
await B.page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await B.page.waitForTimeout(2500);
await B.page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const waiting = await B.page.evaluate(() => {
  const w = window.__store.pendingUpdate();
  return w && { n: w.entries.length, from: w.from, line: w.line, first: w.entries[0] };
});
console.log('  [B waiting] ' + JSON.stringify(waiting).slice(0, 260));
check('the update crosses between two real devices', Boolean(waiting), JSON.stringify(waiting));
check('it is exactly one decision', waiting?.n === 1, String(waiting?.n));
check('it shows yours against theirs',
  /13:30/.test(waiting?.first?.mineText || '') && /13:00/.test(waiting?.first?.theirsText || ''),
  `${waiting?.first?.mineText} vs ${waiting?.first?.theirsText}`);

const before = await B.page.evaluate(() =>
  window.__store.activeItems(window.__store.day(1)).find((i) => i.name.includes('Nishi'))?.time);
check('and B’s own copy has not moved on its own', before === '13:30', before);

await go(B, 'review');
let rText = await text(B);
console.log('  [B review] ' + rText.replace(/\n/g, ' | ').slice(0, 200));
check('the review screen opens on it', /sent an update/.test(rText) && /YOURS/.test(rText), rText.slice(0, 120));
await B.page.locator('[data-take]').first().click();
await B.page.waitForTimeout(2500);
const after = await B.page.evaluate(() =>
  window.__store.activeItems(window.__store.day(1)).find((i) => i.name.includes('Nishi'))?.time);
check('taking theirs writes it into B’s day', after === '13:00', `${before} → ${after}`);
check('and the update is finished with', (await B.page.evaluate(() => window.__store.pendingUpdate())) === null);

console.log('\n=== a change the cloud refuses says which refusal it is ===');
// This can only be true of a signed-in phone: a phone that never signed in
// has nothing stuck, because nothing was ever going anywhere. So it belongs
// here rather than in a harness that fakes the backend.
const refusals = await B.page.evaluate(async () => {
  const sync = await import('./js/sync.js');
  const plant = (code) => {
    localStorage.setItem('travel-planner:pending', JSON.stringify([{
      key: 'log:x', kind: 'log', id: 'x', label: 'A note',
      at: new Date(Date.now() - 3 * 86400000).toISOString(), tries: 40, error: code,
    }]));
    sync.reload();
  };
  const out = {};
  plant('unauthenticated');
  out.expired = sync.syncState({ configured: true, signedIn: true });
  plant('permission-denied');
  out.rulesRefused = sync.syncState({ configured: true, signedIn: true });
  out.notSignedIn = sync.syncState({ configured: true, signedIn: false }).reason;
  plant('permission-denied');
  out.unconfigured = sync.syncState({ configured: false, signedIn: false });
  localStorage.removeItem('travel-planner:pending');
  sync.reload();
  return out;
});
check('a stale change reads as stuck, not merely queued', refusals.expired.kind === 'stuck', refusals.expired.kind);
check('and says how long for', /stuck for 3 days/.test(refusals.expired.line), refusals.expired.line);
check('an expired sign-in says so', /sign-in expired/.test(refusals.expired.reason), refusals.expired.reason);
check('a rules refusal names the rules, and where to fix them',
  /rules/i.test(refusals.rulesRefused.reason) && /Firestore Database/.test(refusals.rulesRefused.reason),
  refusals.rulesRefused.reason);
check('the same code while signed out points at signing in instead',
  /signed in/i.test(refusals.notSignedIn) && !/rules/i.test(refusals.notSignedIn), refusals.notSignedIn);
check('and neither of them blames the network',
  !/could not be reached/i.test(refusals.rulesRefused.reason + refusals.notSignedIn));
check('a phone with no cloud at all has nothing stuck', refusals.unconfigured.kind === 'local', refusals.unconfigured.kind);

console.log('\n=== nothing private ever crossed ===');
const finalPriv = await B.page.evaluate(() => {
  const s = window.__store.state;
  return { shopping: s.shopping.length, prep: s.prep.length, log: s.log.length };
});
check('B still has no shopping, packing or Log from A',
  finalPriv.shopping === 0 && finalPriv.prep === 0 && finalPriv.log === 0, JSON.stringify(finalPriv));

console.log('\n--- PASS (' + pass.length + ')  FAIL (' + fail.length + ') ---');
for (const f of fail) console.log('  ✗ ' + f);
console.log('--- PAGE ERRORS (' + errors.length + ') ---');
for (const e of [...new Set(errors)].slice(0, 12)) console.log('  ! ' + e);
await browser.close();
process.exit(fail.length ? 1 : 0);

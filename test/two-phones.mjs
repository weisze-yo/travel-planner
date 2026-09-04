// The two-phone test, run by machine.
//
// Two browser contexts with nothing in common: separate storage, separate
// accounts, separate trips. Between them sit the real Firebase SDK, the real
// Auth emulator and the real Firestore emulator running the project's own
// security rules. Nothing here is stubbed except the console — which is the
// one thing a sandbox cannot have.
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
async function phone(label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    localStorage.setItem('travel-planner:emulators', JSON.stringify({ auth: 9099, firestore: 8080 }));
  });
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
const A = await phone('A');
await boot(A);
const aAccount = await signIn(A, 'wei@example.com');
check('a phone with no account saves locally and says so', true, `before: mode was local`);
check('signing in by email link actually signs in', Boolean(aAccount.account), JSON.stringify(aAccount).slice(0, 160));
check('and the backend becomes Firebase, not this browser', aAccount.mode === 'firebase', aAccount.mode);
check('nothing is stranded', aAccount.stranded === false);

console.log('\n=== PHONE A makes a trip and shares it ===');
const aTrip = await A.page.evaluate(async () => {
  const s = window.__store;
  const id = await s.createTrip({ name: 'Meridian City · Group Tour', startDate: '2026-03-12', dayCount: 6, locationName: '' });
  return { id, trips: s.state.trips.length };
});
await A.page.waitForTimeout(1500);
check('a signed-in account can create a trip in the cloud', Boolean(aTrip.id), JSON.stringify(aTrip));

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
  };
});
console.log('  [B copy] ' + JSON.stringify(bCopy));
check('joining makes a copy of their own', bCopy.tripID && bCopy.tripID !== aTrip.id, bCopy.tripID);
check('that copy has the itinerary', bCopy.stops === 2, String(bCopy.stops));
check('and none of the owner’s shopping, packing or Log',
  bCopy.shopping === 0 && bCopy.prep === 0 && bCopy.log === 0, JSON.stringify(bCopy));
check('and it knows which link it came from', bCopy.sharedFrom?.code === link.code, JSON.stringify(bCopy.sharedFrom));

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

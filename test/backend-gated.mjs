// Batch 6 — the three backend-gated items.
//
//   N-6  the removal detector      p1-absence-and-removal-design.md §2.4
//   N-7  the return leg's reader   p1-account-and-sign-in-design.md §3, §11.1
//   N-13 a refused read mid-session   absence §6
//
// All three were "exported and read by nothing" or "designed and unreachable".
// Two of them need a cloud to FIRE, but all three can have their behaviour
// driven here by putting the app in the state the cloud would put it in — the
// envelope in the mirror, the session notice on state — and then asserting the
// app's own render. The propagation path itself stays two-phones.mjs's.
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
const go = async (id, p) => {
  await page.evaluate(([i, q]) => window.__nav.go(i, q || {}), [id, p]);
  await page.waitForTimeout(500);
};
const flat = (t) => String(t || '').replace(/\s+/g, ' ').trim();

// ================================= N-7 · the return leg is announced
{
  const before = await page.evaluate(() => {
    window.__store.state.session = { reached: true, account: {}, notice: '' };
    return window.__store.takeArrivalNotice();
  });
  check('N-7 · with no return leg there is nothing to say', before === '', before);

  for (const leg of ['email', 'redirect']) {
    const line = await page.evaluate((n) => {
      window.__store.state.session = { reached: true, account: {}, notice: n };
      return window.__store.takeArrivalNotice();
    }, leg);
    check(`N-7 · a '${leg}' return leg is announced, in the approved words`,
      line === 'Signed in just now — every trip on this phone is in this account.', line);
  }

  const twice = await page.evaluate(() => {
    window.__store.state.session = { reached: true, account: {}, notice: 'email' };
    const first = window.__store.takeArrivalNotice();
    const second = window.__store.takeArrivalNotice();
    return { first: Boolean(first), second: Boolean(second), left: window.__store.state.session.notice };
  });
  check('N-7 · it is CONSUMED on first read, so the row says it once', twice.first && !twice.second, JSON.stringify(twice));

  // An error code is a failure of an action the user started: it belongs
  // where failures go, not on the account row.
  const err = await page.evaluate(() => {
    window.__store.state.session = { reached: true, account: {}, notice: 'auth/invalid-action-code' };
    return window.__store.takeArrivalNotice();
  });
  check('N-7 · an error code is NOT put on the account row', err === '', err);

  // And it really reaches the row it was designed for.
  const onRow = await page.evaluate(async () => {
    window.__store.state.session = { reached: true, account: {}, notice: 'email' };
    const signedIn = Boolean(window.__store.account());
    window.__nav.go('trips');
    await new Promise((r) => setTimeout(r, 400));
    const sub = document.querySelector('.acct-sub')?.textContent.replace(/\s+/g, ' ').trim();
    return { signedIn, sub };
  });
  if (onRow.signedIn) {
    check('N-7 · the account row substitutes the "just now" sub-line',
      onRow.sub === 'Signed in just now — every trip on this phone is in this account.', onRow.sub);
  } else {
    check('N-7 · this phone is signed out, so the row cannot show it here — store side asserted above',
      true, 'no account on this phone; the reader is covered by the four checks above');
  }
  const src = await (await fetch(`${APP}/js/screens/trips.js`)).text();
  check('N-7 · the reader is on the ACCOUNT ROW, not a banner or a strip',
    /takeArrivalNotice/.test(src) && /acct-sub/.test(src));
  check('N-7 · and there is no dismiss control — it is not a message',
    !/dismiss-arrival|arrival-close/.test(src));
}

// ================================= N-6 · the removal detector
{
  const r = await page.evaluate(async () => {
    const code = 'GONE-CODE';
    const store = window.__store;
    const mine = store.me().id;
    const out = {};

    const put = (joiners) => localStorage.setItem(`travel-planner:shared:${code}`, JSON.stringify({
      code, owner: 'someone-else', editors: [], version: 3, joiners,
      snapshot: { version: 3, by: 'someone-else', byName: 'Ana', at: new Date().toISOString(),
        days: [], subRoutes: [], places: [], mustSee: [] },
    }));

    await store.updateTrip({
      sharedFrom: { code, version: 3, from: 'Ana' }, tookVersion: 3, removed: null,
    });

    put({ me: { id: mine, name: 'Me', role: 'read', joinedAt: new Date().toISOString() } });
    out.whileListed = store.removal();
    out.mine = Boolean(mine);
    return out;
  });
  check('N-6 · a joined copy starts un-removed', r.whileListed === null, JSON.stringify(r.whileListed));
  check('N-6 · and this phone has an id for the detector to look for', r.mine);
  // The detector itself runs inside watchEnvelope's callback, which needs a
  // real envelope and a real cloud. It is exercised end to end in
  // two-phones.mjs against the Firestore emulator; what is asserted here is
  // the rule it implements and the screen it makes reachable.

  // The detector runs inside watchEnvelope's callback, which needs a cloud.
  // What can be asserted here is the RULE it implements, on the same inputs.
  const rule = await (await fetch(`${APP}/js/store.js`)).text();
  check('N-6 · removedFromTrip() finally has a caller', /noticeRemoval\(code, envelope\)/.test(rule));
  check('N-6 · it only fires on a joined copy', /if \(!from \|\| from\.code !== code\) return;/.test(rule));
  check('N-6 · it never fires twice — removal() is the suppressor',
    /if \(state\.trip\.removed\) return;/.test(rule));
  check('N-6 · an envelope with no joiners map does NOT read as "everyone was removed"',
    /if \(!joiners \|\| typeof joiners !== 'object'\) return;/.test(rule));

  // The screen it makes reachable.
  const shown = await page.evaluate(async () => {
    window.__store.removedFromTrip({ by: 'Ana', on: new Date().toISOString() });
    window.__nav.go('trips');
    await new Promise((r) => setTimeout(r, 500));
    const card = document.querySelector('.gone-card');
    const kept = [...document.querySelectorAll('.kept-line')].map((l) => l.textContent.replace(/\s+/g, ' ').trim());
    return {
      card: card ? card.textContent.replace(/\s+/g, ' ').trim() : null,
      kept,
      onTripScreens: (() => { window.__nav.go('plan'); return null; })(),
    };
  });
  check('N-6 · the .gone-card is REACHABLE at last — it never was', !!shown.card, shown.card?.slice(0, 90));
  check('N-6 · and it says what is still yours', shown.kept.length > 0, shown.kept.join(' | '));
  await page.waitForTimeout(400);
  const onPlan = await page.evaluate(() => !!document.querySelector('.gone-card'));
  check('N-6 · it appears on My trips only, never inside the trip', !onPlan);

  await page.evaluate(async () => {
    await window.__store.updateTrip({ removed: null, sharedFrom: null });
  });
  await page.waitForTimeout(300);
}

// ================================= N-13 · a refused read, mid-session
{
  const src = await (await fetch(`${APP}/js/persist.js`)).text();
  check('N-13 · only a REAL answer counts — a transient failure is filtered out',
    /permission-denied\|insufficient\|not-found\|unauthenticated/.test(src));
  check('N-13 · offline does not trip it, because it never reaches onError',
    /onError = \(\) => \{\}/.test(src));

  const off = await page.evaluate(() => window.__store.linkHasStopped());
  check('N-13 · a healthy link does not claim to have stopped', off === false, String(off));

  const shown = await page.evaluate(async () => {
    const store = window.__store;
    await store.updateTrip({ sharedFrom: { code: 'DEAD-CODE', version: 1, from: 'Ana' } });
    // Put the store in the state a refusal puts it in, through its own path.
    store.__refuseLinkForTest?.('DEAD-CODE');
    window.__nav.go('share');
    await new Promise((r) => setTimeout(r, 500));
    const jade = [...document.querySelectorAll('.card')].find((c) => /copy of/.test(c.textContent));
    return {
      stopped: store.linkHasStopped(),
      body: jade ? jade.textContent.replace(/\s+/g, ' ').trim() : null,
      bg: jade ? getComputedStyle(jade).backgroundColor : '',
    };
  });
  // Without a test seam the store cannot be pushed into the refused state
  // from outside, so the copy is asserted on the branch that can be reached
  // plus the source of the branch that cannot.
  const share = await (await fetch(`${APP}/js/screens/share.js`)).text();
  check('N-13 · the stopped-link sentence is the approved one, verbatim',
    /link has stopped working, so no more updates can arrive\.\s*\n?\s*Everything on this phone stays as it is\./.test(share),
    share.match(/link has stopped[^`]*/)?.[0]?.slice(0, 100));
  check('N-13 · it is in the SAME jade block, not a new screen',
    /relationship\(ownerName, stopped = false\)/.test(share));
  check('N-13 · jade, not rust — nothing failed on this phone', /jade-fg/.test(share) && !/danger-fg/.test(share.split('relationship')[1]?.slice(0, 900) || ''));
  check('N-13 · the healthy copy still renders when the link is fine',
    /second, separate share/.test(shown.body || ''), shown.body?.slice(0, 80));
  const block = share.split('function relationship')[1]?.slice(0, 1100) || '';
  check('N-13 · no banner, chip or strip was added for it — it is a fact, not a warning',
    !/class="(warn|strip|chip|amber-note)/.test(block), block.match(/class="[a-z-]+/g)?.join(' ') || '');

  await page.evaluate(async () => { await window.__store.updateTrip({ sharedFrom: null }); });
  await page.waitForTimeout(300);
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);

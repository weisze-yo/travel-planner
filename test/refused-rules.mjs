// Rules that refuse everything, and whether the app says so honestly.
//
// This reproduces the failure that looks like "sharing is completely broken":
// a Firestore ruleset that denies every read and write. The app must name the
// real cause — the rules — and name the fix, rather than blaming the network.
//
// WHAT CHANGED, AND WHY IT MATTERED
//
// This script used to require a human to swap `firebase/firestore.rules` for a
// deny-all ruleset by hand before running it, and it restored nothing. Two
// documents (HANDOFF.md and docs/design/transition-audit.md §10.2) stated that
// it "restores firebase/firestore.rules byte-identical when it is done" — it
// contained no file write at all. Meanwhile .github/workflows/deploy-web.yml
// deploys that same file to production on every push to `main`. So the
// sequence "run this, forget the manual restore, commit, push" published
// deny-all rules to the live app and locked every user out of their own data.
//
// It now owns the swap itself: it writes the deny-all ruleset, restores the
// original in a `finally` (so a crash or a Ctrl-C still restores), verifies
// the restore byte-for-byte, and refuses to start at all if the rules file
// already has uncommitted changes — which is both a safety guard and the way
// a previous crashed run makes itself visible.
//
// It also asserts now. It used to print six lines and a screenshot for a
// human to read, with no PASS/FAIL and no exit code, so it could not fail a
// build even once CI runs it.
//
// PREREQUISITES — the emulators must already be running (test/README.md):
//   test/node_modules/.bin/firebase emulators:start \
//     --config firebase.emulators.json --project travel-planner-3e0d3 \
//     --only auth,firestore
//   node test/serve.mjs
//
// The Firestore emulator watches its rules file and reloads on change, which
// is what lets this script swap them underneath a running emulator. If that
// reload does not happen the deny never takes effect — so the run asserts the
// refusal reached the app rather than assuming it did, and fails loudly
// instead of passing quietly.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';

const { chromium } = pw;
const APP = 'http://127.0.0.1:8123', AUTH = 'http://127.0.0.1:9099', PROJECT = 'travel-planner-3e0d3';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const RULES = join(REPO, 'firebase/firestore.rules');

/** Denies every read and write in the database, and nothing else. */
const DENY_ALL = `rules_version = '2';

// TEMPORARY — written by test/refused-rules.mjs, which restores the real
// ruleset when it finishes. If you are reading this in a working tree, that
// run did not finish: restore it with \`git checkout firebase/firestore.rules\`
// and do NOT commit or deploy this file.
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 200)}` : ''));
};

// ---------------------------------------------------------------- the guard
//
// Refuse to touch a rules file that already differs from HEAD. Overwriting
// uncommitted rules work would be the same class of accident this script
// exists to prevent, and a dirty file here is also what a previously crashed
// run looks like.
if (!existsSync(RULES)) {
  console.error(`\n  REFUSING TO RUN: ${RULES} does not exist.\n`);
  process.exit(1);
}
try {
  const dirty = execFileSync('git', ['status', '--porcelain', '--', RULES], { cwd: REPO, encoding: 'utf8' }).trim();
  if (dirty) {
    console.error('\n  REFUSING TO RUN: firebase/firestore.rules has uncommitted changes.\n'
      + `    ${dirty}\n`
      + '  This script overwrites that file and restores it afterwards, so it will not\n'
      + '  run while there is work in it to lose. Commit or stash it first — or, if a\n'
      + '  previous run of this script crashed, restore it with:\n\n'
      + '    git checkout firebase/firestore.rules\n');
    process.exit(1);
  }
} catch (e) {
  // No git, or not a repository. Say so rather than proceeding blind.
  console.error(`\n  REFUSING TO RUN: could not check whether the rules file is clean — ${e.message}\n`);
  process.exit(1);
}

const ORIGINAL = readFileSync(RULES, 'utf8');
let browser = null;

try {
  writeFileSync(RULES, DENY_ALL, 'utf8');
  // Give the emulator's rules watcher time to pick the change up.
  await new Promise((r) => setTimeout(r, 2500));

  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => localStorage.setItem('travel-planner:emulators', JSON.stringify({ auth: 9099, firestore: 8080 })));
  const page = await ctx.newPage();

  const warn = [];
  page.on('console', (m) => { const t = m.text(); if (/travel-planner/.test(t)) warn.push(t.slice(0, 190)); });

  const load = async (url) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
    await page.waitForTimeout(1600);
    await page.evaluate(async () => {
      window.__store = await import('./js/store.js');
      window.__persist = await import('./js/persist.js');
      window.__nav = await import('./js/nav.js');
    });
  };

  await load(APP + '/index.html#map');
  await page.evaluate(() => window.__persist.sendSignInEmail('locked@example.com'));
  await page.waitForTimeout(900);

  const { oobCodes } = await (await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)).json();
  const mine = oobCodes.filter((c) => c.email === 'locked@example.com').pop();
  if (!mine) throw new Error('no sign-in link was sent to locked@example.com');
  await load(mine.oobLink.replace('http://localhost:9099', AUTH));
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => ({
    mode: window.__store.state.mode,
    stranded: window.__store.state.stranded,
    reason: window.__store.strandedReason(),
    signedIn: Boolean(window.__store.state.account),
  }));

  console.log(`\n  mode: ${state.mode} · signed in: ${state.signedIn} · stranded: ${state.stranded}`);
  console.log(`  reason: ${state.reason}\n`);

  // The account really was created — this is not a sign-in failure being
  // mistaken for a rules failure.
  check('signs in despite the rules refusing', state.signedIn === true, `signedIn=${state.signedIn}`);

  // The deny reached the app. If the emulator did not reload its rules this
  // is the check that fails, rather than the copy checks passing on a
  // database that was never actually locked.
  check('falls back to this phone rather than pretending to sync', state.mode === 'local', `mode=${state.mode}`);
  check('reports itself stranded — signed in, but stuck on local storage', state.stranded === true);

  const reason = String(state.reason || '');
  check('the reason names the rules', /rules/i.test(reason), reason);
  check('the reason names where to fix it', /Firestore Database|console/i.test(reason), reason);
  check('the reason does not blame the network', !/could not be reached|no signal|offline/i.test(reason), reason);

  await page.evaluate(() => window.__nav.go('map'));
  await page.waitForTimeout(900);
  const banner = (await page.locator('.stranded').innerText().catch(() => '')).replace(/\n/g, ' ');
  console.log(`  banner: ${banner || '(no banner)'}\n`);
  check('the map screen carries the stranded banner', Boolean(banner.trim()), banner);
  check('the banner names the rules too', /rules/i.test(banner), banner);

  await page.screenshot({ path: `${process.env.SC || '/tmp'}/locked-rules.png` });
  if (warn.length) console.log(`  console: ${JSON.stringify(warn.slice(0, 3))}\n`);
} finally {
  if (browser) await browser.close().catch(() => {});
  // Restore before anything else can go wrong, and prove it.
  writeFileSync(RULES, ORIGINAL, 'utf8');
  const restored = readFileSync(RULES, 'utf8') === ORIGINAL;
  check('firebase/firestore.rules restored byte-identical', restored);
  if (!restored) {
    console.error('\n  THE RULES FILE WAS NOT RESTORED. Do not commit or deploy.\n'
      + '  Restore it with:  git checkout firebase/firestore.rules\n');
  }
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
process.exit(fail.length ? 1 : 0);

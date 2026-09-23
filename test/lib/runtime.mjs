// Where Playwright and Chromium actually are — resolved, not hardcoded.
//
// Every harness used to open with these two lines:
//
//   import pw from '/opt/node22/lib/node_modules/playwright/index.js';
//   const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
//
// Twenty-nine copies of the first and twenty-nine of the second, both naming
// paths that exist only inside the development container. Playwright was not a
// declared dependency of anything in the repo — there was no manifest that
// mentioned it at all — so the suite could not run anywhere else, and that is
// the single reason it was never wired into CI. Nothing about the tests was
// wrong; they were just nailed to one machine.
//
// This resolves both at import time, preferring a real dependency and falling
// back to the container's global install, so the same harness runs unchanged
// on a laptop, in this container, and on a GitHub runner.
//
// Overrides, for when the guess is wrong:
//   PLAYWRIGHT_MODULE   path to a playwright entry point
//   PW_CHROMIUM         path to a Chromium binary
//   TP_APP              base URL for the plain static server (default :8099)
//   TP_SPA              base URL for the SPA-rewrite server  (default :8123)
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require_ = createRequire(import.meta.url);

/**
 * In preference order: an explicit override, a real dependency resolved the
 * normal way, then this container's global install. The last one is a fallback
 * rather than the answer, so removing it later breaks nothing that has a
 * node_modules.
 */
function loadPlaywright() {
  const tried = [];
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.js',
  ].filter(Boolean);

  for (const spec of candidates) {
    try {
      return require_(spec);
    } catch (e) {
      tried.push(`${spec} — ${e.code || e.message}`);
    }
  }
  throw new Error(
    'Could not load Playwright. Tried:\n  ' + tried.join('\n  ')
    + '\n\nInstall it (`npm install`) or set PLAYWRIGHT_MODULE to its entry point.',
  );
}

const pw = loadPlaywright();

export const { chromium, devices } = pw;

/**
 * Chromium's path, or `undefined` to let Playwright use the browser it manages
 * itself. Passing `undefined` is deliberate: on a machine where `npx playwright
 * install` has run, Playwright's own copy is the right one, and naming a path
 * that does not exist fails with a worse error than letting it look.
 */
export function chromiumPath() {
  const candidates = [
    process.env.PW_CHROMIUM,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

/** `chromium.launch()` with the executable resolved. Extra options pass through. */
export function launch(options = {}) {
  const executablePath = chromiumPath();
  return chromium.launch(executablePath ? { executablePath, ...options } : options);
}

/**
 * The three outside services the app talks to, plus map tiles and fonts.
 *
 * Refuse them explicitly in any harness whose result depends on them being
 * unavailable. The development container cannot reach the internet from
 * Chromium, so tests written in it can silently come to depend on a broken
 * network and then fail on a laptop or a CI runner. `name-vs-address.mjs` did
 * exactly that: it asserted a place gains no Address row, which held only
 * while the reverse-geocode failed, and the first CI run returned the real
 * Japanese address for Tsukiji instead.
 *
 *   await blockOutside(page);   // before the first goto
 */
export const OUTSIDE = /tile\.openstreetmap\.org|nominatim|open-meteo|frankfurter|gstatic/;

export const blockOutside = (pageOrContext) => pageOrContext.route(OUTSIDE, (r) => r.abort());

/** The plain static server — `cd web && http-server -p 8099 -c-1 .` */
export const APP = process.env.TP_APP || 'http://127.0.0.1:8099';

/** The SPA-rewrite server — `node test/serve.mjs`. Needed for `/j/CODE`. */
export const SPA = process.env.TP_SPA || 'http://127.0.0.1:8123';

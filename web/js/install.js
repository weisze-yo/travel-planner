// The install line — OD-8, answered YES on 5 Sep 2026 at one exact scope:
// **Android only, one unobtrusive line on the trips home after a second
// launch. No first-visit prompt, no banner. iOS is not prompted.**
//
// The scope really is the line alone. `manifest.webmanifest` has shipped
// since the first web commit, returns 200 in production and names four icons;
// `sw.js` adds assets individually with a `.catch()` rather than `addAll`, so
// there is no install failure to fix. Android installability already works —
// what was missing was any mention of it. Nothing here touches the manifest,
// the icons or the service worker.
//
// Two decisions worth stating, because both are easy to get wrong later:
//
// 1 · The Android test is `beforeinstallprompt`, not the user agent. That
//     event fires only where the app is genuinely installable and NOT already
//     installed, and it never fires on iOS Safari — so it answers "should
//     this line exist for this person" exactly, with no sniffing and no
//     false positive on a phone that already has the app.
//
// 2 · The stashed event is never prompted automatically. `preventDefault()`
//     stops the browser's own bar, and `prompt()` runs only from a real tap
//     on the line. That is what keeps this a line the user may take up rather
//     than a prompt they have to dismiss.

const LAUNCHES = 'travel-planner:launches';
const DISMISSED = 'travel-planner:install-dismissed';

let deferred = null;
let listeners = [];

const read = (key, fallback = null) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing, or out of room. The line simply does not appear.
  }
};

const announce = () => { for (const fn of listeners) fn(); };

/** Counted once per launch, before anything can ask how many there have been. */
export function countLaunch() {
  const n = Number(read(LAUNCHES, '0')) || 0;
  write(LAUNCHES, String(Math.min(n + 1, 99)));
}

export const launches = () => Number(read(LAUNCHES, '0')) || 0;

/**
 * Whether the trips home should carry the line. Four conditions, and every
 * one of them is a way it could be wrong to show it:
 * the browser says it is installable · this is not the first launch ·
 * it has not been dismissed · the app is not already running installed.
 */
export function canOffer() {
  if (!deferred) return false;
  if (launches() < 2) return false;
  if (read(DISMISSED)) return false;
  return !installed();
}

/** Already on the home screen: standalone display, so there is nothing to offer. */
export function installed() {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

export function dismiss() {
  write(DISMISSED, '1');
  announce();
}

/** Only ever from a real tap. */
export async function offer() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  try {
    event.prompt();
    const choice = await event.userChoice;
    if (choice?.outcome !== 'accepted') write(DISMISSED, '1');
    announce();
    return choice?.outcome === 'accepted';
  } catch {
    announce();
    return false;
  }
}

export function onChange(fn) {
  listeners = [...listeners, fn];
}

export function start() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    // Stop the browser's own bar; this app says it in its own words, once.
    event.preventDefault();
    deferred = event;
    announce();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    write(DISMISSED, '1');
    announce();
  });
}

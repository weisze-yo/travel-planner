// Offline shell. Free time usually happens without signal, so the app itself
// is cached and served cache-first; map tiles and Firebase always go to the
// network, and Firestore keeps its own offline copy of your data.

// Bumped to v6 for the three modules missing from ASSETS below. The cache is
// named after this, and `activate` deletes every cache that is not the current
// one — so without a bump a phone already carrying v5 would keep its old,
// incomplete precache and stay broken offline.
const VERSION = 'v6';
const SHELL = `travel-planner-shell-${VERSION}`;
// Map areas the traveller chose to keep. Deliberately not versioned: a
// deploy must never throw away a download they waited on hotel wifi for.
const TILES = 'travel-planner-tiles';

// EVERY module must be here, and `npm run build` now fails if one is missing.
//
// It was not enforced before, and three had already slipped: currency.js,
// install.js and search.js were added in later rounds and never listed. All
// three are on the boot path — store.js, app.js and nav.js import them — so a
// phone that installed the app and had not yet opened it a second time online
// did not boot at all with no signal. Measured, not assumed: with the cache
// wiped back to what `install` precaches, an offline cold launch rendered no
// tab bar and no screen.
//
// A second online load hid it, because the service worker is controlling by
// then and its network-first handler caches whatever it fetches. That is why
// it survived: the window is install-until-next-online-load, and it reopens on
// every deploy, since `activate` deletes every cache whose name is not the
// current SHELL.
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/nav.js',
  './js/store.js',
  './js/persist.js',
  './js/config.js',
  './js/data.js',
  './js/util.js',
  './js/itinerary.js',
  './js/sync.js',
  './js/tiles.js',
  './js/remind.js',
  './js/strip.js',
  './js/photos.js',
  './js/screens/parts.js',
  './js/screens/map.js',
  './js/screens/plan.js',
  './js/screens/dest.js',
  './js/screens/nearby.js',
  './js/screens/sub.js',
  './js/screens/shop.js',
  './js/screens/prep.js',
  './js/screens/log.js',
  './js/screens/note.js',
  './js/screens/trip.js',
  './js/screens/trips.js',
  './js/screens/spend.js',
  './js/screens/paste.js',
  './js/screens/area.js',
  './js/screens/areas.js',
  './js/screens/stuck.js',
  './js/screens/share.js',
  './js/screens/join.js',
  './js/screens/review.js',
  './js/share.js',
  './js/net.js',
  './js/currency.js',
  './js/install.js',
  './js/search.js',
  './icons/icon.svg',
  './icons/icon-180.png',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/fonts/public-sans-latin-400-normal.woff2',
  './vendor/fonts/public-sans-latin-600-normal.woff2',
  './vendor/fonts/public-sans-latin-700-normal.woff2',
  './vendor/fonts/public-sans-latin-800-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      // addAll fails the whole install if one file 404s, so add individually.
      .then((cache) => Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL && k !== TILES).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/**
 * `caches.match()` resolves to UNDEFINED when nothing matches, and passing that
 * to `respondWith()` is itself an error: the console says "FetchEvent
 * .respondWith received an error: Returned response is null" and the page's
 * fetch rejects with that instead of with the network failure that actually
 * happened. It made every uncached offline request look like a bug in the
 * service worker rather than like being offline.
 *
 * `Response.error()` is the honest answer: the page sees an ordinary network
 * failure, which is what it is, and the code that called `fetch` gets to handle
 * it. Nothing is logged, because nothing went wrong here.
 */
const offlineFallback = (hit) => hit || Response.error();

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // A map tile inside a kept area is served from that cache first: the
  // traveller downloaded it precisely so it would not need the network.
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILES)
        .then((cache) => cache.match(request))
        .then((hit) => hit || fetch(request).then((response) => {
          // Only what was deliberately kept goes in the tiles cache; casual
          // browsing is cached in the shell as before.
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }))
        .catch(() => caches.match(request).then(offlineFallback))
    );
    return;
  }

  // Anything live — fonts, Firebase — is network-first with a cached
  // fallback, so going offline degrades rather than breaks.
  if (!sameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.destination !== 'empty') {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request).then(offlineFallback))
    );
    return;
  }

  // Network-first for the app's own files: cache-first would keep serving a
  // stale build after a deploy. The cache is the offline fallback, not the
  // source of truth.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request)
        .then((hit) => hit || caches.match('./index.html'))
        .then(offlineFallback))
  );
});

// Offline shell. Free time usually happens without signal, so the app itself
// is cached and served cache-first; map tiles and Firebase always go to the
// network, and Firestore keeps its own offline copy of your data.

const VERSION = 'v1';
const SHELL = `travel-planner-shell-${VERSION}`;

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
  './js/screens/parts.js',
  './js/screens/map.js',
  './js/screens/plan.js',
  './js/screens/dest.js',
  './js/screens/nearby.js',
  './js/screens/sub.js',
  './js/screens/shop.js',
  './js/screens/mustsee.js',
  './js/screens/prep.js',
  './js/screens/log.js',
  './js/screens/note.js',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Anything live — tiles, fonts, Firebase — is network-first with a cached
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
        .catch(() => caches.match(request))
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
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});

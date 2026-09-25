// Leaflet is loaded as a plain <script> in index.html and used as the global
// `L`, rather than imported — it is vendored under web/vendor/leaflet/ so the
// map works with no network and with no build step.
//
// This tells TypeScript that, which is the whole of it: 21 of the 83 errors in
// the first type-check were `Cannot find name 'L'` in map.js, area.js and
// areas.js. Nothing here changes what ships.
import type * as Leaflet from 'leaflet';

declare global {
  const L: typeof Leaflet;
}

export {};

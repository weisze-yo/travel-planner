// Keeping a patch of map on the phone.
//
// The map's tiles are the only part of the app that needs the network.
// Everything drawn on top — your route, the pins, the sub route — is data
// you already have, so outside a saved area the map degrades to that rather
// than to nothing.
//
// The constraint that shapes this is OpenStreetMap's tile policy. Bulk
// downloading is not what those servers are for, so this is deliberately
// small: it happens once, only when asked, only over the area you drew, two
// requests at a time, and it refuses outright above a hard cap. That is the
// "fair-use download" the design promises, and the cap is the promise being
// kept rather than assumed.

const CACHE = 'travel-planner-tiles';
const TILE_URL = (z, x, y) => `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** Where a saved area starts from, so panning out still has something. */
export const BASE_ZOOM = 12;
/** What the two choices mean. */
export const DETAIL = [
  { id: 'streets', zoomTo: 16, label: 'Streets', note: 'to zoom 16' },
  { id: 'doorways', zoomTo: 18, label: 'Doorways', note: 'to zoom 18' },
];

/** Above this many tiles it is not fair use any more, and it says so. */
export const TILE_CAP = 1500;
/** Tiles run about this big at retina, which is what the estimate uses. */
const BYTES_PER_TILE = 26_000;

const lonToX = (lon, z) => Math.floor(((lon + 180) / 360) * (2 ** z));
const latToY = (lat, z) => {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * (2 ** z));
};

/** The tiles one zoom level needs for a bounding box. */
export function tileRange(bbox, z) {
  const [west, south, east, north] = bbox;
  const x0 = Math.min(lonToX(west, z), lonToX(east, z));
  const x1 = Math.max(lonToX(west, z), lonToX(east, z));
  const y0 = Math.min(latToY(north, z), latToY(south, z));
  const y1 = Math.max(latToY(north, z), latToY(south, z));
  return { x0, x1, y0, y1, count: (x1 - x0 + 1) * (y1 - y0 + 1) };
}

/** How many tiles, and roughly how big, an area would be. */
export function measure(bbox, zoomTo) {
  let count = 0;
  for (let z = BASE_ZOOM; z <= zoomTo; z++) count += tileRange(bbox, z).count;
  return { count, bytes: count * BYTES_PER_TILE, tooBig: count > TILE_CAP };
}

/** How wide and tall the area is, in kilometres. */
export function span(bbox) {
  const [west, south, east, north] = bbox;
  const mid = ((south + north) / 2 * Math.PI) / 180;
  return {
    width: Math.abs(east - west) * 111.32 * Math.cos(mid),
    height: Math.abs(north - south) * 110.57,
  };
}

export const inside = (bbox, lat, lng) => (
  Array.isArray(bbox)
  && lng >= Math.min(bbox[0], bbox[2]) && lng <= Math.max(bbox[0], bbox[2])
  && lat >= Math.min(bbox[1], bbox[3]) && lat <= Math.max(bbox[1], bbox[3])
);

/** "1.2 GB" / "62 MB" / "840 kB" */
export function size(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  return `${Math.round(bytes / 1e3)} kB`;
}

/**
 * Fetches an area's tiles into a cache the service worker already falls back
 * to, so nothing else has to know this happened.
 *
 * Two at a time, and it stops the moment it is told to — a download you
 * cannot abandon on hotel wifi is a trap.
 */
export async function download(bbox, zoomTo, { onProgress, shouldStop } = {}) {
  if (typeof caches === 'undefined') {
    return { ok: false, reason: 'This browser cannot keep map tiles offline.' };
  }
  const plan = measure(bbox, zoomTo);
  if (plan.tooBig) {
    return {
      ok: false,
      reason: `That area needs ${plan.count.toLocaleString('en-US')} tiles, which is more than a `
        + `fair-use download. Draw a smaller box, or keep it to streets rather than doorways.`,
    };
  }

  const cache = await caches.open(CACHE);
  const jobs = [];
  for (let z = BASE_ZOOM; z <= zoomTo; z++) {
    const { x0, x1, y0, y1 } = tileRange(bbox, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) jobs.push(TILE_URL(z, x, y));
    }
  }

  let done = 0;
  let failed = 0;
  let stopped = false;
  const LANES = 2;

  const worker = async () => {
    for (;;) {
      if (stopped) return;
      const url = jobs.shift();
      if (!url) return;
      if (shouldStop?.()) {
        stopped = true;
        return;
      }
      try {
        // Already kept from a previous area, or from just looking at it.
        const have = await cache.match(url);
        if (!have) {
          const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (response.ok) await cache.put(url, response.clone());
          else failed += 1;
        }
      } catch {
        failed += 1;
      }
      done += 1;
      if (done % 5 === 0 || !jobs.length) {
        onProgress?.({ done, total: plan.count, bytes: done * BYTES_PER_TILE });
      }
    }
  };

  await Promise.all(Array.from({ length: LANES }, worker));

  return {
    ok: !stopped,
    stopped,
    done,
    failed,
    total: plan.count,
    bytes: (done - failed) * BYTES_PER_TILE,
  };
}

/** Forgets one area's tiles. Shared tiles stay, since another area may need them. */
export async function forget(bbox, zoomTo, keep = []) {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(CACHE);
  for (let z = BASE_ZOOM; z <= zoomTo; z++) {
    const { x0, x1, y0, y1 } = tileRange(bbox, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        // A tile inside another kept area is not this area's to delete.
        const shared = keep.some((other) => {
          const r = tileRange(other.bbox, z);
          return z <= other.zoomTo && x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
        });
        if (!shared) await cache.delete(TILE_URL(z, x, y));
      }
    }
  }
}

/** How much map is actually on the phone. */
export async function kept() {
  if (typeof caches === 'undefined') return { count: 0, bytes: 0 };
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  return { count: keys.length, bytes: keys.length * BYTES_PER_TILE };
}

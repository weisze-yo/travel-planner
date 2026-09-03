// Keeping an area of map — drawn on the map you are looking at.
//
// The box starts around everything the trip has a position for, and is
// dragged by its corners or moved by panning the map underneath it. The size
// is computed rather than guessed, and above a hard cap it refuses outright:
// OpenStreetMap's tiles are not there to be bulk-downloaded, and a feature
// that quietly took a whole city would be abusing them.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';
import * as tiles from '../tiles.js';

let bbox = null;
let detail = 'streets';
let waitForWifi = true;
let busy = null;
let notice = '';
let mapView = null;
let stop = false;

export default {
  id: 'area',
  tab: 'map',

  render(params = {}) {
    if (!bbox) {
      bbox = params.bbox
        || store.suggestedArea()
        || [
          (state.trip?.longitude || 139.70) - 0.04,
          (state.trip?.latitude || 35.68) - 0.03,
          (state.trip?.longitude || 139.70) + 0.04,
          (state.trip?.latitude || 35.68) + 0.03,
        ];
    }

    const zoomTo = tiles.DETAIL.find((d) => d.id === detail).zoomTo;
    const plan = tiles.measure(bbox, zoomTo);
    const box = tiles.span(bbox);
    const outside = store.stopsOutsideAreas();
    const covered = coveredCount();

    return html`
      <section class="screen map-screen">
        <div class="leaf" id="leaf-area"></div>

        <div class="area-shade top"></div>
        <div class="area-shade bottom"></div>
        <div class="area-box" id="area-box">
          <i class="area-grip nw"></i><i class="area-grip ne"></i>
          <i class="area-grip sw"></i><i class="area-grip se"></i>
          <span class="area-note">
            ${covered.total
              ? `${covered.inside} of ${covered.total} stops with a position are inside`
              : 'No stops have a position yet'}
          </span>
        </div>

        <div class="map-top">
          <button class="iconbtn filled" data-act="back" aria-label="Back">${raw(icon.back)}</button>
          <div class="area-title">
            <div class="f135 w700">Keep this area on the phone</div>
            <div class="f115 muted mt2">Drag the corners, or pinch the map</div>
          </div>
        </div>

        <div class="sheet area-sheet">
          <div class="row g10" style="align-items:flex-end">
            <div class="grow">
              <div class="eyebrow">${areaName()}</div>
              <div class="f20 w700 mt2">${box.width.toFixed(1)} × ${box.height.toFixed(1)} km</div>
            </div>
            <div class="right none">
              <div class="eyebrow">SIZE</div>
              <div class="f20 w700 tnum">${tiles.size(plan.bytes)}</div>
            </div>
          </div>

          <div class="row g8 mt12">
            ${tiles.DETAIL.map((d) => {
              const m = tiles.measure(bbox, d.zoomTo);
              return html`
                <button class="detail${detail === d.id ? ' on' : ''}${m.tooBig ? ' too-big' : ''}"
                        data-detail="${d.id}">
                  <div class="f12 w700">${d.label}</div>
                  <div class="f105 w650 mt2 soft">
                    ${d.note} · ${m.tooBig ? 'too big' : tiles.size(m.bytes)}
                  </div>
                </button>`;
            })}
          </div>

          ${plan.tooBig ? html`
            <div class="amber-note f115 mt11">
              That is ${plan.count.toLocaleString('en-US')} tiles, past what a fair-use download
              should take. Draw a smaller box, or keep it to streets rather than doorways.
            </div>` : html`
            <div class="f115 muted lh145 mt11">
              Tiles come from OpenStreetMap, so this is a fair-use download: it happens once, on
              wi-fi by default, and covers the area you drew rather than a whole city.
              ${plan.count.toLocaleString('en-US')} tiles.
            </div>`}

          ${notice ? html`<div class="amber-note f12 mt11">${notice}</div>` : ''}

          ${busy ? html`
            <div class="mt12">
              <div class="progress"><i style="width:${Math.round((busy.done / busy.total) * 100)}%"></i></div>
              <div class="row g8 center mt8">
                <div class="grow f11 w700" style="color:var(--amber-fg)">
                  ${tiles.size(busy.bytes)} of ${tiles.size(busy.total * 26000)} · ${busy.done} of ${busy.total} tiles
                </div>
                <button class="btn sm ghost" data-act="stop">Stop</button>
              </div>
            </div>
          ` : html`
            <div class="row g8 mt12">
              <button class="btn jade grow" style="height:46px" data-act="keep"${plan.tooBig ? ' disabled' : ''}>
                Keep this area
              </button>
              <button class="btn ghost none" style="width:96px;height:46px" data-act="back">Cancel</button>
            </div>

            <button class="row g8 center mt11" data-act="wifi" style="width:100%">
              <span class="toggle${waitForWifi ? ' on' : ''}"><i></i></span>
              <span class="f12 w650" style="color:var(--charcoal)">Wait for wi-fi</span>
            </button>
          `}

          ${outside.stops.length && outside.areas && !busy ? html`
            <div class="f11 soft lh145 mt11">
              ${outside.stops.length} stop${outside.stops.length === 1 ? '' : 's'} of the trip
              ${outside.stops.length === 1 ? 'is' : 'are'} outside every area you have kept
              — ${outside.stops.slice(0, 3).map((s) => s.name).join(', ')}${outside.stops.length > 3 ? ' and more' : ''}.
            </div>` : ''}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { reset(); back(); });
    delegate(root, '[data-detail]', (el) => { detail = el.dataset.detail; repaint(); });
    delegate(root, '[data-act="wifi"]', () => { waitForWifi = !waitForWifi; repaint(); });
    delegate(root, '[data-act="stop"]', () => { stop = true; });

    delegate(root, '[data-act="keep"]', async () => {
      const zoomTo = tiles.DETAIL.find((d) => d.id === detail).zoomTo;

      // "Wait for wi-fi" is honest about what a browser can know: it can tell
      // a metered connection from an unmetered one where the platform says
      // so, and otherwise it asks rather than guessing.
      const link = navigator.connection?.type;
      const metered = navigator.connection?.saveData
        || (link && link !== 'wifi' && link !== 'ethernet' && link !== 'unknown');
      if (waitForWifi && metered) {
        notice = 'This looks like mobile data. Turn "Wait for wi-fi" off to download anyway.';
        repaint();
        return;
      }

      stop = false;
      busy = { done: 0, total: tiles.measure(bbox, zoomTo).count, bytes: 0 };
      notice = '';
      repaint();

      const result = await tiles.download(bbox, zoomTo, {
        onProgress: (p) => { busy = p; repaint(); },
        shouldStop: () => stop,
      });

      busy = null;
      if (!result.ok && result.reason) {
        notice = result.reason;
        repaint();
        return;
      }
      if (result.stopped) {
        notice = `Stopped after ${result.done} of ${result.total} tiles. What arrived is kept.`;
        repaint();
        return;
      }

      await store.saveMapArea({
        name: areaName(),
        bbox,
        zoomTo,
        bytes: result.bytes,
        tiles: result.done - result.failed,
      });
      reset();
      go('areas', {}, { replace: true });
    });

    drawMap(root.querySelector('#leaf-area'), root);
  },
};

/** The box is named after what it actually contains. */
function areaName() {
  const spans = new Set();
  for (const d of state.days) {
    for (const item of store.activeItems(d)) {
      if (item.latitude == null) continue;
      if (!tiles.inside(bbox, item.latitude, item.longitude)) continue;
      const area = String(item.subtitle || '').split('·').pop().trim();
      if (area) spans.add(area);
    }
  }
  const names = [...spans].slice(0, 2);
  return names.length ? names.join(' & ') : (state.trip?.locationName || 'This area');
}

function coveredCount() {
  let total = 0;
  let inside = 0;
  for (const d of state.days) {
    for (const item of store.activeItems(d)) {
      if (item.latitude == null) continue;
      total += 1;
      if (tiles.inside(bbox, item.latitude, item.longitude)) inside += 1;
    }
  }
  return { total, inside };
}

/**
 * The map underneath. The box is fixed on screen and the map moves under it,
 * which is how every "download this area" control works — dragging a
 * rectangle on a map you can also pan is two gestures fighting.
 */
function drawMap(container, root) {
  if (!container || typeof L === 'undefined') return;
  const [west, south, east, north] = bbox;

  mapView = L.map(container, { zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, detectRetina: true }).addTo(mapView);
  mapView.fitBounds(L.latLngBounds([[south, west], [north, east]]), { padding: [10, 10], animate: false });

  // The box on screen is the shaded window; whatever is behind it is the
  // area. Panning or zooming the map rewrites the bbox.
  const readBox = () => {
    const box = root.querySelector('#area-box');
    if (!box || !mapView) return;
    const frame = container.getBoundingClientRect();
    const rect = box.getBoundingClientRect();
    const nw = mapView.containerPointToLatLng([rect.left - frame.left, rect.top - frame.top]);
    const se = mapView.containerPointToLatLng([rect.right - frame.left, rect.bottom - frame.top]);
    bbox = [nw.lng, se.lat, se.lng, nw.lat];
    repaint();
  };

  mapView.on('moveend zoomend', readBox);

  // Dragging a corner resizes the window, and then the same read applies.
  for (const grip of root.querySelectorAll('.area-grip')) {
    grip.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const box = root.querySelector('#area-box');
      const start = box.getBoundingClientRect();
      const corner = grip.className.split(' ').pop();
      const move = (e) => {
        const dx = e.clientX - event.clientX;
        const dy = e.clientY - event.clientY;
        if (corner.includes('w')) box.style.left = `${Math.max(8, start.left + dx - container.getBoundingClientRect().left)}px`;
        if (corner.includes('e')) box.style.right = `${Math.max(8, container.getBoundingClientRect().right - start.right - dx)}px`;
        if (corner.includes('n')) box.style.top = `${Math.max(70, start.top + dy - container.getBoundingClientRect().top)}px`;
        if (corner.includes('s')) box.style.bottom = `${Math.max(300, container.getBoundingClientRect().bottom - start.bottom - dy)}px`;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        readBox();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
}

function repaint() {
  store.selectDay(state.selectedDay);
}

function reset() {
  bbox = null;
  detail = 'streets';
  busy = null;
  notice = '';
  stop = false;
}

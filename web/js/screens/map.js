// Screen 2a — Map home. Real map tiles under the agent's solid jade route and
// your own dashed amber loop. Every pin opens the place; pulling the sheet
// header goes to Plan; the pencil opens Plan in edit mode.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { dayPills, tripChip, emptyDay } from './parts.js';

let mapView = null;
let layers = null;
let markers = new Map();
let focused = null;
let sheetListeners = [];

export default {
  id: 'map',
  tab: 'map',

  render() {
    const day = store.day();
    const items = store.activeItems(day);
    const numbers = store.mainStopNumbers(day);
    const weather = store.weather();

    return html`
      <section class="screen map-screen">
        <div class="leaf" id="leaf"></div>

        <div class="map-top">
          <div class="row g8 center">
            <button class="grow" style="text-align:left;min-width:0" data-act="trips" aria-label="Switch trip">
              ${tripChip()}
            </button>
            <button class="iconbtn filled" data-act="trip" aria-label="Trip settings">
              ${raw(icon.gear)}
            </button>
          </div>
          <div class="chiprow">${dayPills()}</div>
          ${state.stranded ? html`
            <div class="stranded">
              Saved on this device only — Firebase could not be reached, so nothing is syncing.
            </div>` : ''}
          <div class="legend">
            <div class="legend-row"><span class="legend-key"></span>Main route</div>
            <div class="legend-row sub"><span class="legend-key dash"></span>Sub route</div>
          </div>
        </div>

        <div class="sheet map-sheet">
          <button class="sheet-grab" data-act="plan" aria-label="Open the day plan"><i></i></button>
          <div class="sheet-head">
            <button class="grow" style="text-align:left" data-act="plan">
              <div class="sheet-day">DAY ${day?.dayNumber ?? '—'} · ${day?.shortDate ?? ''}</div>
              <div class="sheet-span">${day?.areaSpan || 'No stops yet'}</div>
            </button>
            <button class="nearby-btn" data-act="nearby">Nearby</button>
          </div>
          <div class="scroll pad16">
            ${items.length ? items.map((item) => {
              const view = store.decoratedItem(item);
              const isSub = view.kind === 'sub';
              return html`
                <button class="stop-row${focused === view.id ? ' focused' : ''}" data-focus="${view.id}">
                  <div class="stop-time">${view.time}</div>
                  <div class="grow">
                    <div class="stop-name">${view.name}</div>
                    <div class="stop-meta">${view.durationLabel ? `${view.durationLabel} · ` : ''}${view.note}</div>
                  </div>
                  <span class="badge ${isSub ? 'sub' : 'main'}">${isSub ? 'SUB' : 'MAIN'}</span>
                </button>`;
            }) : emptyDay(weather)}
            <div style="height:8px"></div>
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    // Tear down the previous paint's window listeners before adding more.
    sheetListeners.forEach((off) => off());
    sheetListeners = [];

    delegate(root, '[data-act="trips"]', () => go('trips'));
    delegate(root, '[data-act="trip"]', () => go('trip'));
    delegate(root, '[data-day]', (el) => store.selectDay(Number(el.dataset.day)));
    delegate(root, '[data-act="plan"]', () => go('plan'));
    delegate(root, '[data-act="nearby"]', () => go('nearby', { dayScope: true }));
    // A row frames its stop on the map; opening the place is the pin's job.
    delegate(root, '[data-focus]', (el) => focusStop(el.dataset.focus));

    bindSheetSwipe(root.querySelector('.map-sheet'));
    drawMap(root.querySelector('#leaf'));
  },
};

/** Point 5: a list row frames its stop on the map rather than leaving it. */
/**
 * Point 6: pull the sheet up to open the Plan. The sheet itself does not
 * resize — the gesture is a shortcut into the full day, which is what the
 * design's "timeline rides on the map" idea implies.
 */
function bindSheetSwipe(sheet) {
  if (!sheet) return;
  let startY = null;
  let startedOnScroller = false;

  sheet.addEventListener('pointerdown', (event) => {
    startY = event.clientY;
    const scroller = event.target.closest('.scroll');
    // Only treat it as a sheet drag when the list is already at the top,
    // otherwise scrolling the stops would keep opening Plan.
    startedOnScroller = Boolean(scroller && scroller.scrollTop > 2);
  });

  // An upward swipe leaves the sheet almost immediately, so the release is
  // caught on the window. Capturing the pointer would work too, but it
  // retargets the click and would stop the rows being tappable at all.
  const release = (event) => {
    if (startY === null) return;
    const travelled = startY - event.clientY;
    startY = null;
    if (!startedOnScroller && travelled > 48) go('plan');
  };

  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', () => { startY = null; });

  // The screen is replaced on every paint, so drop these with it.
  sheetListeners.push(() => {
    window.removeEventListener('pointerup', release);
  });
}

function focusStop(id) {
  const hit = store.planItem(id);
  if (!hit) return;

  focused = id;
  const item = hit.item;

  // Highlight in place rather than through a re-render: repainting would
  // rebuild the Leaflet map and throw away the zoom we are about to set.
  document.querySelectorAll('.stop-row.focused').forEach((row) => row.classList.remove('focused'));
  document.querySelector(`.stop-row[data-focus="${id}"]`)?.classList.add('focused');

  // A loop's row has no single point, so it frames the whole loop — its own,
  // now that a day can hold several.
  if (item.isSubRouteSummary) {
    const loop = store.loopSchedule(store.subRouteByID(item.subRouteID)).stops
      .filter((s) => s.place.latitude)
      .map((s) => [s.place.latitude, s.place.longitude]);
    if (mapView && loop.length) {
      mapView.fitBounds(L.latLngBounds(loop).pad(0.4), sheetAwarePadding());
    }
  } else if (mapView && item.latitude) {
    mapView.setView([item.latitude, item.longitude], 17, { animate: true });
  }

  const marker = markers.get(id);
  if (marker) {
    const el = marker.getElement?.();
    if (el) {
      el.classList.add('pin-focus');
      setTimeout(() => el.classList.remove('pin-focus'), 1400);
    }
  }
}

function openItem(id) {
  const hit = store.planItem(id);
  if (!hit) return;
  if (hit.item.isSubRouteSummary) {
    store.selectLoop(hit.item.subRouteID);
    go('sub', { loopID: hit.item.subRouteID });
  } else {
    go('dest', { itemID: id });
  }
}

/**
 * Leaflet, with OpenStreetMap tiles — free and keyless. The design's colour
 * language carries the meaning: jade solid for the agent's route, amber dashed
 * for yours, a dark oversized pin on the stop that has slack.
 */
function sheetAwarePadding() {
  const height = document.querySelector('.leaf')?.clientHeight || 800;
  return {
    paddingTopLeft: [26, 130],
    paddingBottomRight: [26, Math.round(height * 0.42) + 30],
    animate: false,
  };
}

function drawMap(container) {
  if (!container || typeof L === 'undefined') return;

  const day = store.day();
  const items = store.activeItems(day).filter((i) => i.latitude && i.longitude && !i.isSubRouteSummary);
  const numbers = store.mainStopNumbers(day);
  // Every stretch of free time on the day draws, not just the first.
  const schedules = store.dayLoops();
  const anchorIDs = new Set(store.subRoutesFor().map((r) => r.anchorPlanItemID).filter(Boolean));

  mapView = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    // The sheet covers the lower half, so the route sits in the upper band.
    center: [state.trip?.latitude || 35.68, state.trip?.longitude || 139.70],
    zoom: 14,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    detectRetina: true,
  }).addTo(mapView);

  layers = L.layerGroup().addTo(mapView);
  markers = new Map();

  const mainLine = items.map((i) => [i.latitude, i.longitude]);
  if (mainLine.length > 1) {
    L.polyline(mainLine, { color: '#1F6F5C', weight: 5.5, lineCap: 'round', lineJoin: 'round' }).addTo(layers);
  }

  // Each loop leaves its anchor stop, visits its picks and comes back.
  const loopPoints = [];
  for (const schedule of schedules) {
    const points = schedule.stops
      .filter((s) => s.place.latitude && s.place.longitude)
      .map((s) => [s.place.latitude, s.place.longitude]);
    if (!points.length) continue;
    loopPoints.push(...points);

    const anchorID = schedule.loop?.anchorPlanItemID;
    const anchor = store.activeItems(day).find((i) => i.id === anchorID && i.latitude);
    const ring = anchor ? [[anchor.latitude, anchor.longitude], ...points, [anchor.latitude, anchor.longitude]] : points;
    L.polyline(ring, {
      color: '#C87F0A', weight: 3, dashArray: '2 7', lineCap: 'round',
    }).addTo(layers);
  }

  const seen = new Set();
  for (const item of items) {
    // The hotel opens and closes the day, so its two rows share one point;
    // the pin keeps the first number rather than stacking two.
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const n = numbers[item.id];
    const slack = anchorIDs.has(item.id);
    markers.set(item.id, pin(item, `<span class="map-pin${slack ? ' slack' : ''}">${n ?? ''}</span>`,
      slack ? 40 : 32, () => openItem(item.id)));
  }

  for (const schedule of schedules) {
    schedule.stops.forEach((stop) => {
      if (!stop.place.latitude) return;
      pin(stop.place, `<span class="map-pin sub-num">${stop.index}</span>`, 28,
        () => go('dest', { placeID: stop.place.id }));
    });
  }

  const all = [...mainLine, ...loopPoints];
  if (all.length) {
    // The sheet covers the lower 42% and the header the top ~120px, so the
    // route is fitted into the band that is actually visible.
    mapView.fitBounds(L.latLngBounds(all), sheetAwarePadding());
  }
}

function pin(source, markup, size, onClick) {
  const marker = L.marker([source.latitude, source.longitude], {
    icon: L.divIcon({
      html: markup,
      className: 'pin-wrap',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    }),
    keyboard: false,
  }).addTo(layers);
  marker.on('click', onClick);
  return marker;
}

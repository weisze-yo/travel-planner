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
            <button class="grow" style="text-align:left" data-act="trip" aria-label="Trip settings">
              ${tripChip()}
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

        <button class="fab" data-act="edit" title="Edit day" aria-label="Edit this day's itinerary">
          ${raw(icon.pencil('#fff'))}
        </button>

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
                <button class="stop-row" data-open="${view.id}">
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
    delegate(root, '[data-act="trip"]', () => go('trip'));
    delegate(root, '[data-act="plan"]', () => go('plan'));
    delegate(root, '[data-act="nearby"]', () => go('nearby'));
    delegate(root, '[data-act="edit"]', () => {
      store.setEditingPlan(true);
      go('plan');
    });
    delegate(root, '[data-open]', (el) => openItem(el.dataset.open));

    drawMap(root.querySelector('#leaf'));
  },
};

function openItem(id) {
  const hit = store.planItem(id);
  if (!hit) return;
  if (hit.item.isSubRouteSummary) go('sub');
  else go('dest', { itemID: id });
}

/**
 * Leaflet, with OpenStreetMap tiles — free and keyless. The design's colour
 * language carries the meaning: jade solid for the agent's route, amber dashed
 * for yours, a dark oversized pin on the stop that has slack.
 */
function drawMap(container) {
  if (!container || typeof L === 'undefined') return;

  const day = store.day();
  const items = store.activeItems(day).filter((i) => i.latitude && i.longitude && !i.isSubRouteSummary);
  const numbers = store.mainStopNumbers(day);
  const schedule = store.subSchedule();
  const anchor = store.activeItems(day).find((i) => i.id === store.subRoute()?.anchorPlanItemID);

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

  const mainLine = items.map((i) => [i.latitude, i.longitude]);
  if (mainLine.length > 1) {
    L.polyline(mainLine, { color: '#1F6F5C', weight: 5.5, lineCap: 'round', lineJoin: 'round' }).addTo(layers);
  }

  // The loop leaves the anchor stop, visits each pick and comes back.
  const loopPoints = schedule.stops
    .filter((s) => s.place.latitude && s.place.longitude)
    .map((s) => [s.place.latitude, s.place.longitude]);
  if (anchor && loopPoints.length) {
    const start = [anchor.latitude, anchor.longitude];
    L.polyline([start, ...loopPoints, start], {
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
    const slack = item.id === store.subRoute()?.anchorPlanItemID;
    pin(item, `<span class="map-pin${slack ? ' slack' : ''}">${n ?? ''}</span>`, slack ? 40 : 32,
      () => openItem(item.id));
  }

  schedule.stops.forEach((stop) => {
    if (!stop.place.latitude) return;
    pin(stop.place, `<span class="map-pin sub-num">${stop.index}</span>`, 28,
      () => go('dest', { placeID: stop.place.id }));
  });

  const all = [...mainLine, ...loopPoints];
  if (all.length) {
    const height = container.clientHeight || 800;
    mapView.fitBounds(L.latLngBounds(all), {
      // The sheet covers the lower 42% and the header the top ~120px, so the
      // route is fitted into the band that is actually visible.
      paddingTopLeft: [26, 130],
      paddingBottomRight: [26, Math.round(height * 0.42) + 30],
      animate: false,
    });
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

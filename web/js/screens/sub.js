// Screen 2e — one stretch of free time. Hold the three-line handle and drag
// to reorder; the arrival times and what is left to spend recalculate. The
// return row is editable, because you might be heading to the next stop
// rather than back to the coach.
//
// Item 05: a day can hold several of these now, so the card at the top says
// which one you are in and which part of the day it covers, and the chips
// beside it switch between the day's loops without going back to the Plan.

import { html, raw, icon, delegate, clock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';
import { bindDragReorder, mapsLinks } from './parts.js';

let backOpen = false;
let editingName = false;
let mapView = null;

export default {
  id: 'sub',
  tab: 'map',

  render(params = {}) {
    // Whichever loop was opened, else whichever the day has in hand.
    if (params.loopID && store.subRouteByID(params.loopID)) state.loopID = params.loopID;
    const route = store.activeLoop();
    const siblings = store.subRoutesFor();

    if (!route) {
      return html`
        <section class="screen">
          <div class="head">
            <div class="head-row center">
              <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
              <div class="grow">
                <div class="push-title">Free time</div>
                <div class="push-sub">Day ${state.selectedDay}</div>
              </div>
            </div>
          </div>
          <div class="scroll" style="padding:16px">
            <div class="empty">
              No free time set aside on this day yet.<br>
              <button class="f125 w700" style="color:var(--jade)" data-act="new-loop">Set some aside</button>
            </div>
          </div>
        </section>`;
    }

    const schedule = store.loopSchedule(route);
    const endpoints = store.loopEndpointOptions(route);
    const tight = schedule.spendableMinutes < 0;

    return html`
      <section class="screen sub-screen">
        <div class="leaf" id="leaf-sub"></div>

        <div class="sub-top">
          <button class="iconbtn filled" data-act="back" aria-label="Back">${raw(icon.back)}</button>
          <div class="sub-card">
            ${editingName
              ? html`<input id="loop-name" value="${route?.name || 'My sub route'}"
                            style="width:100%" aria-label="Name this loop">`
              : html`<button class="sub-title" data-act="rename" style="text-align:left">
                       ${route?.name || 'My sub route'} ✎
                     </button>`}
            <div class="sub-line">${store.loopWhen(route)} · ${schedule.stops.length} stops</div>
          </div>
        </div>

        ${siblings.length > 1 ? html`
          <div class="loop-switch">
            ${siblings.map((other) => html`
              <button class="loop-chip${other.id === route.id ? ' on' : ''}" data-loop="${other.id}">
                ${other.name}
                <span class="loop-chip-t">${clock(store.loopStart(other) ?? 0)}</span>
              </button>`)}
          </div>` : ''}

        <div class="sheet sub-sheet">
          <div class="sheet-grab"><i></i></div>

          <div class="row g8 pad16" style="padding-bottom:10px;flex:none">
            <div class="stat"><div class="stat-k">YOU HAVE</div><div class="stat-v">${store.duration(schedule.availableMinutes)}</div></div>
            <div class="stat"><div class="stat-k">TRAVELLING</div><div class="stat-v">${store.duration(schedule.travelMinutes)}</div></div>
            <div class="stat ${tight ? 'tight' : 'ok'}">
              <div class="stat-k">${tight ? 'SHORT BY' : 'TO SPEND'}</div>
              <div class="stat-v">${store.duration(Math.abs(schedule.spendableMinutes))}</div>
            </div>
          </div>

          <div class="pad16" style="padding-bottom:10px;flex:none">
            <div class="f115 lh145" style="color:${tight ? 'var(--danger-fg)' : 'var(--muted)'}">
              ${tight
                ? `Getting round takes ${store.duration(schedule.travelMinutes)}, which is longer than the
                   ${store.duration(schedule.availableMinutes)} between leaving and being back. Drop a stop,
                   or give yourself more time.`
                : `${store.duration(schedule.travelMinutes)} of that is getting between places, so
                   ${store.duration(schedule.spendableMinutes)} is yours to spread across
                   ${schedule.stops.length} stop${schedule.stops.length === 1 ? '' : 's'} however you like.`}
            </div>
            ${schedule.stayEstimate ? html`
              <div class="f11 soft mt6">
                The times below assume roughly ${store.duration(schedule.stayEstimate)} of lingering in
                total — an estimate, not a plan.
              </div>` : ''}
          </div>

          <div class="pad16 f11 w700 soft" style="padding-bottom:8px;flex:none">
            ${schedule.stops.length > 1 ? 'Hold the handle to drag a stop into place' : 'Add places from Nearby to build the loop'}
          </div>

          <div class="scroll pad16" id="loop-rows">
            ${schedule.stops.map((stop) => html`
              <div class="loop-row" data-row-id="${stop.place.id}">
                <div class="handle-grip" style="width:22px" data-grip>${raw(icon.grip)}</div>
                <div class="loop-n">${stop.index}</div>
                <button class="grow" style="text-align:left" data-open-place="${stop.place.id}">
                  <div class="loop-name">${stop.place.name}</div>
                  <div class="loop-meta">${legLine(stop.place)}</div>
                </button>
                <div class="right none">
                  <div class="loop-time">~${clock(stop.arrival)}</div>
                  <div class="f11 soft">${store.duration(stop.travel)} away</div>
                </div>
              </div>`)}

            ${schedule.stops.length ? '' : html`
              <div class="empty">
                Nothing in the loop yet.<br>
                <button class="f125 w700" style="color:var(--jade)" data-act="nearby">Open Nearby to pick places</button>
              </div>`}

            <div style="padding:11px 0;border-top:1px solid var(--line-2)">
              <div class="row g10 center">
                <div class="loop-n back">↩</div>
                <div class="grow">
                  <div class="loop-name">Back to ${schedule.endPlace?.name || 'where you started'}</div>
                  <div class="f11 w650 mt2" style="color:${tight ? 'var(--danger-fg)' : 'var(--jade)'}">
                    ${store.duration(schedule.returnMinutes)} to get there · be there by ${clock(schedule.returnByMinutes)}
                  </div>
                </div>
                <button class="loop-edit" data-act="back-toggle" aria-label="Edit the loop's start, end and times">
                  ${raw(icon.pencil('#3D4C46', 13))}
                </button>
              </div>

              ${backOpen ? html`
                <div class="back-form">
                  <div class="eyebrow">START AND END</div>
                  <select id="loop-start" aria-label="Start of the loop">
                    ${endpoints.map((e) => html`
                      <option value="${e.id}"${e.id === (route?.startPlaceID || route?.anchorPlaceID) ? ' selected' : ''}>
                        Start: ${e.time} ${e.label}
                      </option>`)}
                  </select>
                  <select id="loop-end" aria-label="End of the loop">
                    ${endpoints.map((e) => html`
                      <option value="${e.id}"${e.id === (route?.endPlaceID || route?.startPlaceID || route?.anchorPlaceID) ? ' selected' : ''}>
                        End: ${e.time} ${e.label}
                      </option>`)}
                  </select>

                  <div class="eyebrow mt2">YOUR TIMES</div>
                  <div class="row g8 center">
                    <label class="grow">
                      <span class="f11 soft">Leave</span>
                      <input id="loop-depart" value="${clock(schedule.departMinutes)}" inputmode="numeric" style="width:100%">
                    </label>
                    <label class="grow">
                      <span class="f11 soft">Be back by</span>
                      <input id="loop-return" value="${clock(schedule.returnByMinutes)}" inputmode="numeric" style="width:100%">
                    </label>
                  </div>

                  <div class="eyebrow mt2">GETTING BACK TAKES</div>
                  <div class="row g8 center">
                    <input id="back-mins" value="${route?.returnMinutes ?? 8}" style="width:88px" inputmode="numeric">
                    <span class="f12 w650 muted">minutes</span>
                    <button class="btn jade grow" style="height:38px" data-act="back-done">Done</button>
                  </div>
                  <div class="form-hint">
                    Leaving and returning are yours to set. Everything else is an estimate the app
                    works out from the places you picked.
                  </div>
                </div>` : ''}
            </div>

            <div class="row g8" style="margin:12px 0 4px">
              <a class="btn ink grow" style="height:44px" href="${walkURL(schedule)}" target="_blank" rel="noopener">
                Send walk to Maps
              </a>
            </div>
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-act="nearby"]', () => go('nearby'));
    delegate(root, '[data-loop]', (el) => store.selectLoop(el.dataset.loop));
    delegate(root, '[data-act="new-loop"]', () => {
      const loop = store.addSubRoute(state.selectedDay);
      if (loop) store.selectLoop(loop.id);
    });
    delegate(root, '[data-act="back-toggle"]', () => { backOpen = !backOpen; nudge(); });
    delegate(root, '[data-act="back-done"]', () => {
      const loop = store.activeLoop();
      store.setSubRouteEndpoints({
        startPlaceID: root.querySelector('#loop-start')?.value,
        endPlaceID: root.querySelector('#loop-end')?.value,
      }, loop);
      store.setSubRouteTimes({
        depart: root.querySelector('#loop-depart')?.value,
        returnBy: root.querySelector('#loop-return')?.value,
      }, loop);
      store.setReturn({ minutes: root.querySelector('#back-mins')?.value }, loop);
      backOpen = false;
    });

    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));

    delegate(root, '[data-act="rename"]', () => { editingName = true; nudge(); });
    const nameBox = root.querySelector('#loop-name');
    if (nameBox) {
      nameBox.focus();
      const commit = () => {
        editingName = false;
        store.renameSubRoute(nameBox.value, store.activeLoop());
      };
      nameBox.addEventListener('change', commit);
      nameBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') commit(); });
    }

    bindDragReorder(root, {
      rowSelector: '[data-row-id]',
      handleSelector: '[data-grip]',
      onDrop: (movedId, beforeId) => store.reorderSubRoute(movedId, beforeId, store.activeLoop()),
    });

    drawMap(root.querySelector('#leaf-sub'));
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

function legLine(place) {
  const legs = (place.legs || []).map((l) => `${l.mode === 'walk' ? '🚶' : l.mode === 'train' ? '🚆' : '🚌'}${l.minutes}`);
  return `${legs.join(' + ')} · stay ${store.duration(place.stayMinutes)} · ${place.priceTier}`;
}

function walkURL(schedule) {
  const anchor = loopAnchor(schedule.loop);
  const points = [];
  if (anchor?.latitude) points.push({ lat: anchor.latitude, lng: anchor.longitude });
  for (const stop of schedule.stops) {
    if (stop.place.latitude) points.push({ lat: stop.place.latitude, lng: stop.place.longitude });
  }
  if (anchor?.latitude) points.push({ lat: anchor.latitude, lng: anchor.longitude });
  return mapsLinks.walk(points);
}

/** Where a loop starts from on the map: its start place, else its anchor stop. */
function loopAnchor(loop) {
  if (!loop) return null;
  const items = store.activeItems(store.day(loop.dayNumber));
  return items.find((i) => i.placeID && i.placeID === (loop.startPlaceID || loop.anchorPlaceID))
    || items.find((i) => i.id === loop.anchorPlanItemID)
    || null;
}

function drawMap(container) {
  if (!container || typeof L === 'undefined') return;

  const route = store.activeLoop();
  if (!route) return;
  const schedule = store.loopSchedule(route);
  const anchor = loopAnchor(route);
  const centre = anchor?.latitude
    ? [anchor.latitude, anchor.longitude]
    : [state.trip?.latitude || 35.68, state.trip?.longitude || 139.70];

  mapView = L.map(container, { zoomControl: false, attributionControl: false, center: centre, zoom: 16 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, detectRetina: true }).addTo(mapView);

  const points = schedule.stops
    .filter((s) => s.place.latitude)
    .map((s) => [s.place.latitude, s.place.longitude]);

  if (anchor?.latitude && points.length) {
    const start = [anchor.latitude, anchor.longitude];
    L.polyline([start, ...points, start], {
      color: '#C87F0A', weight: 3.5, dashArray: '3 7', lineCap: 'round',
    }).addTo(mapView);
    marker(mapView, start, '<span class="map-pin slack" style="width:36px;height:36px">↩</span>', 36);
  }

  schedule.stops.forEach((stop) => {
    if (!stop.place.latitude) return;
    marker(mapView, [stop.place.latitude, stop.place.longitude],
      `<span class="map-pin sub-num">${stop.index}</span>`, 28);
  });

  const all = anchor?.latitude ? [[anchor.latitude, anchor.longitude], ...points] : points;
  if (all.length > 1) {
    const height = container.clientHeight || 800;
    // This sheet is taller (68%), so the visible band is a narrow strip.
    mapView.fitBounds(L.latLngBounds(all), {
      paddingTopLeft: [30, 120],
      paddingBottomRight: [30, Math.round(height * 0.68) + 20],
      animate: false,
    });
  }
}

function marker(view, latlng, markup, size) {
  L.marker(latlng, {
    icon: L.divIcon({ html: markup, className: 'pin-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
    keyboard: false,
  }).addTo(view);
}

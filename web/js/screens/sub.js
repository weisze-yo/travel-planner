// Screen 2e — one sub route.
//
// Split in two per the artboards. View mode (1e) is what you get almost all
// the time: the stats, the places, the walk out to Maps. Edit mode (1l) is
// behind the pencil, and it is the only place the handles, the ✕s, the two
// ends and "Add places" exist — because on a phone, in a market, a screen
// that can be rearranged by accident is worse than one extra tap.
//
// The chips under the grab handle move between the day's sub routes without
// going back to the Plan, since a day can now hold several.

import { html, raw, icon, delegate, clock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';
import { bindDragReorder, mapsLinks } from './parts.js';

let editing = false;
let mapView = null;

export default {
  id: 'sub',
  tab: 'map',

  render(params = {}) {
    if (params.loopID && store.subRouteByID(params.loopID)) state.loopID = params.loopID;
    const route = store.activeLoop();
    const siblings = store.subRoutesFor();

    if (!route) return emptyScreen();

    const schedule = store.loopSchedule(route);
    const endpoints = store.loopEndpointOptions(route);
    const tight = schedule.spendableMinutes < 0;
    const count = schedule.stops.length;

    return html`
      <section class="screen sub-screen">
        <div class="leaf" id="leaf-sub"></div>

        <div class="sub-top">
          <button class="iconbtn filled" data-act="back" aria-label="Back">${raw(icon.back)}</button>
          <div class="sub-card">
            ${editing
              ? html`<input id="loop-name" value="${route.name}" style="width:100%" aria-label="Name this sub route">`
              : html`<div class="sub-title">${route.name}</div>`}
            <div class="sub-line">
              ${editing
                ? `Day ${route.dayNumber} ${store.loopPart(route)} · editing`
                : `${store.loopWhen(route)} · ${endsLine(schedule)}`}
            </div>
          </div>
          <button class="iconbtn filled" data-act="toggle-edit"
                  style="${editing ? 'background:var(--jade)' : ''}"
                  aria-label="${editing ? 'Finish editing' : 'Edit this sub route'}">
            ${raw(editing ? icon.tick('#fff', 15) : icon.pencil('#14201C', 17))}
          </button>
        </div>

        <div class="sheet sub-sheet" style="max-height:${editing ? 76 : (count ? 75 : 58)}%">
          <div class="sheet-grab"><i></i></div>

          ${siblings.length > 1 || editing ? html`
            <div class="loop-switch">
              ${siblings.map((other) => html`
                <button class="loop-chip${other.id === route.id ? ' on' : ''}" data-loop="${other.id}">
                  ${other.name}
                </button>`)}
              ${editing ? html`<button class="loop-chip new" data-act="new-loop">+ New</button>` : ''}
            </div>` : ''}

          <div class="row g8 pad16" style="padding-bottom:10px;flex:none">
            <div class="stat">
              <div class="stat-k">YOU HAVE</div>
              <div class="stat-v">${store.duration(schedule.availableMinutes)}</div>
            </div>
            <div class="stat">
              <div class="stat-k">TRAVELLING</div>
              <div class="stat-v">${count ? store.duration(schedule.travelMinutes) : '—'}</div>
            </div>
            <div class="stat ${tight ? 'tight' : 'ok'}">
              <div class="stat-k">${tight ? 'SHORT BY' : 'TO SPEND'}</div>
              <div class="stat-v">${store.duration(Math.abs(schedule.spendableMinutes))}</div>
            </div>
          </div>

          <div class="pad16" style="padding-bottom:10px;flex:none">
            <div class="f115 lh145" style="color:${tight ? 'var(--danger-fg)' : 'var(--muted)'}">
              ${!count
                ? `Nothing picked yet, so the whole window is yours. Nearby is drawn from the two
                   ends you set, so only places along the way are offered.`
                : (tight
                  ? `${count} stop${count === 1 ? '' : 's'} and getting back take
                     ${store.duration(-schedule.spendableMinutes)} more than the window allows.
                     Drop a stop, shorten a stay, or push be back by later.`
                  : `${store.duration(schedule.travelMinutes)} of that is getting between places, so
                     ${store.duration(schedule.spendableMinutes)} is yours to spread across
                     ${count} stop${count === 1 ? '' : 's'} however you like.`)}
            </div>
          </div>

          ${editing ? html`
            <div class="pad16" style="padding-bottom:10px;flex:none">
              <div class="hint-amber">Hold a handle to reorder. Times recalculate as you go.</div>
            </div>` : html`
            <div class="pad16 f11 w700 soft" style="padding-bottom:8px;flex:none">
              ${count ? 'Tap a place to open it · the pencil to rearrange' : ''}
            </div>`}

          <div class="scroll pad16" id="loop-rows">
            ${count || editing ? html`
              <div class="loop-row">
                ${editing ? html`<div style="width:22px;flex:none"></div>` : ''}
                <div class="loop-n edge">↳</div>
                <div class="grow">
                  <div class="loop-name">Leave from ${schedule.startPlace?.name || 'wherever you are'}</div>
                  <div class="loop-meta">
                    ${editing
                      ? `${clock(schedule.departMinutes)} · change it below`
                      : (schedule.startPlace ? 'where the sub route begins' : 'no start stop set')}
                  </div>
                </div>
                <div class="right none">
                  <div class="loop-time">${clock(schedule.departMinutes)}</div>
                </div>
              </div>` : ''}

            ${schedule.stops.map((stop) => html`
              <div class="loop-row" data-row-id="${stop.place.id}">
                ${editing ? html`
                  <div class="handle-grip" style="width:22px" data-grip>${raw(icon.grip)}</div>` : ''}
                <div class="loop-n">${stop.index}</div>
                <button class="grow" style="text-align:left" data-open-place="${stop.place.id}">
                  <div class="loop-name">${stop.place.name}</div>
                  <div class="loop-meta">${legLine(stop.place)}</div>
                </button>
                ${editing ? html`
                  <button class="plan-remove" data-drop="${stop.place.id}"
                          aria-label="Take ${stop.place.name} out">✕</button>
                ` : html`
                  <div class="right none">
                    <div class="loop-time${stop.arrival > schedule.returnByMinutes ? ' bad' : ''}">~${clock(stop.arrival)}</div>
                    <div class="f11 soft">${store.duration(stop.travel)} away</div>
                  </div>`}
              </div>`)}

            ${!count && !editing ? html`
              <div class="empty">
                Nothing in this sub route yet.<br>
                ${schedule.startPlace
                  ? `Pick places between ${schedule.startPlace.name} and ${schedule.endPlace?.name || 'where you finish'} and they land here in walking order.`
                  : 'Pick places and they land here in walking order.'}
                <div class="mt14">
                  <button class="btn jade" data-act="nearby">Pick places along this sub route</button>
                </div>
              </div>` : ''}

            ${count ? html`
              <div class="loop-row" style="border-top:1px solid var(--line-2)">
                ${editing ? html`<div style="width:22px;flex:none"></div>` : ''}
                <div class="loop-n back">↩</div>
                <div class="grow">
                  <div class="loop-name">Back to ${schedule.endPlace?.name || 'where you started'}</div>
                  <div class="f11 w650 mt2" style="color:${tight ? 'var(--danger-fg)' : 'var(--jade)'}">
                    ${store.duration(schedule.returnMinutes)} to get there · be there by ${clock(schedule.returnByMinutes)}
                  </div>
                </div>
              </div>` : ''}

            ${editing ? html`
              <button class="lane-add more mt10" data-act="nearby">+ Add places</button>
              <div class="back-form mt10">
                <div class="eyebrow">START AND END</div>
                <div class="row g8">
                  <label class="grow">
                    <span class="f11 soft">Start at</span>
                    <select id="loop-start" style="width:100%">
                      ${endpoints.map((e) => html`
                        <option value="${e.id}"${e.id === (route.startPlaceID || route.anchorPlaceID) ? ' selected' : ''}>${e.label}</option>`)}
                    </select>
                  </label>
                  <label class="grow">
                    <span class="f11 soft">End at</span>
                    <select id="loop-end" style="width:100%">
                      ${endpoints.map((e) => html`
                        <option value="${e.id}"${e.id === (route.endPlaceID || route.startPlaceID) ? ' selected' : ''}>${e.label}</option>`)}
                    </select>
                  </label>
                </div>
                <div class="row g8">
                  <label class="grow">
                    <span class="f11 soft">Leave</span>
                    <input id="loop-depart" value="${clock(schedule.departMinutes)}" inputmode="numeric" style="width:100%">
                  </label>
                  <label class="grow">
                    <span class="f11 soft">Be back by</span>
                    <input id="loop-return" value="${clock(schedule.returnByMinutes)}" inputmode="numeric" style="width:100%">
                  </label>
                </div>
                <div class="row g8 center">
                  <span class="f11 soft none">Return takes</span>
                  <input id="back-mins" value="${route.returnMinutes ?? 8}" style="width:70px" inputmode="numeric">
                  <span class="f12 w650 muted">min${count ? ` · from ${schedule.stops[count - 1].place.name}` : ''}</span>
                </div>
                <div class="form-hint">
                  Ends come from this day's stops. The return is measured from whatever the last
                  place turns out to be, so it changes when you reorder or drop one.
                </div>
                <button class="btn jade" data-act="loop-save">Save these</button>
              </div>
              <button class="btn none mt12" style="color:var(--danger-fg);height:38px" data-act="delete-loop">
                Delete this sub route
              </button>
            ` : (count ? html`
              <div class="row g8" style="margin:12px 0 4px">
                <a class="btn ink grow" style="height:44px" href="${walkURL(schedule)}" target="_blank" rel="noopener">
                  Send walk to Maps
                </a>
              </div>
              <div class="f11 soft lh145 mt6">
                Hands Maps your position as the start, then these ${count} in this order, ending at
                ${schedule.endPlace?.name || 'where you began'} — so it works even if you are
                already halfway round.
              </div>` : '')}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { editing = false; back(); });
    delegate(root, '[data-act="nearby"]', () => go('nearby', { loopID: store.activeLoop()?.id }));
    delegate(root, '[data-loop]', (el) => { editing = false; store.selectLoop(el.dataset.loop); });
    delegate(root, '[data-act="toggle-edit"]', () => {
      editing = !editing;
      store.selectDay(state.selectedDay);
    });
    delegate(root, '[data-act="new-loop"]', () => {
      const loop = store.addSubRoute(state.selectedDay);
      if (loop) store.selectLoop(loop.id);
    });
    delegate(root, '[data-drop]', (el) => store.toggleSubRoutePlace(el.dataset.drop, store.activeLoop()));
    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));

    delegate(root, '[data-act="loop-save"]', () => {
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
    });

    delegate(root, '[data-act="delete-loop"]', () => {
      const loop = store.activeLoop();
      if (!loop) return;
      // eslint-disable-next-line no-alert -- deliberate: deletion is permanent.
      if (!window.confirm(`Delete "${loop.name}"? The places you picked stay saved; only the sub route goes.`)) return;
      store.deleteSubRoute(loop.id);
      editing = false;
      back();
    });

    const nameBox = root.querySelector('#loop-name');
    if (nameBox) {
      nameBox.addEventListener('change', () => store.renameSubRoute(nameBox.value, store.activeLoop()));
    }

    if (editing) {
      bindDragReorder(root, {
        rowSelector: '[data-row-id]',
        handleSelector: '[data-grip]',
        onDrop: (movedId, beforeId) => store.reorderSubRoute(movedId, beforeId, store.activeLoop()),
      });
    }

    drawMap(root.querySelector('#leaf-sub'));
  },
};

function emptyScreen() {
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
          Open the Plan — every gap between two stops offers one.
          <div class="mt14"><button class="btn jade" data-act="new-loop">Set some aside</button></div>
        </div>
      </div>
    </section>`;
}

function endsLine(schedule) {
  const from = schedule.startPlace?.name;
  const to = schedule.endPlace?.name;
  if (!from) return `${schedule.stops.length} stops`;
  return from === to ? `starts and ends at ${from}` : `${from} → ${to || 'wherever you finish'}`;
}

function legLine(place) {
  const legs = (place.legs || []).map((l) => `${l.mode === 'walk' ? '🚶' : l.mode === 'train' ? '🚆' : '🚌'}${l.minutes}`);
  return `${legs.join(' + ')} · stay ${store.duration(place.stayMinutes)} · ${place.priceTier}`;
}

function walkURL(schedule) {
  const points = [];
  if (schedule.startPlace?.latitude) {
    points.push({ lat: schedule.startPlace.latitude, lng: schedule.startPlace.longitude });
  }
  for (const stop of schedule.stops) {
    if (stop.place.latitude) points.push({ lat: stop.place.latitude, lng: stop.place.longitude });
  }
  if (schedule.endPlace?.latitude) {
    points.push({ lat: schedule.endPlace.latitude, lng: schedule.endPlace.longitude });
  }
  return mapsLinks.walk(points);
}

function drawMap(container) {
  if (!container || typeof L === 'undefined') return;

  const route = store.activeLoop();
  if (!route) return;
  const schedule = store.loopSchedule(route);
  const start = schedule.startPlace;
  const centre = start?.latitude
    ? [start.latitude, start.longitude]
    : [state.trip?.latitude || 35.68, state.trip?.longitude || 139.70];

  mapView = L.map(container, { zoomControl: false, attributionControl: false, center: centre, zoom: 16 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, detectRetina: true }).addTo(mapView);

  const points = schedule.stops
    .filter((s) => s.place.latitude)
    .map((s) => [s.place.latitude, s.place.longitude]);

  if (start?.latitude && points.length) {
    const from = [start.latitude, start.longitude];
    const to = schedule.endPlace?.latitude
      ? [schedule.endPlace.latitude, schedule.endPlace.longitude]
      : from;
    L.polyline([from, ...points, to], {
      color: '#C87F0A', weight: 3.5, dashArray: '3 7', lineCap: 'round',
    }).addTo(mapView);
    marker(mapView, from, '<span class="map-pin slack" style="width:36px;height:36px">↩</span>', 36);
  }

  schedule.stops.forEach((stop) => {
    if (!stop.place.latitude) return;
    marker(mapView, [stop.place.latitude, stop.place.longitude],
      `<span class="map-pin sub-num">${stop.index}</span>`, 28);
  });

  const all = start?.latitude ? [[start.latitude, start.longitude], ...points] : points;
  if (all.length > 1) {
    const height = container.clientHeight || 800;
    mapView.fitBounds(L.latLngBounds(all), {
      paddingTopLeft: [30, 120],
      paddingBottomRight: [30, Math.round(height * 0.7) + 20],
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

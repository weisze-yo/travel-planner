// Screen 2d — Nearby. No time gate: every place shows. Sort lives in an icon
// on the right of the count line (travel time or stay time only, since
// categories are their own filter row), multi-leg journeys are spelled out,
// and you can add a place yourself.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { backHeader, swipeToDelete } from './parts.js';
import { MODE_ICONS, MODE_LABELS, CATEGORY_LABELS } from '../data.js';

let sortOpen = false;
let addOpen = false;
let notice = '';

const CATS = ['all', 'food', 'cosme', 'cloth', 'shopping', 'sight', 'rest'];
const SORTS = [
  { id: 'travelTime', label: 'Travel time' },
  { id: 'stayTime', label: 'Stay time' },
];

export default {
  id: 'nearby',
  tab: 'map',

  render(params = {}) {
    // Opened from the Map it covers the whole day; opened from a stop it
    // covers that stop.
    const dayScope = Boolean(params.dayScope);
    const anchorName = params.anchorName || store.subRoute()?.anchorName || 'this stop';
    const anchorID = params.anchorID || store.subRoute()?.anchorPlanItemID || null;
    const groups = dayScope ? store.placesByStopForDay() : [];
    const places = dayScope ? [] : store.nearbyPlaces(anchorID);
    const dayTotal = groups.reduce((n, g) => n + g.places.length, 0);
    const schedule = store.subSchedule();
    const deadline = store.subRouteDeadline();

    return html`
      <section class="screen">
        ${backHeader({
          title: dayScope ? `Around day ${state.selectedDay}` : `Around ${anchorName}`,
          sub: dayScope
            ? `${dayTotal} place${dayTotal === 1 ? '' : 's'} saved across today's stops`
            : (deadline ? `Back by ${store.clock(deadline)}` : 'Places you can reach from this stop'),
        })}
        <div class="head" style="padding-top:0;border-bottom:1px solid var(--line)">
          <div class="chiprow">
            ${CATS.map((c) => html`
              <button class="cat${c === state.nearbyCategory ? ' on' : ''}" data-cat="${c}">
                ${c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>`)}
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 156px">
          <div class="row g8 center mb10">
            <div class="grow f115 w700 muted">
              ${dayScope ? `grouped by stop` : `${places.length} places`} ·
              sorted by ${SORTS.find((s) => s.id === state.nearbySort).label.toLowerCase()}
            </div>
            <button class="sortbtn${sortOpen ? ' on' : ''}" data-act="sort-toggle" aria-label="Change sort">
              ${raw(icon.sort(sortOpen ? '#fff' : '#3D4C46'))}
            </button>
          </div>

          ${sortOpen ? html`
            <div class="sortmenu mb10">
              <div class="eyebrow" style="padding:6px 8px 4px">SORT BY</div>
              ${SORTS.map((s) => html`
                <button class="sortopt${s.id === state.nearbySort ? ' on' : ''}" data-sort="${s.id}">
                  <span class="radio${s.id === state.nearbySort ? ' on' : ''}"></span>
                  <span class="sortopt-label">${s.label}</span>
                </button>`)}
            </div>` : ''}

          ${notice ? html`<div class="amber-note f12 mb10">${notice}</div>` : ''}

          ${dayScope ? (dayTotal ? groups.map((group) => html`
            <div class="stop-group">
              <div class="stop-group-head">
                <span class="stop-group-time">${group.stop.time}</span>
                <span class="grow">${group.stop.name}</span>
                <span class="badge ${group.stop.kind === 'sub' ? 'sub' : 'main'}">
                  ${group.stop.kind === 'sub' ? 'SUB' : 'MAIN'}
                </span>
              </div>
              ${group.places.map((p) => card(p))}
            </div>`) : html`
            <div class="empty">
              Nothing saved around today's stops yet.<br>
              Open a stop and use <b>+ Add a place</b> to start a list for it.
            </div>`) : ''}

          ${dayScope ? '' : (places.length ? places.map((p) => card(p)) : html`
            <div class="empty">
              ${state.nearbyCategory === 'all'
                ? `Nothing saved around ${anchorName} yet.`
                : 'Nothing in this category here.'}<br>
              Add a place below and it shows up on the map.
            </div>`)}

          ${dayScope ? '' : html`
            ${addOpen ? addForm() : ''}
            <button class="btn-dashed" style="height:46px" data-act="add-open">+ Add a place</button>`}
        </div>

        <div class="dock">
          <div class="grow">
            <div class="dock-h">MY SUB ROUTE · ${schedule.stops.length} STOPS</div>
            <div class="dock-s">${store.subSummaryLine()}</div>
          </div>
          <button class="dock-btn" data-act="arrange">Arrange</button>
        </div>
      </section>`;
  },

  mount(root, params = {}) {
    swipeToDelete(root, {
      rowSelector: '[data-place-row]',
      label: (row) => `Delete "${row.dataset.placeName}" from your saved places?`,
      onDelete: (row) => store.deletePlace(row.dataset.placeRow),
    });

    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-cat]', (el) => store.setNearbyCategory(el.dataset.cat));
    delegate(root, '[data-act="sort-toggle"]', () => { sortOpen = !sortOpen; store.setNearbySort(state.nearbySort); });
    delegate(root, '[data-sort]', (el) => { sortOpen = false; store.setNearbySort(el.dataset.sort); });
    delegate(root, '[data-act="arrange"]', () => go('sub', params));
    delegate(root, '[data-pick]', (el) => store.toggleSubRoutePlace(el.dataset.pick));
    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));

    delegate(root, '[data-act="add-open"]', () => { addOpen = true; rerender(); });
    delegate(root, '[data-act="add-cancel"]', () => { addOpen = false; rerender(); });
    delegate(root, '[data-act="add-save"]', async (el) => {
      const name = root.querySelector('#np-name')?.value.trim();
      if (!name) return;
      const anchorID = params.anchorID || store.subRoute()?.anchorPlanItemID || null;

      notice = /^https?:/i.test(name) ? 'Reading that link…' : `Looking up ${name}…`;
      addOpen = false;
      rerender();

      const result = await store.capturePlace({
        input: name,
        category: root.querySelector('#np-cat')?.value || 'food',
        walkMinutes: root.querySelector('#np-walk')?.value,
        anchorPlaceID: anchorID,
      });

      if (!result.saved) {
        notice = result.reason;
      } else if (!result.located) {
        notice = `"${result.name}" was saved without a location, so it will not appear on the map `
          + 'or in the walking route. Nothing was found by that name nearby — try a fuller name, '
          + 'the street, or paste a map link.';
      } else {
        notice = result.enriched
          ? `"${result.name}" added, with what OpenStreetMap knows about it.`
          : '';
      }
      rerender();
    });
  },
};

/** Nudges the store so the screen repaints for local-only UI flags. */
function rerender() {
  store.setNearbyCategory(state.nearbyCategory);
}

function card(p) {
  const picked = store.isInSubRoute(p.id);
  const travel = (p.legs || []).reduce((sum, l) => sum + l.minutes, 0);
  return html`
    <div class="swipe-row mb8" data-place-row="${p.id}" data-place-name="${p.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${p.name}">${raw(icon.bin)}</button></div>
      <div class="swipe-face nearby-card${picked ? ' picked' : ''}">
      <button class="nearby-thumb" data-open-place="${p.id}" aria-label="Open ${p.name}"></button>
      <div class="grow">
        <div class="row g6" style="align-items:baseline">
          <button class="nearby-name" style="text-align:left" data-open-place="${p.id}">${p.name}</button>
          <span class="nearby-price">${p.priceTier}</span>
        </div>
        <div class="nearby-note">
          ${store.categoryLabel(p.category)} · ${p.note}${p.latitude ? '' : ' · no location'}
        </div>
        <div class="row g5 center wrap mt6">
          ${(p.legs || []).map((leg) => html`
            <span class="leg"><span style="font-size:11px">${MODE_ICONS[leg.mode]}</span>${MODE_LABELS[leg.mode]} ${leg.minutes}</span>`)}
          <span class="leg-total">${store.duration(travel)}</span>
          <span class="leg-stay">stay ~${store.duration(p.stayMinutes)}</span>
        </div>
      </div>
        <button class="nearby-add${picked ? ' on' : ''}" data-pick="${p.id}"
                aria-label="${picked ? 'Remove from sub route' : 'Add to sub route'}">${picked ? '✓' : '+'}</button>
      </div>
    </div>`;
}

function addForm() {
  return html`
    <div class="form mb10">
      <div class="form-title">Add a place</div>
      <input id="np-name" placeholder="Name, or paste a Google / Apple Maps link">
      <div class="row g8">
        <select id="np-cat" class="grow">
          ${Object.entries(CATEGORY_LABELS).map(([id, label]) => html`<option value="${id}">${label}</option>`)}
        </select>
        <input id="np-walk" placeholder="Walk min" style="width:104px" inputmode="numeric">
      </div>
      <div class="form-actions">
        <button class="btn jade grow" style="height:40px" data-act="add-save">Save</button>
        <button class="btn ghost" style="width:88px;height:40px" data-act="add-cancel">Cancel</button>
      </div>
      <div class="form-hint">
        A full map link brings the name and the position with it, and opening hours or a phone
        number when OpenStreetMap has them. Short <code>maps.app.goo.gl</code> links cannot be
        read by a browser — open one in Safari first and copy the full address.
      </div>
    </div>`;
}

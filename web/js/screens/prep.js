// Screen 2h — Trip prep. The six-day forecast strip drives the outfit advice,
// each line can explain itself ("Day 4: 80% rain"), and every item carries a
// tag for where it is packed. Categories and items can both be added.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { checkbox, swipeToDelete, forecastURL } from './parts.js';
import { PACKED_LOCATIONS } from '../data.js';

let addingTo = null;
let categoryOpen = false;

export default {
  id: 'prep',
  tab: 'prep',

  render() {
    const groups = store.prepGroups();
    const progress = store.prepProgress();
    const weather = state.trip?.weather || [];

    return html`
      <section class="screen">
        <div class="head">
          <div class="screen-title">Trip prep</div>
          <div class="screen-sub">
            ${state.trip?.dayCount || 0} days${state.trip?.departsInDays ? ` · departs in ${state.trip.departsInDays} days` : ''}
          </div>
          <div class="progress mt12"><i style="width:${progress.percent}%"></i></div>
          <div class="f11 w650 muted mt6">${progress.packed} of ${progress.total} packed</div>
        </div>

        <div class="scroll" style="padding:12px 16px 24px">
          <div class="card tight mb12" style="padding:12px 13px">
            <div class="row g8 center">
              <div class="eyebrow grow">WEATHER FORECAST</div>
              <a class="f11 w700" style="color:var(--jade)" href="${forecastURL()}"
                 target="_blank" rel="noopener">Hourly ›</a>
            </div>
            <div class="f11 w650 mt4" style="color:var(--faint)">${store.weatherStatus().line}</div>
            <div class="wx-strip">
              ${weather.map((w) => html`
                <div class="wx-day${w.dayNumber === state.selectedDay ? ' on' : ''}">
                  <div class="wx-d">D${w.dayNumber}</div>
                  <div class="wx-em">${w.icon}</div>
                  <div class="wx-hi">${w.high}°</div>
                  <div class="wx-rain">${w.rainChance}%</div>
                </div>`)}
            </div>
          </div>

          ${groups.map((group) => html`
            <div class="card-list mb12">
              <div class="swipe-row swipe-flat" data-cat-row="${group.title}">
                <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete the ${group.title} category">${raw(icon.bin)}</button></div>
                <div class="swipe-face row g8 center between" style="padding:11px 14px">
                  <div class="f13 w700">${group.title}</div>
                  <div class="f11 w700 soft">
                    ${group.items.filter((i) => i.packed).length}/${group.items.length}
                  </div>
                </div>
              </div>

              ${group.items.map((item) => {
                const where = PACKED_LOCATIONS.find((l) => l.id === item.packedIn) || PACKED_LOCATIONS[0];
                const packedSomewhere = item.packedIn !== 'notPacked';
                return html`
                  <div class="swipe-row swipe-flat" data-prep-row="${item.id}" data-prep-name="${item.name}">
                    <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button></div>
                    <div class="swipe-face prep-item">
                    ${checkbox(item.packed, { act: 'tick', id: item.id, size: 21 })}
                    <button class="grow" style="text-align:left" data-act="tick" data-id="${item.id}">
                      <div class="prep-name${item.packed ? ' done' : ''}">${item.name}</div>
                      ${item.why ? html`<div class="prep-why">${item.why}</div>` : ''}
                    </button>
                      <button class="where-chip${packedSomewhere ? ' on' : ''}" data-act="where" data-id="${item.id}">
                        ${where.label}
                      </button>
                    </div>
                  </div>`;
              })}

              ${addingTo === group.title ? html`
                <div class="row g6" style="padding:11px 14px;border-top:1px solid var(--line-3)">
                  <input id="new-item" class="grow" placeholder="Item name">
                  <button class="btn jade none" style="width:58px;height:37px" data-act="item-save" data-cat="${group.title}">Add</button>
                  <button class="btn ghost none" style="width:37px;height:37px" data-act="item-cancel" aria-label="Cancel">✕</button>
                </div>` : ''}

              <button class="prep-add" data-act="item-open" data-cat="${group.title}">+ Add item</button>
            </div>`)}

          ${categoryOpen ? html`
            <div class="row g6 mb10">
              <input id="new-cat" class="grow" placeholder="Category name">
              <button class="btn jade none" style="width:58px;height:37px" data-act="cat-save">Add</button>
              <button class="btn none" style="width:37px;height:37px;background:#fff;color:var(--muted)" data-act="cat-cancel" aria-label="Cancel">✕</button>
            </div>` : ''}

          <button class="btn-dashed" data-act="cat-open">+ New category</button>
        </div>
      </section>`;
  },

  mount(root) {
    swipeToDelete(root, {
      rowSelector: '[data-prep-row]',
      label: (row) => `Delete "${row.dataset.prepName}" from the packing list?`,
      onDelete: (row) => store.deletePrepItem(row.dataset.prepRow),
    });

    swipeToDelete(root, {
      rowSelector: '[data-cat-row]',
      label: (row) => `Delete the "${row.dataset.catRow}" category and every item in it?`,
      onDelete: (row) => store.deletePrepCategory(row.dataset.catRow),
    });

    delegate(root, '[data-act="tick"]', (el) => store.togglePrepItem(el.dataset.id));
    delegate(root, '[data-act="where"]', (el) => store.cyclePackedIn(el.dataset.id));

    delegate(root, '[data-act="item-open"]', (el) => { addingTo = el.dataset.cat; nudge(); });
    delegate(root, '[data-act="item-cancel"]', () => { addingTo = null; nudge(); });
    delegate(root, '[data-act="item-save"]', (el) => {
      const input = root.querySelector('#new-item');
      if (!input?.value.trim()) { addingTo = null; nudge(); return; }
      addingTo = null;
      store.addPrepItem(el.dataset.cat, input.value);
    });

    delegate(root, '[data-act="cat-open"]', () => { categoryOpen = true; nudge(); });
    delegate(root, '[data-act="cat-cancel"]', () => { categoryOpen = false; nudge(); });
    delegate(root, '[data-act="cat-save"]', () => {
      const input = root.querySelector('#new-cat');
      categoryOpen = false;
      if (input?.value.trim()) store.addPrepCategory(input.value);
      else nudge();
    });
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

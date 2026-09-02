// Screen 2b — Plan. The day as one column with two authorships: white cards
// on a solid jade spine for the agent's stops, a dashed amber card for your
// own. Edit mode adds a grip handle, editable times, ✕ to archive, and an
// add-a-stop form; removed stops fall into a dark archive at the bottom.

import { html, raw, icon, delegate, parseClock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { dayPills, weatherBanner, emptyDay, bindDragReorder } from './parts.js';

let addOpen = false;
let form = { place: '', time: '' };

export default {
  id: 'plan',
  tab: 'plan',

  render() {
    const day = store.day();
    const items = store.activeItems(day);
    const archived = store.archivedItems(day);
    const editing = state.editingPlan;
    const numbers = store.mainStopNumbers(day);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Day ${day?.dayNumber ?? ''}</div>
              <div class="screen-sub">${day?.dateLabel || ''}</div>
            </div>
            <button class="btn sm ${editing ? 'jade' : 'ghost'}" data-act="toggle-edit">
              ${editing ? 'Done' : 'Edit'}
            </button>
          </div>
          <div class="chiprow mt10">${dayPills({ small: true })}</div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${weatherBanner()}

          ${editing ? html`
            <div class="hint-amber mt14">Hold the handle to drag a stop into place. Times are editable, ✕ removes a stop into the archive below.</div>
          ` : ''}

          <div class="mt14" id="plan-rows">
            ${items.length ? items.map((item, index) => row(item, {
              editing, number: numbers[item.id], last: index === items.length - 1,
            })) : emptyDay(store.weather())}
          </div>

          ${editing ? html`
            ${addOpen ? addForm() : ''}
            <button class="btn-dashed mt8" data-act="add-open">+ Add a stop</button>
            ${archived.length ? archive(archived) : ''}
          ` : ''}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-day]', (el) => store.selectDay(Number(el.dataset.day)));
    delegate(root, '[data-act="toggle-edit"]', () => {
      addOpen = false;
      store.setEditingPlan(!state.editingPlan);
    });
    delegate(root, '[data-open]', (el) => {
      // Edit mode owns the row: drag, retime and remove, but no navigation.
      if (state.editingPlan) return;
      const hit = store.planItem(el.dataset.open);
      if (!hit) return;
      if (hit.item.isSubRouteSummary) go('sub');
      else go('dest', { itemID: el.dataset.open });
    });
    delegate(root, '[data-act="remove"]', (el) => store.archivePlanItem(state.selectedDay, el.dataset.id));
    delegate(root, '[data-act="restore"]', (el) => store.restorePlanItem(state.selectedDay, el.dataset.id));
    delegate(root, '[data-act="move-day"]', (el) => {
      store.movePlanItemToDay(state.selectedDay, el.dataset.id, Number(el.dataset.to));
    });

    // Times commit on change (i.e. as focus leaves) so a re-render cannot
    // interrupt typing.
    root.querySelectorAll('[data-time-for]').forEach((input) => {
      input.addEventListener('change', () => {
        const text = input.value.trim();
        if (parseClock(text) == null) {
          input.value = store.planItem(input.dataset.timeFor)?.item.time || '';
          return;
        }
        store.setPlanItemTime(state.selectedDay, input.dataset.timeFor, text);
      });
    });

    delegate(root, '[data-act="add-open"]', () => { addOpen = true; store.setEditingPlan(true); });
    delegate(root, '[data-act="add-cancel"]', () => { addOpen = false; store.setEditingPlan(true); });
    delegate(root, '[data-act="add-save"]', () => {
      const select = root.querySelector('#add-place');
      const time = root.querySelector('#add-time');
      const placeID = select?.value || '';
      if (!placeID) return;
      const source = store.place(placeID);
      store.addPlanItem(state.selectedDay, {
        name: source?.name || placeID,
        time: time?.value.trim() || '15:00',
        placeID: source ? placeID : null,
      });
      addOpen = false;
      form = { place: '', time: '' };
    });

    if (state.editingPlan) {
      bindDragReorder(root, {
        rowSelector: '[data-row-id]',
        handleSelector: '[data-grip]',
        onDrop: (movedId, beforeId) => store.movePlanItem(state.selectedDay, movedId, beforeId),
      });
    }
  },
};

function row(item, { editing, number, last }) {
  const view = store.decoratedItem(item);
  const isSub = view.kind === 'sub';
  return html`
    <div class="plan-row" data-row-id="${view.id}">
      ${editing ? html`<div class="handle-grip" data-grip>${raw(icon.grip)}</div>` : ''}

      <div class="plan-time">
        ${editing
          ? html`<input value="${view.time}" data-time-for="${view.id}" inputmode="numeric" aria-label="Time">`
          : html`<div class="plan-clock">${view.time}</div>
                 <div class="plan-dur">${view.durationLabel}</div>`}
      </div>

      <div class="plan-spine">
        <div class="plan-dot${isSub ? ' sub' : ''}"></div>
        ${last ? '' : html`<div class="plan-line${isSub ? ' sub' : ''}"></div>`}
      </div>

      <div class="plan-card${isSub ? ' sub' : ''}" data-open="${view.id}"
           role="button" tabindex="0" aria-label="${view.name}">
        <div class="row g8" style="align-items:flex-start">
          <div class="grow">
            <div class="plan-name">${view.name}</div>
            <div class="plan-note">${view.note}</div>
          </div>
          ${editing
            ? html`<button class="plan-remove" data-act="remove" data-id="${view.id}" aria-label="Remove ${view.name}">✕</button>`
            : html`<span class="badge ${isSub ? 'sub' : 'main'}">${isSub ? 'SUB' : `MAIN${number ? ` ${number}` : ''}`}</span>`}
        </div>
        ${view.chips?.length ? html`
          <div class="row g6 wrap mt8">${view.chips.map((c) => html`<span class="chip">${c}</span>`)}</div>
        ` : ''}
      </div>
    </div>`;
}

function addForm() {
  const options = store.nearbyPlaces();
  return html`
    <div class="form mt8">
      <div class="form-title">Add a stop</div>
      <select id="add-place">
        <option value="">From saved or nearby places</option>
        ${options.map((p) => html`<option value="${p.id}">${p.name}</option>`)}
      </select>
      <div class="row g8">
        <input id="add-time" placeholder="Time" value="${form.time}" style="width:96px" inputmode="numeric">
        <button class="btn jade grow" data-act="add-save">Add</button>
        <button class="btn ghost none" data-act="add-cancel" style="width:38px" aria-label="Cancel">✕</button>
      </div>
      <div class="form-hint">Pick from places you have saved or added nearby. It drops into the day at the time you set, and you can drag it afterwards.</div>
    </div>`;
}

function archive(rows) {
  const dayCount = state.trip?.dayCount || 6;
  return html`
    <div class="mt18">
      <div class="eyebrow">REMOVED FROM THIS DAY</div>
      ${rows.map((item) => html`
        <div class="archive-card">
          <div class="row g8" style="align-items:flex-start">
            <div class="grow">
              <div class="archive-name">${item.name}</div>
              <div class="archive-was">was ${item.time}</div>
            </div>
            <button class="archive-btn" data-act="restore" data-id="${item.id}">Add back</button>
          </div>
          <div class="row g6 center mt8 wrap">
            <span class="archive-move">MOVE TO</span>
            ${Array.from({ length: dayCount }, (_, i) => i + 1)
              .filter((n) => n !== state.selectedDay)
              .map((n) => html`<button class="archive-day" data-act="move-day" data-id="${item.id}" data-to="${n}">D${n}</button>`)}
          </div>
        </div>`)}
    </div>`;
}

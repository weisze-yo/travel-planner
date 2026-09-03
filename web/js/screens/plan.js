// Screen 2b — Plan. The day as one column with two authorships: white cards
// on a solid jade spine for the agent's stops, a dashed amber card for each
// stretch of free time you gave yourself.
//
// Three of this round's items live here. A stop now carries a start and a
// length, so its end is worked out and shown rather than typed (item 06), and
// a day that reads back out of order says so on the row rather than refusing
// the drag. A day can hold as many loops as it has gaps (item 05). And the
// whole itinerary can arrive at once by being pasted in (item 01).

import { html, raw, icon, delegate, parseClock, parseDuration } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { dayPills, weatherBanner, emptyDay, bindDragReorder, swipeToDelete } from './parts.js';

let addOpen = false;
let form = { name: '', time: '', duration: '', kind: 'main' };
let notice = '';

export default {
  id: 'plan',
  tab: 'plan',

  render() {
    const day = store.day();
    const items = store.activeItems(day);
    const archived = store.archivedItems(day);
    const editing = state.editingPlan;
    const numbers = store.mainStopNumbers(day);
    const issues = store.dayIssues();
    const loops = store.subRoutesFor();

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Day ${day?.dayNumber ?? ''}</div>
              <div class="screen-sub">${day?.dateLabel || ''}</div>
            </div>
            <button class="iconbtn filled" data-act="toggle-edit"
                    style="${editing ? 'background:var(--jade)' : ''}"
                    aria-label="${editing ? 'Finish editing' : 'Edit this day'}"
                    aria-pressed="${editing ? 'true' : 'false'}">
              ${raw(editing ? icon.tick('#fff', 15) : icon.pencil('#14201C', 17))}
            </button>
          </div>
          <div class="chiprow mt10">${dayPills({ small: true })}</div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${weatherBanner()}

          ${issues.size && !editing ? html`
            <div class="day-alert mt14">
              ${issues.size} stop${issues.size === 1 ? '' : 's'} on this day need a look —
              the times below say why. Press the pencil to fix them.
            </div>` : ''}

          ${editing ? html`
            <div class="hint-amber mt14">
              Hold the handle to drag a stop into place. Set the time it starts and how long you
              have; the end is worked out. ✕ removes a stop into the archive below, and a swipe
              left on a stretch of free time deletes it.
            </div>
          ` : ''}

          <div class="mt14" id="plan-rows">
            ${items.length ? items.map((item, index) => row(item, {
              editing,
              number: numbers[item.id],
              last: index === items.length - 1,
              issues: issues.get(item.id) || [],
            })) : emptyDay(store.weather())}
          </div>

          ${editing ? html`
            ${notice ? html`<div class="amber-note f12 mt8">${notice}</div>` : ''}
            ${addOpen ? addForm() : ''}
            <button class="btn-dashed mt8" data-act="add-open">+ Add a stop</button>
            <div class="row g8 mt8">
              <button class="btn ghost grow" data-act="add-loop">+ Free time</button>
              <button class="btn ghost grow" data-act="paste">Paste an itinerary</button>
            </div>
            <div class="f11 soft lh145 mt8">
              ${loops.length
                ? `${loops.length} stretch${loops.length === 1 ? '' : 'es'} of free time on this day.
                   Another one goes into the largest gap left.`
                : 'Free time is a stretch you own inside the day — it goes into the largest gap you have.'}
            </div>
          ` : ''}

          ${archived.length ? archive(archived, editing) : ''}
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
      // Edit mode owns live rows — drag, retime, remove — but an archived row
      // is only ever a link.
      const archivedRow = el.closest('[data-plan-row]');
      if (state.editingPlan && !archivedRow) return;
      openRow(el.dataset.open);
    });
    // A loop's row is a link in both modes: retiming a loop happens on its
    // own screen, where the budget it changes is visible.
    delegate(root, '[data-open-loop]', (el) => {
      store.selectLoop(el.dataset.openLoop);
      go('sub', { loopID: el.dataset.openLoop });
    });
    delegate(root, '[data-act="remove"]', (el) => store.archivePlanItem(state.selectedDay, el.dataset.id));
    delegate(root, '[data-act="restore"]', (el) => store.restorePlanItem(state.selectedDay, el.dataset.id));
    delegate(root, '[data-act="move-day"]', (el) => {
      store.movePlanItemToDay(state.selectedDay, el.dataset.id, Number(el.dataset.to));
    });

    // Times and lengths commit on change (i.e. as focus leaves) so a
    // re-render cannot interrupt typing.
    root.querySelectorAll('[data-time-for]').forEach((input) => {
      input.addEventListener('change', () => {
        const text = input.value.trim();
        if (parseClock(text) == null) {
          input.value = store.planItem(input.dataset.timeFor)?.item.time || '';
          return;
        }
        store.setPlanItemWindow(state.selectedDay, input.dataset.timeFor, { time: text });
      });
    });

    root.querySelectorAll('[data-dur-for]').forEach((input) => {
      input.addEventListener('change', () => {
        const text = input.value.trim();
        // Blank means "no end set", which is a real answer and not an error.
        const minutes = text === '' ? null : parseDuration(text);
        if (text !== '' && minutes == null) {
          const current = store.planItem(input.dataset.durFor)?.item.durationMinutes;
          input.value = current || '';
          return;
        }
        store.setPlanItemWindow(state.selectedDay, input.dataset.durFor, { durationMinutes: minutes });
      });
    });

    delegate(root, '[data-act="paste"]', () => go('paste'));
    delegate(root, '[data-act="add-loop"]', () => {
      const loop = store.addSubRoute(state.selectedDay);
      if (loop) go('sub', { loopID: loop.id });
    });

    delegate(root, '[data-act="add-open"]', () => { addOpen = true; store.setEditingPlan(true); });
    delegate(root, '[data-act="add-cancel"]', () => { addOpen = false; store.setEditingPlan(true); });
    delegate(root, '[data-act="add-save"]', async () => {
      const placeID = root.querySelector('#add-place')?.value || '';
      const typed = root.querySelector('#add-name')?.value.trim();
      if (!typed && !placeID) return;

      const time = root.querySelector('#add-time')?.value.trim() || '09:00';
      const durationMinutes = parseDuration(root.querySelector('#add-dur')?.value.trim());
      const kind = root.querySelector('[name="add-kind"]:checked')?.value || 'main';

      addOpen = false;
      notice = /^https?:/i.test(typed) ? 'Reading that link…' : 'Adding…';
      store.setEditingPlan(true);

      // The same capture the Nearby screen uses — a stop is a visit to a place.
      const result = await store.captureStop(state.selectedDay, {
        input: typed, time, kind, placeID: placeID || null, durationMinutes,
      });

      notice = result.saved
        ? (result.located ? '' : `"${result.name}" was added without a location, so it will not show on the map.`)
        : result.reason;
      form = { name: '', time: '', duration: '', kind: 'main' };
      store.setEditingPlan(true);
    });

    root.querySelector('#add-place')?.addEventListener('change', (event) => {
      const hit = store.place(event.target.value);
      const nameBox = root.querySelector('#add-name');
      if (hit && nameBox && !nameBox.value.trim()) nameBox.value = hit.name;
    });

    // Two swipe targets on this screen, both landing on the same red bin with
    // the same confirmation: an archived stop, and a stretch of free time.
    swipeToDelete(root, {
      rowSelector: '[data-plan-row]',
      label: (el) => `Delete "${el.dataset.planName}" from this trip? It will not go to the archive.`,
      onDelete: (el) => store.deletePlanItem(state.selectedDay, el.dataset.planRow),
    });
    swipeToDelete(root, {
      rowSelector: '[data-loop-row]',
      label: (el) => `Delete "${el.dataset.loopName}"? The places you picked stay saved; only the loop goes.`,
      onDelete: (el) => store.deleteSubRoute(el.dataset.loopRow),
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

function openRow(id) {
  const hit = store.planItem(id);
  if (!hit) return;
  if (hit.item.isSubRouteSummary) {
    store.selectLoop(hit.item.subRouteID);
    go('sub', { loopID: hit.item.subRouteID });
  } else {
    go('dest', { itemID: id });
  }
}

function row(item, { editing, number, last, issues }) {
  const view = store.decoratedItem(item);
  const isSub = view.kind === 'sub';
  const window = store.itemWindow(view);
  const worst = issues.some((i) => i.tone === 'danger') ? 'danger' : (issues[0]?.tone || '');

  const card = html`
    <div class="row g8" style="align-items:flex-start">
      <div class="grow">
        <div class="plan-name">${view.name}</div>
        <div class="plan-note">${view.note}</div>
      </div>
      ${editing && !isSub
        ? html`<button class="plan-remove" data-act="remove" data-id="${view.id}" aria-label="Remove ${view.name}">✕</button>`
        : html`<span class="badge ${isSub ? 'sub' : 'main'}">${isSub ? 'FREE' : `MAIN${number ? ` ${number}` : ''}`}</span>`}
    </div>

    ${issues.map((issue) => html`
      <div class="plan-warn${issue.tone === 'danger' ? ' danger' : ''}">${issue.text}</div>`)}

    ${editing && !isSub ? html`
      <div class="dur-row">
        <span class="dur-k">FOR</span>
        <input class="dur-input" value="${window.minutes || ''}" placeholder="—"
               data-dur-for="${view.id}" inputmode="numeric" aria-label="How long, in minutes">
        <span class="dur-k">MIN</span>
        <span class="dur-out">${window.end != null ? `ends ${window.endLabel}` : 'no end set'}</span>
      </div>` : ''}

    ${!editing && (view.chips?.length || window.durationLabel) ? html`
      <div class="row g6 wrap mt8">
        ${window.durationLabel ? html`<span class="chip">${window.durationLabel} here</span>` : ''}
        ${(view.chips || []).map((c) => html`<span class="chip">${c}</span>`)}
      </div>` : ''}`;

  return html`
    <div class="plan-row" data-row-id="${view.id}">
      ${editing ? html`<div class="handle-grip" data-grip>${raw(icon.grip)}</div>` : ''}

      <div class="plan-time">
        ${editing && !isSub
          ? html`<input value="${window.startLabel}" data-time-for="${view.id}" inputmode="numeric" aria-label="Start time">`
          : html`<div class="plan-clock${worst === 'danger' ? ' bad' : ''}">${window.startLabel}</div>`}
        ${window.end != null && !(editing && !isSub)
          ? html`<div class="plan-end">–${window.endLabel}</div>`
          : ''}
      </div>

      <div class="plan-spine">
        <div class="plan-dot${isSub ? ' sub' : ''}"></div>
        ${last ? '' : html`<div class="plan-line${isSub ? ' sub' : ''}"></div>`}
      </div>

      ${isSub ? html`
        <div class="swipe-row plan-swipe grow" data-loop-row="${view.subRouteID}" data-loop-name="${view.name}">
          <div class="swipe-bin">
            <button class="bin" data-swipe-delete aria-label="Delete ${view.name}">${raw(icon.bin)}</button>
          </div>
          <button class="swipe-face plan-card sub" data-open-loop="${view.subRouteID}" aria-label="${view.name}">
            ${card}
          </button>
        </div>`
        : html`
        <div class="plan-card" data-open="${view.id}"
             role="button" tabindex="0" aria-label="${view.name}">
          ${card}
        </div>`}
    </div>`;
}

function addForm() {
  const saved = store.allPlaces();
  return html`
    <div class="form mt8">
      <div class="form-title">Add a stop</div>

      <input id="add-name" placeholder="Name, or paste a Google / Apple Maps link" value="${form.name}">

      ${saved.length ? html`
        <select id="add-place">
          <option value="">…or pick somewhere you have saved</option>
          ${saved.map((p) => html`<option value="${p.id}">${p.name}</option>`)}
        </select>` : ''}

      <div class="row g6 wrap">
        ${[['main', "The agent's route"], ['sub', 'My own plan']].map(([value, label]) => html`
          <label class="pill small" style="background:#fff;border:1px solid var(--field)">
            <input type="radio" name="add-kind" value="${value}"${value === form.kind ? ' checked' : ''}
                   style="width:14px;height:14px;padding:0;margin:0;accent-color:#14201C">
            ${label}
          </label>`)}
      </div>

      <div class="row g8">
        <label class="none">
          <span class="f11 soft">Starts</span>
          <input id="add-time" placeholder="09:00" value="${form.time}" style="width:82px" inputmode="numeric">
        </label>
        <label class="none">
          <span class="f11 soft">For</span>
          <input id="add-dur" placeholder="min" value="${form.duration}" style="width:70px" inputmode="numeric">
        </label>
        <button class="btn jade grow" style="align-self:flex-end" data-act="add-save">Add</button>
        <button class="btn ghost none" data-act="add-cancel" style="width:38px;align-self:flex-end" aria-label="Cancel">✕</button>
      </div>

      <div class="form-hint">
        The same way you add a place anywhere else: type a name, paste a map link, or pick
        something you saved earlier. A link brings the position with it, and opening hours
        where OpenStreetMap has them. "For" is how long you have there — leave it blank if
        you do not know yet.
      </div>
    </div>`;
}

/**
 * Point 11: removed stops stay visible on the day so you can still open them
 * and read their info. Putting one back, or moving it to another day, is an
 * edit — so those controls only appear in edit mode.
 */
function archive(rows, editing) {
  const dayCount = state.trip?.dayCount || 6;
  return html`
    <div class="mt18">
      <div class="eyebrow">REMOVED FROM THIS DAY</div>
      ${rows.map((item) => html`
        <div class="swipe-row mt8" data-plan-row="${item.id}" data-plan-name="${item.name}">
          <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button></div>
          <div class="swipe-face archive-card">
            <div class="row g8" style="align-items:flex-start">
              <button class="grow" style="text-align:left" data-open="${item.id}">
                <div class="archive-name">${item.name}</div>
                <div class="archive-was">was ${item.time} · tap to open</div>
              </button>
              ${editing
                ? html`<button class="archive-btn" data-act="restore" data-id="${item.id}">Add back</button>`
                : ''}
            </div>
            ${editing ? html`
              <div class="row g6 center mt8 wrap">
                <span class="archive-move">MOVE TO</span>
                ${Array.from({ length: dayCount }, (_, i) => i + 1)
                  .filter((n) => n !== state.selectedDay)
                  .map((n) => html`<button class="archive-day" data-act="move-day" data-id="${item.id}" data-to="${n}">D${n}</button>`)}
              </div>` : ''}
          </div>
        </div>`)}
    </div>`;
}
